import {afterEach,describe,it,expect} from 'vitest';
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
const pay=(id:string,amount:number,clientReference:string)=>({
  id,sourceAccountId:'a1',beneficiaryId:'b1',amountIrr:amount,
  paymentDate:'2026-10-23',clientReference,description:'synthetic race'
});
function fixture(kind:'local'|'sqlite'){
  const dir=mkdtempSync(join(tmpdir(),'tf-finance-race-'));dirs.push(dir);
  const store: TreasuryStore=kind==='sqlite'
    ?new SqliteStore(join(dir,'store.db')):new LocalStore(join(dir,'store.json'));
  const other=new TreasuryService(store,actor);
  other.createAccount({id:'a1',name:'A',bankName:'Test bank',iban});
  other.createBeneficiary({id:'b1',name:'B',iban,whitelisted:true});
  return {store,other,close:()=>{if(store instanceof SqliteStore)store.close()}};
}
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{force:true,recursive:true})});

describe.each(['local','sqlite'] as const)('%s write-time financial guards',kind=>{
  it('rejects a duplicate financial fingerprint introduced after preflight',()=>{
    const {store,other,close}=fixture(kind);
    let injected=false;
    const interleaved: TreasuryStore={
      snapshot:()=>store.snapshot(),
      update:mutate=>{
        if(!injected){injected=true;other.createPayment(pay('p-prior',12500,'PRIOR')); }
        return store.update(mutate);
      }
    };
    const attempted=new TreasuryService(interleaved,actor);
    expect(()=>attempted.createPayment(pay('p-late',12500,'DIFFERENT')))
      .toThrow(/duplicate payment/i);
    expect(injected).toBe(true);
    expect(other.listPayments().map(x=>x.id)).toEqual(['p-prior']);
    expect(other.listAudit().filter(x=>x.action==='PAYMENT_CREATED')).toHaveLength(1);
    close();
  });

  it('rejects case-insensitive reference collisions with different amounts',()=>{
    const {store,other,close}=fixture(kind);
    other.createPayment(pay('p-first',10000,'CASE-ID'));
    expect(()=>other.createPayment(pay('p-second',10001,'case-id')))
      .toThrow(/duplicate payment reference/i);
    expect(other.listPayments()).toHaveLength(1);
    expect(other.listAudit().filter(x=>x.action==='PAYMENT_CREATED')).toHaveLength(1);
    close();
  });

  it('rejects a source account removed between preflight and commit',()=>{
    const {store,other,close}=fixture(kind);
    let removed=false;
    const interleaved: TreasuryStore={
      snapshot:()=>store.snapshot(),
      update:mutate=>{
        if(!removed){
          removed=true;
          store.update(d=>{d.accounts=d.accounts.filter(x=>x.id!=='a1');return d});
        }
        return store.update(mutate);
      }
    };
    const attempted=new TreasuryService(interleaved,actor);
    expect(()=>attempted.createPayment(pay('p-removed',20000,'NO-SOURCE')))
      .toThrow('source account not found');
    expect(removed).toBe(true);
    expect(other.listPayments()).toHaveLength(0);
    expect(other.listAudit().some(x=>x.action==='PAYMENT_CREATED')).toBe(false);
    close();
  });
});
