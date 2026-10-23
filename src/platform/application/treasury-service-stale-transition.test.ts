import {afterEach,describe,expect,it} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalStore} from '../local/local-store';
import {SqliteStore} from '../local/sqlite-store';
import type {TreasuryStore} from './store';
import {TreasuryService} from './treasury-service';

const dirs:string[]=[];
const iban='IR062960000000100324200001';
const maker={tenantId:'local',userId:'maker',role:'MAKER' as const};
const checker={tenantId:'local',userId:'checker',role:'CHECKER' as const};
afterEach(()=>dirs.splice(0).forEach(d=>rmSync(d,{recursive:true,force:true})));
function prepared(kind:'local'|'sqlite'){
  const dir=mkdtempSync(join(tmpdir(),'tf-stale-'));dirs.push(dir);
  const store:TreasuryStore=kind==='sqlite'
    ?new SqliteStore(join(dir,'db.sqlite')):new LocalStore(join(dir,'db.json'));
  const s=new TreasuryService(store,maker);
  s.createAccount({id:'a1',name:'source',bankName:'mock',iban});
  s.createBeneficiary({id:'b1',name:'payee',iban,whitelisted:true});
  s.createPayment({id:'p1',sourceAccountId:'a1',beneficiaryId:'b1',
    amountIrr:1000,paymentDate:'2026-10-23',clientReference:'GUARD-STATE',description:'synthetic'});
  return {store,s,checker:new TreasuryService(store,checker),
    close:()=>{if(store instanceof SqliteStore)store.close()}};
}
function race(store:TreasuryStore,mutate:(row:ReturnType<TreasuryStore['snapshot']>['payments'][number])=>void):TreasuryStore{
  let injected=false;
  return {snapshot:()=>store.snapshot(),update:callback=>{
    if(!injected){
      injected=true;
      store.update(d=>{const row=d.payments.find(p=>p.id==='p1');if(!row)throw Error('missing');mutate(row);return d});
    }
    return store.update(callback);
  }};
}
describe.each(['local','sqlite'] as const)('%s no stale financial transitions',kind=>{
  it('refuses submit after concurrent state mutation without fake audit',()=>{
    const {store,s,close}=prepared(kind);
    const racing=new TreasuryService(race(store,p=>{p.state='UNKNOWN'}),maker);
    expect(()=>racing.submitPayment('p1')).toThrow('stale payment state');
    expect(s.getPayment('p1').state).toBe('UNKNOWN');
    expect(s.listAudit().some(a=>a.action==='PAYMENT_SUBMITTED')).toBe(false);
    close();
  });
  it('refuses stale checker approval after concurrent cancellation',()=>{
    const {store,s,close}=prepared(kind);
    s.submitPayment('p1');
    const racing=new TreasuryService(race(store,p=>{p.state='FAILED'}),checker);
    expect(()=>racing.approvePayment('p1')).toThrow('payment not pending approval');
    expect(s.getPayment('p1').state).toBe('FAILED');
    expect(s.listAudit().some(a=>a.action==='PAYMENT_APPROVED')).toBe(false);
    close();
  });
  it('refuses stale queue if approved version changes before commit',()=>{
    const {store,s,checker:approved,close}=prepared(kind);
    s.submitPayment('p1');
    approved.approvePayment('p1');
    const racing=new TreasuryService(race(store,p=>{p.version++}),checker);
    expect(()=>racing.queuePayment('p1')).toThrow('stale payment state');
    expect(s.getPayment('p1').state).toBe('APPROVED');
    expect(s.listAudit().some(a=>a.action==='PAYMENT_QUEUED')).toBe(false);
    close();
  });
});
