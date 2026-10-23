import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalStore} from '../local/local-store';
import {SqliteStore} from '../local/sqlite-store';
import type {TreasuryStore} from './store';
import {TreasuryService} from './treasury-service';

const dirs:string[]=[];
const actor={tenantId:'t1',userId:'maker',role:'MAKER' as const};
const iban='IR062960000000100324200001';
const open=(kind:'local'|'sqlite')=>{
  const dir=mkdtempSync(join(tmpdir(),'tf-atomic-audit-'));
  dirs.push(dir);
  const file=join(dir,kind==='sqlite'?'ledger.sqlite':'ledger.json');
  const store: TreasuryStore=kind==='sqlite'?new SqliteStore(file):new LocalStore(file);
  return {file,store,service:new TreasuryService(store,actor)};
};
afterEach(()=>{for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true})});

describe.each(['local','sqlite'] as const)('%s transactional finance audit',kind=>{
  it('commits each create and exactly one audit record in a single update',()=>{
    const {store,service}=open(kind);
    let updates=0;
    const tracked: TreasuryStore={
      snapshot:()=>store.snapshot(),
      update:mutation=>{updates++;return store.update(mutation)}
    };
    const s=new TreasuryService(tracked,actor);
    s.createAccount({id:'a1',name:'حساب آزمایشی',bankName:'بانک آزمایشی',iban});
    expect(updates).toBe(1);
    s.createBeneficiary({id:'b1',name:'ذی‌نفع آزمایشی',iban,whitelisted:true});
    expect(updates).toBe(2);
    const row=s.createPayment({id:'p1',sourceAccountId:'a1',beneficiaryId:'b1',
      amountIrr:125000,paymentDate:'2026-10-23',clientReference:'ATOMIC-001',description:'synthetic only'});
    expect(row.state).toBe('DRAFT');
    expect(updates).toBe(3);
    expect(s.listAudit().map(x=>x.action)).toEqual([
      'ACCOUNT_CREATED','BENEFICIARY_CREATED','PAYMENT_CREATED'
    ]);
    expect(s.listPayments()).toHaveLength(1);
    if(store instanceof SqliteStore)store.close();
    expect(service.listAudit).toBeDefined();
  });

  it('rolls back both entity and audit when storage fails after mutation',()=>{
    const {store}=open(kind);
    const s=new TreasuryService(store,actor);
    s.createAccount({id:'a1',name:'حساب آزمایشی',bankName:'بانک آزمایشی',iban});
    s.createBeneficiary({id:'b1',name:'ذی‌نفع آزمایشی',iban,whitelisted:true});
    const before=store.snapshot();
    let updates=0;
    const fault: TreasuryStore={
      snapshot:()=>store.snapshot(),
      update:mutate=>{
        updates++;
        return store.update(snapshot=>{
          const mutated=mutate(snapshot);
          expect(mutated.payments).toHaveLength(1);
          expect(mutated.audit.at(-1)?.action).toBe('PAYMENT_CREATED');
          throw Error('SIMULATED_COMMIT_FAILURE');
        });
      }
    };
    const failing=new TreasuryService(fault,actor);
    expect(()=>failing.createPayment({id:'p-fail',sourceAccountId:'a1',beneficiaryId:'b1',
      amountIrr:200000,paymentDate:'2026-10-23',clientReference:'SIM-ROLLBACK',
      description:'failure injection'})).toThrow('SIMULATED_COMMIT_FAILURE');
    expect(updates).toBe(1);
    expect(store.snapshot()).toEqual(before);
    if(store instanceof SqliteStore)store.close();
  });
});

describe('SQLite locking and rollback',()=>{
  it('serializes the read snapshot under the write transaction',()=>{
    const dir=mkdtempSync(join(tmpdir(),'tf-sqlite-race-'));
    dirs.push(dir);
    const path=join(dir,'race.db');
    const left=new SqliteStore(path),right=new SqliteStore(path);
    try{
      left.update(d=>{
        expect(()=>right.update(other=>{
          other.meta.organizationName='OVERWRITING_CONCURRENT_WRITER';return other;
        })).toThrow();
        d.meta.organizationName='FIRST_SERIALIZED_WRITER';
        return d;
      });
      expect(left.snapshot().meta.organizationName).toBe('FIRST_SERIALIZED_WRITER');
      expect(right.snapshot().meta.organizationName).toBe('FIRST_SERIALIZED_WRITER');
    }finally{left.close();right.close()}
  });
});
