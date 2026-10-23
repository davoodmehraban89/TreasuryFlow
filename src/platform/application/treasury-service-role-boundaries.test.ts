import {afterEach,describe,it,expect,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {BankAdapter} from '../../domain/bank-adapter';
import {TreasuryService} from './treasury-service';
import {LocalStore} from '../local/local-store';
import {SqliteStore} from '../local/sqlite-store';

const dirs:string[]=[];
const iban='IR062960000000100324200001';
afterEach(()=>dirs.splice(0).forEach(p=>rmSync(p,{force:true,recursive:true})));
function prepared(kind:'local'|'sqlite'){
  const dir=mkdtempSync(join(tmpdir(),'tf-roles-'));dirs.push(dir);
  const store=kind==='local'?new LocalStore(join(dir,'db.json')):new SqliteStore(join(dir,'db.sqlite'));
  const actor=(userId:string,role:'MAKER'|'CHECKER'|'TREASURY_ADMIN')=>
    new TreasuryService(store,{tenantId:'local',userId,role});
  const maker=actor('maker-a','MAKER'),checker=actor('checker','CHECKER');
  const badMaker=actor('maker-b','MAKER'),admin=actor('admin','TREASURY_ADMIN');
  maker.createAccount({id:'a1',name:'synthetic source',bankName:'synthetic bank',iban});
  maker.createBeneficiary({id:'b1',name:'synthetic payee',iban,whitelisted:true});
  maker.createPayment({id:'p1',sourceAccountId:'a1',beneficiaryId:'b1',
    amountIrr:2000,paymentDate:'2026-10-23',clientReference:'ROLE-001',description:''});
  maker.submitPayment('p1');
  return {store,maker,checker,badMaker,admin,close:()=>{if(store instanceof SqliteStore)store.close()}};
}
describe.each(['local','sqlite'] as const)('%s financial role boundaries',kind=>{
  it('does not allow a different maker to approve another maker payment',()=>{
    const {maker,badMaker,close}=prepared(kind);
    expect(()=>badMaker.approvePayment('p1')).toThrow('checker role required');
    expect(maker.getPayment('p1').state).toBe('PENDING_APPROVAL');
    expect(maker.listAudit().some(x=>x.action==='PAYMENT_APPROVED')).toBe(false);
    close();
  });
  it('does not permit maker to queue checker-approved payment',()=>{
    const {maker,checker,badMaker,close}=prepared(kind);
    checker.approvePayment('p1');
    expect(()=>badMaker.queuePayment('p1')).toThrow('checker or admin role required');
    expect(maker.getPayment('p1').state).toBe('APPROVED');
    expect(maker.listAudit().some(x=>x.action==='PAYMENT_QUEUED')).toBe(false);
    close();
  });
  it('does not allow maker to send to bank or reserve a dispatch',async()=>{
    const {maker,checker,badMaker,close}=prepared(kind);
    checker.approvePayment('p1');checker.queuePayment('p1');
    const adapter:BankAdapter={submit:vi.fn(),poll:vi.fn()};
    await expect(badMaker.dispatchPayment('p1',adapter)).rejects.toThrow('checker or admin role required');
    expect(adapter.submit).not.toHaveBeenCalled();
    expect(maker.getPayment('p1').state).toBe('QUEUED');
    expect(maker.listAudit().some(x=>x.action==='PAYMENT_DISPATCH_RESERVED')).toBe(false);
    close();
  });
  it('does not permit maker to poll bank status',async()=>{
    const {maker,checker,badMaker,close}=prepared(kind);
    checker.approvePayment('p1');checker.queuePayment('p1');
    const adapter:BankAdapter={
      submit:vi.fn().mockResolvedValue({outcome:'ACCEPTED',bankReference:'SYNTH-REF'}),
      poll:vi.fn().mockResolvedValue('REJECTED')
    };
    await checker.dispatchPayment('p1',adapter);
    await expect(badMaker.pollPaymentStatus('p1',adapter)).rejects.toThrow('checker or admin role required');
    expect(adapter.poll).not.toHaveBeenCalled();
    expect(maker.getPayment('p1').state).toBe('SUBMITTED');
    close();
  });
  it('allows admin to queue checker-approved payment without forging checker role',()=>{
    const {maker,checker,admin,close}=prepared(kind);
    checker.approvePayment('p1');
    expect(admin.queuePayment('p1').state).toBe('QUEUED');
    expect(maker.listAudit().filter(x=>x.action==='PAYMENT_QUEUED')).toHaveLength(1);
    close();
  });
});
