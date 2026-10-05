import {afterEach,describe,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalStore} from '../local/local-store';
import {TreasuryService} from './treasury-service';
import type {BankAdapter} from '../../domain/bank-adapter';

const dirs:string[]=[];
function newStore(){
  const dir=mkdtempSync(join(tmpdir(),'tf-dispatch-'));
  dirs.push(dir);
  return new LocalStore(join(dir,'store.json'));
}
afterEach(()=>dirs.splice(0).forEach(d=>rmSync(d,{recursive:true,force:true})));

function prepareQueued(store:LocalStore,id:string,amountIrr:number,reference:string,date:string){
  const maker=new TreasuryService(store,{tenantId:'local',userId:'maker',role:'MAKER'});
  maker.createAccount({id:'a1',name:'حساب',iban:'IR062960000000100324200001',bankName:'بانک'});
  maker.createBeneficiary({id:'b1',name:'ذی‌نفع',iban:'IR062960000000100324200001',whitelisted:true});
  maker.createPayment({id,sourceAccountId:'a1',beneficiaryId:'b1',amountIrr,paymentDate:date,clientReference:reference,description:''});
  maker.submitPayment(id);
  const checker=new TreasuryService(store,{tenantId:'local',userId:'checker',role:'CHECKER'});
  checker.approvePayment(id);
  checker.queuePayment(id);
  return checker;
}

describe('TreasuryService bank dispatch',()=>{
  it('records bank reference and moves queued payment to submitted',async()=>{
    const checker=prepareQueued(newStore(),'p1',1000,'R1','2026-10-06');
    const adapter:BankAdapter={submit:vi.fn().mockResolvedValue({outcome:'ACCEPTED',bankReference:'TRK-1'}),poll:vi.fn()};
    const p=await checker.dispatchPayment('p1',adapter);
    expect(p.state).toBe('SUBMITTED');
    expect(p.bankReference).toBe('TRK-1');
  });
  it('marks unknown bank outcome for manual review path',async()=>{
    const checker=prepareQueued(newStore(),'p2',1001,'R2','2026-10-07');
    const adapter:BankAdapter={submit:vi.fn().mockResolvedValue({outcome:'UNKNOWN',bankReference:'TRK-2'}),poll:vi.fn()};
    const p=await checker.dispatchPayment('p2',adapter);
    expect(p.state).toBe('UNKNOWN');
    expect(p.bankReference).toBe('TRK-2');
  });
});
