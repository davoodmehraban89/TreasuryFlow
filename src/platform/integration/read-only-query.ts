/**
 * SQL Server preview guard: defense in depth, NOT SQL authorization.
 * Production execution also requires a verified SELECT-only SQL principal.
 */
export const SAMPLE_READ_ONLY_SQL = `SELECT TOP (100)
    Row_ID,
    Destination_IBAN,
    Beneficiary_Name,
    Amount_IRR,
    Client_Reference,
    Payment_Identifier,
    Deposit_Identifier
FROM dbo.TreasuryTransferSource
ORDER BY Row_ID`;
export const READ_ONLY_MAX_ROWS = 100;
const MAX_SQL_LENGTH = 12000;
const FORBIDDEN = new Set([
 'INSERT','UPDATE','DELETE','MERGE','TRUNCATE','DROP','ALTER','CREATE',
 'EXEC','EXECUTE','WAITFOR','DBCC','BACKUP','RESTORE','GRANT','REVOKE',
 'DENY','INTO','USE','DECLARE','SET','OPENQUERY','OPENROWSET',
 'OPENDATASOURCE','OPENXML','BULK','SHUTDOWN','RECONFIGURE',
 'UNION','INTERSECT','EXCEPT','APPLY','NEXT'
]);
export class UnsafeReadOnlySqlError extends Error {
 readonly code:string;
 constructor(code:string,message:string){super(message);this.code=code;this.name='UnsafeReadOnlySqlError';}
}
const unsafe=(code:string,reason:string):never=>{throw new UnsafeReadOnlySqlError(code,reason);};
function maskSql(sql:string):string {
 let result='';
 for(let index=0;index<sql.length;){
  const ch=sql[index];
  if(ch==="'"||ch==='"'||ch==='['){
   const end=ch==='['?']':ch;let cursor=index+1;let closed=false;
   while(cursor<sql.length){
    if(sql[cursor]===end){
     if(sql[cursor+1]===end){cursor+=2;continue;}
     closed=true;cursor++;break;
    }cursor++;
   }
   if(!closed)unsafe('UNCLOSED_LITERAL','Unclosed SQL string or identifier');
   result+=' '.repeat(cursor-index);index=cursor;continue;
  }
  if(ch==='-'&&sql[index+1]==='-'||ch==='/'&&sql[index+1]==='*')
   unsafe('COMMENT_FORBIDDEN','SQL comments are not supported');
  if(ch===';')unsafe('MULTIPLE_STATEMENTS','Multiple statements are not supported');
  if(ch==='@'||ch==='#')unsafe('VARIABLE_FORBIDDEN','SQL variables/temporary tables are not supported');
  if(ch==='\0')unsafe('INVALID_CHARACTER','Null character is not allowed');
  result+=ch;index++;
 }
 return result;
}
export function prepareReadOnlySql(input:string):string {
 if(typeof input!=='string')unsafe('INVALID_QUERY','SQL query must be text');
 const query=input.trim();
 if(query.length===0||query.length>MAX_SQL_LENGTH)unsafe('INVALID_LENGTH','SQL query is empty or too long');
 const masked=maskSql(query);
 if(!/^SELECT\s+/i.test(masked))unsafe('SELECT_ONLY','Only SELECT is supported');
 if(/\bGO\b/i.test(masked))unsafe('BATCH_FORBIDDEN','SQL batch separator is not supported');
 if(/\.\s*\.\s*\./.test(masked))unsafe('REMOTE_IDENTIFIER','Remote SQL identifiers are not supported');
 const tokens=masked.match(/\b[A-Za-z_][A-Za-z_0-9]*\b/g)??[];
 for(const word of tokens)if(FORBIDDEN.has(word.toUpperCase()))
  unsafe('FORBIDDEN_OPERATION','Disallowed SQL operation: '+word.toUpperCase());
 if(/\b(?:xp_|sp_)\w*/i.test(masked))unsafe('PROCEDURE_FORBIDDEN','Stored procedure references are not supported');
 const prefixMatch=/^SELECT\s+(?:(?:DISTINCT|ALL)\s+)?/i.exec(query);
 if(!prefixMatch)throw new UnsafeReadOnlySqlError('SELECT_ONLY','Unexpected SQL prefix');
 const prefix=prefixMatch[0];
 if(!/^SELECT\s+(?:(?:DISTINCT|ALL)\s+)?$/i.test(masked.slice(0,prefix.length)))
  unsafe('SELECT_ONLY','Unexpected SQL prefix');
 const remaining=query.slice(prefix.length);
 const top=/^TOP\s*(?:\(\s*(\d+)\s*\)|(\d+)\b)/i.exec(remaining);
 if(top){
  const count=Number(top[1]??top[2]);
  if(!Number.isSafeInteger(count)||count<1||count>READ_ONLY_MAX_ROWS)
   unsafe('ROW_LIMIT','TOP must be between 1 and 100');
  if(/\bPERCENT\b|\bWITH\s+TIES\b/i.test(masked.slice(prefix.length)))
   unsafe('ROW_LIMIT','TOP PERCENT/WITH TIES are not supported');
  return query;
 }
 if(/^TOP\b/i.test(remaining))unsafe('ROW_LIMIT','TOP must be a numeric constant');
 return prefix+'TOP ('+READ_ONLY_MAX_ROWS+') '+remaining;
}
export function validateReadOnlySql(input:string):
 {ok:true;preparedSql:string}|{ok:false;code:string;message:string}{
 try{return {ok:true,preparedSql:prepareReadOnlySql(input)};}
 catch(error){
  if(error instanceof UnsafeReadOnlySqlError)return {ok:false,code:error.code,message:error.message};
  throw error;
 }
}
