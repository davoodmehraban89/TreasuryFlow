import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {COPYFILE_EXCL,copyFileSync,existsSync,mkdirSync,rmSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';

const expectedTables=['accounts','audit','beneficiaries','meta','payments'] as const;

/** Verify the entire backup, not just that SQLite can open its header. */
export function verifyTreasurySqliteBackup(file:string){
  const db=new DatabaseSync(file,{readOnly:true});
  try{
    const result=db.prepare('PRAGMA integrity_check').all() as Array<{integrity_check:string}>;
    if(result.length!==1||result[0].integrity_check!=='ok'){
      throw new Error('SQLITE_BACKUP_INTEGRITY_FAILED');
    }
    const tables=(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name:string}>)
      .map(row=>row.name);
    for(const name of expectedTables)if(!tables.includes(name)){
      throw new Error('SQLITE_BACKUP_REQUIRED_TABLE_MISSING');
    }
    const row=db.prepare("SELECT value FROM meta WHERE key='schema_version'").get() as {value?:string}|undefined;
    if(row?.value!=='1')throw new Error('SQLITE_BACKUP_UNSUPPORTED_SCHEMA');
    return {
      schemaVersion:1,
      accounts:Number((db.prepare('SELECT COUNT(*) AS count FROM accounts').get() as {count:number}).count),
      beneficiaries:Number((db.prepare('SELECT COUNT(*) AS count FROM beneficiaries').get() as {count:number}).count),
      payments:Number((db.prepare('SELECT COUNT(*) AS count FROM payments').get() as {count:number}).count),
      audit:Number((db.prepare('SELECT COUNT(*) AS count FROM audit').get() as {count:number}).count)
    };
  }finally{db.close()}
}

/**
 * VACUUM INTO makes a consistent SQLite snapshot, including committed WAL data.
 * The temporary file is unique and only files created by this invocation are
 * removed. COPYFILE_EXCL ensures an existing backup is never overwritten.
 */
export function createVerifiedSqliteBackup(db:DatabaseSync,destination:string){
  const dest=resolve(destination);
  if(existsSync(dest))throw new Error('SQLITE_BACKUP_DESTINATION_EXISTS');
  mkdirSync(dirname(dest),{recursive:true});
  const temporary=join(dirname(dest),'.treasuryflow-backup-'+randomUUID()+'.sqlite');
  let createdDestination=false;
  try{
    db.prepare('VACUUM main INTO ?').run(temporary);
    const summary=verifyTreasurySqliteBackup(temporary);
    copyFileSync(temporary,dest,COPYFILE_EXCL);
    createdDestination=true;
    const copied=verifyTreasurySqliteBackup(dest);
    if(JSON.stringify(summary)!==JSON.stringify(copied))throw new Error('SQLITE_BACKUP_VERIFICATION_MISMATCH');
    return copied;
  }catch(error){
    if(createdDestination)rmSync(dest,{force:true});
    throw error;
  }finally{
    rmSync(temporary,{force:true});
  }
}

/** Restore to a new location only. Never replace an existing operational DB. */
export function restoreVerifiedSqliteBackupToNewPath(source:string,destination:string){
  const src=resolve(source),dest=resolve(destination);
  if(src===dest||existsSync(dest))throw new Error('SQLITE_RESTORE_WOULD_OVERWRITE_EXISTING_DATA');
  const expected=verifyTreasurySqliteBackup(src);
  mkdirSync(dirname(dest),{recursive:true});
  let created=false;
  try{
    copyFileSync(src,dest,COPYFILE_EXCL);
    created=true;
    const recovered=verifyTreasurySqliteBackup(dest);
    if(JSON.stringify(expected)!==JSON.stringify(recovered))throw new Error('SQLITE_RESTORE_VERIFICATION_MISMATCH');
    return recovered;
  }catch(error){
    if(created)rmSync(dest,{force:true});
    throw error;
  }
}
