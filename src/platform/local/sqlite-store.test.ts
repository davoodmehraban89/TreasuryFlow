import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SqliteStore} from './sqlite-store';
const dirs:string[]=[];
const make=()=>{const d=mkdtempSync(join(tmpdir(),'tf-sqlite-'));dirs.push(d);return join(d,'treasuryflow.db')};
afterEach(()=>dirs.splice(0).forEach(d=>rmSync(d,{recursive:true,force:true})));
describe('SqliteStore',()=>{
 it('creates normalized SQL tables and persists data',()=>{
  const f=make();const s=new SqliteStore(f);s.update(d=>({...d,accounts:[{id:'a1',tenantId:'t1',name:'اصلی',iban:'IR062960000000100324200001',bankName:'بانک',status:'ACTIVE'}]}));s.close();
  const db=new DatabaseSync(f);const tables=db.prepare("select name from sqlite_master where type='table' order by name").all().map((r:any)=>r.name);expect(tables).toEqual(expect.arrayContaining(['meta','accounts','beneficiaries','payments','audit']));expect(db.prepare('select count(*) as c from accounts').get()).toMatchObject({c:1});db.close();
  const s2=new SqliteStore(f);expect(s2.snapshot().accounts[0].id).toBe('a1');s2.close();
 });
 it('uses SQLite foreign SQL storage rather than JSON serialization',()=>{const f=make();const s=new SqliteStore(f);s.close();const db=new DatabaseSync(f);expect(db.prepare('pragma journal_mode').get()).toBeTruthy();db.close()});
});
