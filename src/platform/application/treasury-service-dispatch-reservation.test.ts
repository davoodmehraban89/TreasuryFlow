import {afterEach,describe,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {BankAdapter} from '../../domain/bank-adapter';
import type {TreasuryStore} from './store';
import {TreasuryService} from './treasury-service';
import {LocalStore} from '../local/local-store';
import {SqliteStore} from '../local/sqlite-store';

const paths:string[]=[];
const iban='IR062960000000100324200001';
afterEach(()=>{for(const p of paths.splice(0))rmSync(p,{recursive:true,force:true})});
const noopPoll=vi.fn();
function fixture(kind:'local'|'sqlite'){
  const dir=mkdtempSync(join(tmpdir(),'tf-reserve-'));paths.push(dir);
  const name=join(dir,kind==='local'?'ledger.json':'ledger.sqlite');
  const store:TreasuryStore=kind==='local'?new LocalStore(name):new SqliteStore(name);
  const maker=new TreasuryService(store,{tenantId:'local',userId:'maker',role:'MAKER'});
  maker.createAccount({id:'a1',name:'source',iban,bankName:'synthetic'});
  maker.createBeneficiary({id:'b1',name:'payee',iban,whitelisted:true});
  maker.createPayment({id:'p1',sourceAccountId:'a1',beneficiaryId:'b1',
    amountIrr:2000,paymentDate:'2026-10-23',clientReference:'RESERVED',description:''});
  maker.submitPayment('p1');
  const checker=new TreasuryService(store,{tenantId:'local',userId:'checker',role:'CHECKER'});
  checker.approvePayment('p1');
  checker.queuePayment('p1');
  return {store,checker,name,close:()=>{if(store instanceof SqliteStore)store.close()}};
}
describe.each(['local','sqlite'] as const)('%s durable no-retry bank dispatch',kind=>{
  it('reserves before the first bank call and blocks a simultaneous second send',async()=>{
    const {store,checker,name,close}=fixture(kind);
    let finish:(value:{outcome:'ACCEPTED';bankReference:string})=>void=()=>{};
    const request=new Promise<{outcome:'ACCEPTED';bankReference:string}>(resolve=>{finish=resolve});
    const adapter:BankAdapter={submit:vi.fn(()=>request),poll:noopPoll};
    const initial=checker.dispatchPayment('p1',adapter);
    expect(checker.getPayment('p1').state).toBe('DISPATCHING');
    const readOnly=kind==='local'?new LocalStore(name):new SqliteStore(name);
    const persisted=readOnly.snapshot().payments.find(p=>p.id==='p1');
    expect(persisted?.state).toBe('DISPATCHING');
    if(readOnly instanceof SqliteStore)readOnly.close();
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow('payment not eligible for dispatch');
    expect(adapter.submit).toHaveBeenCalledTimes(1);
    finish({outcome:'ACCEPTED',bankReference:'SYNTH-TRACKING-1'});
    const done=await initial;
    expect(done.state).toBe('SUBMITTED');
    expect(checker.listAudit().filter(x=>x.action==='PAYMENT_DISPATCH_RESERVED')).toHaveLength(1);
    expect(checker.listAudit().filter(x=>x.action==='PAYMENT_BANK_ACCEPTED')).toHaveLength(1);
    close();
  });
  it('marks transport exceptions UNKNOWN and never permits automatic retry',async()=>{
    const {checker,close}=fixture(kind);
    const adapter:BankAdapter={submit:vi.fn().mockRejectedValue(Error('synthetic timeout')),poll:noopPoll};
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow(/manual review/i);
    expect(checker.getPayment('p1').state).toBe('UNKNOWN');
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow('payment not eligible for dispatch');
    expect(adapter.submit).toHaveBeenCalledTimes(1);
    expect(checker.listAudit().filter(x=>x.action==='PAYMENT_BANK_UNKNOWN')).toHaveLength(1);
    close();
  });
  it('prevents any external submission if reservation cannot be stored',async()=>{
    const {store,close}=fixture(kind);
    const fault:TreasuryStore={snapshot:()=>store.snapshot(),update:()=>{throw Error('SYNTHETIC_DISK_FAILURE')}};
    const checker=new TreasuryService(fault,{tenantId:'local',userId:'checker',role:'CHECKER'});
    const adapter:BankAdapter={submit:vi.fn(),poll:noopPoll};
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow('SYNTHETIC_DISK_FAILURE');
    expect(adapter.submit).not.toHaveBeenCalled();
    expect(store.snapshot().payments.find(p=>p.id==='p1')?.state).toBe('QUEUED');
    close();
  });
  it('refuses automatic second submission after post-bank storage fails',async()=>{
    const {store,close}=fixture(kind);
    let updates=0;
    const fault:TreasuryStore={
      snapshot:()=>store.snapshot(),
      update:mutate=>{
        updates++;
        if(updates===2)throw Error('SYNTHETIC_COMMIT_FAILURE');
        return store.update(mutate);
      }
    };
    const checker=new TreasuryService(fault,{tenantId:'local',userId:'checker',role:'CHECKER'});
    const adapter:BankAdapter={submit:vi.fn().mockResolvedValue({outcome:'ACCEPTED',bankReference:'SYNTH-BR'}),poll:noopPoll};
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow('SYNTHETIC_COMMIT_FAILURE');
    expect(store.snapshot().payments.find(p=>p.id==='p1')?.state).toBe('DISPATCHING');
    await expect(checker.dispatchPayment('p1',adapter)).rejects.toThrow('payment not eligible for dispatch');
    expect(adapter.submit).toHaveBeenCalledTimes(1);
    close();
  });
});
