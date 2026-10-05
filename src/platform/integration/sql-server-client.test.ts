import {describe,expect,it,vi} from 'vitest';
import {SqlServerAccountingAdapter} from './sql-server-client';
const config={server:'localhost',database:'Accounting',auth:'windows' as const};
describe('SqlServerAccountingAdapter',()=>{
 it('tests connectivity with a harmless read',async()=>{const query=vi.fn().mockResolvedValue({recordset:[{ok:1}]});const close=vi.fn();const connect=vi.fn().mockResolvedValue({request:()=>({query}),close});const a=new SqlServerAccountingAdapter(config,{connect} as any);expect(await a.testConnection()).toEqual({ok:true});expect(query).toHaveBeenCalledWith('SELECT 1 AS ok');expect(close).toHaveBeenCalled()});
 it('rejects writes when no approved contract exists',async()=>{const a=new SqlServerAccountingAdapter(config,{connect:vi.fn()} as any);await expect(a.executeApprovedWrite('anything',{})).rejects.toThrow(/approved write contract/i)});
 it('lists schema metadata without changing accounting data',async()=>{const rows=[{schema_name:'dbo',table_name:'Persons',column_name:'Code',data_type:'int'}];const query=vi.fn().mockResolvedValue({recordset:rows});const close=vi.fn();const connect=vi.fn().mockResolvedValue({request:()=>({query}),close});const a=new SqlServerAccountingAdapter(config,{connect} as any);expect(await a.inspectSchema()).toEqual(rows);expect(String(query.mock.calls[0][0])).toContain('INFORMATION_SCHEMA.COLUMNS')});
});
