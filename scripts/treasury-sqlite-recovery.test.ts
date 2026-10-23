import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,readFileSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteStore} from '../src/platform/local/sqlite-store';
import {TreasuryService} from '../src/platform/application/treasury-service';

const dirs:string[]=[];
const cmd=join(process.cwd(),'scripts','treasury-sqlite-recovery.mjs');
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true})});
function run(...args:string[]){
  return spawnSync(process.execPath,['--experimental-strip-types',cmd,...args],
    {encoding:'utf8',timeout:20000,env:{...process.env,BANK_ADAPTER_MODE:'disabled'}});
}
function setup(){
  const dir=mkdtempSync(join(tmpdir(),'tf-recovery-cli-'));dirs.push(dir);
  const src=join(dir,'live.sqlite'),store=new SqliteStore(src);
  const svc=new TreasuryService(store,{tenantId:'synthetic',userId:'maker',role:'MAKER'});
  const iban='IR062960000000100324200001';
  svc.createAccount({id:'first',name:'fake',bankName:'fake',iban});
  svc.createBeneficiary({id:'payee',name:'fake',iban,whitelisted:true});
  svc.createPayment({id:'draft',sourceAccountId:'first',beneficiaryId:'payee',
    amountIrr:321,paymentDate:'2026-10-23',clientReference:'CLI-RECOVERY',description:''});
  store.close();
  return {dir,src};
}
describe('offline-only recovery operator commands',()=>{
  it('creates backup, verifies, restores into new path, and preserves payment and audit',()=>{
    const {dir,src}=setup();
    const backup=join(dir,'backup.sqlite'),target=join(dir,'restored.sqlite');
    const first=run('backup',src,backup);
    expect(first.status).toBe(0);
    expect(JSON.parse(first.stdout)).toMatchObject({operation:'backup',status:'VERIFIED',payments:1,audit:3});
    const second=run('verify',backup);
    expect(second.status).toBe(0);
    expect(JSON.parse(second.stdout)).toMatchObject({operation:'verify',payments:1});
    const third=run('restore-new',backup,target);
    expect(third.status).toBe(0);
    const recovered=new SqliteStore(target);
    try{
      expect(recovered.snapshot().payments[0].clientReference).toBe('CLI-RECOVERY');
      expect(recovered.snapshot().audit).toHaveLength(3);
    }finally{recovered.close()}
  });
  it('never overwrites existing destinations, including empty and operational source',()=>{
    const {dir,src}=setup();
    const backup=join(dir,'backup.sqlite');
    expect(run('backup',src,backup).status).toBe(0);
    const original=readFileSync(backup);
    expect(run('backup',src,backup).status).toBe(1);
    expect(readFileSync(backup)).toEqual(original);
    expect(run('restore-new',backup,src).status).toBe(1);
    expect(run('verify',src).status).toBe(0);
    const empty=join(dir,'reserved.sqlite');
    writeFileSync(empty,'');
    expect(run('restore-new',backup,empty).status).toBe(1);
    expect(readFileSync(empty,'utf8')).toBe('');
  });
  it('rejects malformed, corrupt and missing inputs without creating any database',()=>{
    const {dir}=setup();
    const corrupt=join(dir,'corrupt.sqlite');
    writeFileSync(corrupt,'synthetic invalid header');
    const destination=join(dir,'should-not-exist.sqlite');
    const result=run('restore-new',corrupt,destination);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('RECOVERY_FAILED_SQLITE_OPERATION_REJECTED');
    expect(existsSync(destination)).toBe(false);
    expect(run('backup',join(dir,'missing.sqlite'),destination).status).toBe(1);
    expect(existsSync(destination)).toBe(false);
    expect(run('unexpected',corrupt,destination).status).toBe(2);
  });
});
