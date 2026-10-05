import {describe,expect,it} from 'vitest';
import {validateExternalSqlServerConfig,buildSqlServerReadModelPolicy} from './sql-server-adapter';
describe('external accounting SQL Server adapter policy',()=>{
 it('requires explicit server and database',()=>expect(validateExternalSqlServerConfig({server:'',database:'',auth:'windows'})).toEqual(expect.arrayContaining(['server','database'])));
 it('is read only by default',()=>expect(buildSqlServerReadModelPolicy()).toMatchObject({readOnly:true,allowArbitraryWrite:false,allowStoredProcedureWrite:false}));
 it('requires explicit approved write contract before accounting writes',()=>expect(buildSqlServerReadModelPolicy({approvedWriteContract:'peyvast-v1'})).toMatchObject({readOnly:false,allowArbitraryWrite:false,allowStoredProcedureWrite:true}));
});
