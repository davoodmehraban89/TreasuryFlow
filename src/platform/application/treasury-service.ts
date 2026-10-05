import {createBankAccount,createBeneficiary} from '../../domain/core/master-data';
import {evaluatePaymentPolicy} from '../../domain/core/policy';
import {canApprove} from '../../domain/approvals/approval-policy';
import {transitionPayment} from '../../domain/payments/payment-state';
import {dashboard} from '../../domain/operations/dashboard';
import type {BankAdapter} from '../../domain/bank-adapter';
import {BankDispatchRegistry} from '../../domain/bank-adapter';
import {validateIranianIban} from '../../domain/iran/iban';
import {evaluatePaymentGuard} from '../../domain/payments/payment-guard';
import type {TreasuryStore} from './store';
import type {ActorContext,LocalAccount,LocalAudit,LocalBeneficiary,LocalPayment} from './types';

export class TreasuryService{
  constructor(private readonly store:TreasuryStore,private readonly actor:ActorContext){}

  private own<T extends {tenantId:string}>(rows:T[]){
    return rows.filter(x=>x.tenantId===this.actor.tenantId);
  }

  private appendAudit(action:string,entity:string){
    this.store.update(d=>{
      d.audit.push({
        tenantId:this.actor.tenantId,
        seq:d.audit.length+1,
        actor:this.actor.userId,
        action,
        entity,
        at:Date.now()
      });
      return d;
    });
  }

  listAccounts(){return this.own(this.store.snapshot().accounts)}
  listBeneficiaries(){return this.own(this.store.snapshot().beneficiaries)}
  listPayments(){return this.own(this.store.snapshot().payments)}
  listAudit():LocalAudit[]{return this.own(this.store.snapshot().audit).sort((a,b)=>a.seq-b.seq)}

  getPayment(id:string){
    const p=this.listPayments().find(x=>x.id===id);
    if(!p) throw new Error('payment not found');
    return p;
  }

  createAccount(input:{id:string;name:string;iban:string;bankName:string}){
    if(!input.name.trim()||!input.bankName.trim()) throw new Error('account fields required');
    createBankAccount({tenantId:this.actor.tenantId,id:input.id,iban:input.iban});
    const account:LocalAccount={
      ...input,
      name:input.name.trim(),
      bankName:input.bankName.trim(),
      iban:input.iban.replace(/\s/g,'').toUpperCase(),
      tenantId:this.actor.tenantId,
      status:'ACTIVE'
    };
    this.store.update(d=>{
      if(d.accounts.some(x=>x.tenantId===account.tenantId&&x.id===account.id)) throw new Error('duplicate account');
      d.accounts.push(account);
      return d;
    });
    this.appendAudit('ACCOUNT_CREATED',account.id);
    return account;
  }

  createBeneficiary(input:{id:string;name:string;iban:string;whitelisted:boolean}){
    if(!validateIranianIban(input.iban)) throw new Error('invalid Iranian IBAN');
    createBeneficiary({tenantId:this.actor.tenantId,id:input.id,name:input.name,accountTenantId:this.actor.tenantId});
    const beneficiary:LocalBeneficiary={
      ...input,
      name:input.name.trim(),
      iban:input.iban.replace(/\s/g,'').toUpperCase(),
      tenantId:this.actor.tenantId
    };
    this.store.update(d=>{
      if(d.beneficiaries.some(x=>x.tenantId===beneficiary.tenantId&&x.id===beneficiary.id)) throw new Error('duplicate beneficiary');
      d.beneficiaries.push(beneficiary);
      return d;
    });
    this.appendAudit('BENEFICIARY_CREATED',beneficiary.id);
    return beneficiary;
  }

  createPayment(input:{id:string;sourceAccountId:string;beneficiaryId:string;amountIrr:number;paymentDate:string;clientReference:string;description:string}){
    if(!Number.isSafeInteger(input.amountIrr)||input.amountIrr<=0) throw new Error('invalid amount');
    if(!input.paymentDate||!input.clientReference.trim()) throw new Error('payment fields required');
    if(!this.listAccounts().some(x=>x.id===input.sourceAccountId)) throw new Error('source account not found');
    const beneficiary=this.listBeneficiaries().find(x=>x.id===input.beneficiaryId);
    if(!beneficiary) throw new Error('beneficiary not found');
    const guard=evaluatePaymentGuard({sourceAccountId:input.sourceAccountId,beneficiaryId:input.beneficiaryId,iban:beneficiary.iban,amountIrr:input.amountIrr,clientReference:input.clientReference,paymentDate:input.paymentDate},this.listPayments().map(p=>({sourceAccountId:p.sourceAccountId,beneficiaryId:p.beneficiaryId,iban:this.listBeneficiaries().find(b=>b.id===p.beneficiaryId)?.iban??'',amountIrr:p.amountIrr,clientReference:p.clientReference,paymentDate:p.paymentDate})));
    if(!guard.ok) throw new Error(guard.code==='DUPLICATE_PAYMENT'?'duplicate payment':guard.code==='DUPLICATE_REFERENCE'?'duplicate payment reference':'invalid Iranian IBAN');
    const payment:LocalPayment={
      ...input,
      clientReference:input.clientReference.trim(),
      description:input.description.trim(),
      tenantId:this.actor.tenantId,
      makerId:this.actor.userId,
      version:1,
      state:'DRAFT'
    };
    this.store.update(d=>{
      if(d.payments.some(x=>x.tenantId===payment.tenantId&&(x.id===payment.id||x.clientReference===payment.clientReference))) throw new Error('duplicate payment reference');
      d.payments.push(payment);
      return d;
    });
    this.appendAudit('PAYMENT_CREATED',payment.id);
    return payment;
  }

  submitPayment(id:string){
    const payment=this.getPayment(id);
    if(payment.makerId!==this.actor.userId||payment.state!=='DRAFT') throw new Error('forbidden');
    const beneficiary=this.listBeneficiaries().find(x=>x.id===payment.beneficiaryId);
    const settled=this.listPayments().filter(x=>x.paymentDate===payment.paymentDate&&x.state==='SETTLED').reduce((sum,x)=>sum+x.amountIrr,0);
    const policy=evaluatePaymentPolicy({
      tenantId:payment.tenantId,
      beneficiaryId:payment.beneficiaryId,
      amountIrr:payment.amountIrr,
      todayTotalIrr:settled,
      transactionLimitIrr:Number.MAX_SAFE_INTEGER,
      dailyLimitIrr:Number.MAX_SAFE_INTEGER,
      whitelist:new Set(beneficiary?.whitelisted?[`${payment.tenantId}:${payment.beneficiaryId}`]:[])
    });
    if(!policy.allowed) throw new Error(policy.reason);
    return this.changeState(id,transitionPayment(payment.state,'SUBMIT'),'PAYMENT_SUBMITTED');
  }

  approvePayment(id:string){
    const payment=this.getPayment(id);
    if(!canApprove({actorId:this.actor.userId,makerId:payment.makerId},payment.version)) throw new Error('maker cannot approve own payment');
    if(payment.state!=='PENDING_APPROVAL') throw new Error('payment not pending approval');
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row) throw new Error('payment not found');
      row.state=transitionPayment(row.state,'APPROVE');
      row.approvedVersion=row.version;
      d.audit.push({tenantId:this.actor.tenantId,seq:d.audit.length+1,actor:this.actor.userId,action:'PAYMENT_APPROVED',entity:id,at:Date.now()});
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  private changeState(id:string,state:LocalPayment['state'],action:string){
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row) throw new Error('payment not found');
      row.state=state;
      d.audit.push({tenantId:this.actor.tenantId,seq:d.audit.length+1,actor:this.actor.userId,action,entity:id,at:Date.now()});
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  queuePayment(id:string){
    const payment=this.getPayment(id);
    if(payment.state!=='APPROVED'||payment.approvedVersion!==payment.version) throw new Error('payment not eligible for queue');
    return this.changeState(id,transitionPayment(payment.state,'QUEUE'),'PAYMENT_QUEUED');
  }

  async dispatchPayment(id:string,adapter:BankAdapter){
    const payment=this.getPayment(id);
    if(payment.state!=='QUEUED'||payment.approvedVersion!==payment.version) throw new Error('payment not eligible for dispatch');
    const registry=new BankDispatchRegistry();
    const dispatch=registry.begin({tenantId:payment.tenantId,paymentId:payment.id,version:payment.version});
    const result=await adapter.submit({tenantId:payment.tenantId,paymentId:payment.id,version:payment.version,idempotencyKey:dispatch.idempotencyKey});
    registry.record(dispatch.idempotencyKey,result.outcome);
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row) throw new Error('payment not found');
      row.state=transitionPayment(row.state,'DISPATCH');
      row.bankReference=result.bankReference;
      if(result.outcome==='REJECTED') row.state=transitionPayment(row.state,'FAIL');
      else if(result.outcome==='UNKNOWN') row.state=transitionPayment(row.state,'UNKNOWN_RESULT');
      d.audit.push({tenantId:this.actor.tenantId,seq:d.audit.length+1,actor:this.actor.userId,action:'PAYMENT_BANK_'+result.outcome,entity:id,at:Date.now()});
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  async pollPaymentStatus(id:string,adapter:BankAdapter){
    const payment=this.getPayment(id);
    if(payment.state!=='SUBMITTED'||!payment.bankReference) throw new Error('payment not eligible for polling');
    const outcome=await adapter.poll(payment.bankReference);
    if(outcome==='ACCEPTED'||outcome==='SUBMITTED'){
      this.appendAudit('PAYMENT_BANK_'+outcome,id);
      return this.getPayment(id);
    }
    if(outcome==='REJECTED') return this.changeState(id,transitionPayment(payment.state,'FAIL'),'PAYMENT_BANK_REJECTED');
    return this.changeState(id,transitionPayment(payment.state,'UNKNOWN_RESULT'),'PAYMENT_BANK_UNKNOWN');
  }

  getDashboard(){return dashboard(this.actor.tenantId,this.listPayments())}
}

