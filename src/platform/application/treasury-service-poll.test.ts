import {afterEach,describe,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalStore} from '../local/local-store';
import {TreasuryService} from './treasury-service';
import type {BankAdapter} from '../../domain/bank-adapter';

const dirs:string[]=[];
function newStore(){
  const dir=mkdtempSync(join(tmpdir(),'tf-poll-'));
  dirs.push(dir);
  return new LocalStore(join(dir,'store.json'));
}
afterEach(()=>dirs.splice(0).forEach(d=>rmSync(d,{recursive:true,force:true})));

function prepared(){
  const store=newStore();
  const maker=new TreasuryService(store,{tenantId:'local',userId:'maker',role:'MAKER'});
  maker.createAccount({id:'a1',name:'حساب',iban:'IR062960000000100324200001',bankName:'بانک'});
  maker.createBeneficiary({id:'b1',name:'ذی‌نفع',iban:'IR062960000000100324200001',whitelisted:true});
  maker.createPayment({id:'p1',sourceAccountId:'a1',beneficiaryId:'b1',amountIrr:1000,paymentDate:'2026-10-06',clientReference:'R-POLL',description:''});
  maker.submitPayment('p1');
  const checker=new TreasuryService(store,{tenantId:'local',userId:'checker',role:'CHECKER'});
  checker.approvePayment('p1');
  checker.queuePayment('p1');
  return checker;
}

describe('bank status polling',()=>{
  it('moves rejected submitted payment to failed',async()=>{
    const s=prepared();
    const adapter:BankAdapter={submit:vi.fn().mockResolvedValue({outcome:'ACCEPTED',bankReference:'BR-1'}),poll:vi.fn().mockResolvedValue('REJECTED')};
    await s.dispatchPayment('p1',adapter);
    const p=await s.pollPaymentStatus('p1',adapter);
    expect(p.state).toBe('FAILED');
  });
  it('moves unknown poll outcome to UNKNOWN for manual review',async()=>{
    const s=prepared();
    const adapter:BankAdapter={submit:vi.fn().mockResolvedValue({outcome:'ACCEPTED',bankReference:'BR-1'}),poll:vi.fn().mockResolvedValue('UNKNOWN')};
    await s.dispatchPayment('p1',adapter);
    const p=await s.pollPaymentStatus('p1',adapter);
    expect(p.state).toBe('UNKNOWN');
  });
});
