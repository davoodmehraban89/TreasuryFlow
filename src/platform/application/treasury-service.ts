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
import type {ActorContext,LocalAccount,LocalAudit,LocalBeneficiary,LocalPayment,LocalStoreData} from './types';

export class TreasuryService{
  constructor(private readonly store:TreasuryStore,private readonly actor:ActorContext){}

  private own<T extends {tenantId:string}>(rows:T[]){
    return rows.filter(x=>x.tenantId===this.actor.tenantId);
  }

  /** Append audit into the same store transaction as its financial mutation. */
  private appendAuditTo(d:LocalStoreData,action:string,entity:string){
    d.audit.push({
      tenantId:this.actor.tenantId,
      seq:d.audit.length+1,
      actor:this.actor.userId,
      action,entity,at:Date.now()
    });
  }

  private appendAudit(action:string,entity:string){
    this.store.update(d=>{this.appendAuditTo(d,action,entity);return d;});
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
      this.appendAuditTo(d,'ACCOUNT_CREATED',account.id);
      return d;
    });
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
      this.appendAuditTo(d,'BENEFICIARY_CREATED',beneficiary.id);
      return d;
    });
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
      // Recheck all financial preconditions against the snapshot acquired *under*
      // the store write transaction. Preflight reads above can race another
      // desktop/process writer, particularly across multiple SQLite connections.
      const accounts=d.accounts.filter(x=>x.tenantId===payment.tenantId);
      const beneficiaries=d.beneficiaries.filter(x=>x.tenantId===payment.tenantId);
      const prior=d.payments.filter(x=>x.tenantId===payment.tenantId);
      if(!accounts.some(x=>x.id===payment.sourceAccountId))throw new Error('source account not found');
      const currentBeneficiary=beneficiaries.find(x=>x.id===payment.beneficiaryId);
      if(!currentBeneficiary)throw new Error('beneficiary not found');
      const normalizedReference=payment.clientReference.toLowerCase();
      if(prior.some(x=>x.id===payment.id||x.clientReference.trim().toLowerCase()===normalizedReference)){
        throw new Error('duplicate payment reference');
      }
      const currentGuard=evaluatePaymentGuard({
        sourceAccountId:payment.sourceAccountId,
        beneficiaryId:payment.beneficiaryId,
        iban:currentBeneficiary.iban,
        amountIrr:payment.amountIrr,
        clientReference:payment.clientReference,
        paymentDate:payment.paymentDate
      },prior.map(x=>({
        sourceAccountId:x.sourceAccountId,beneficiaryId:x.beneficiaryId,
        iban:beneficiaries.find(b=>b.id===x.beneficiaryId)?.iban??'',
        amountIrr:x.amountIrr,clientReference:x.clientReference,paymentDate:x.paymentDate
      })));
      if(!currentGuard.ok)throw new Error(currentGuard.code==='DUPLICATE_PAYMENT'
        ? 'duplicate payment' : currentGuard.code==='DUPLICATE_REFERENCE'
          ? 'duplicate payment reference' : 'invalid Iranian IBAN');
      d.payments.push(payment);
      this.appendAuditTo(d,'PAYMENT_CREATED',payment.id);
      return d;
    });
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
    return this.changeState(id,transitionPayment(payment.state,'SUBMIT'),'PAYMENT_SUBMITTED',payment);
  }

  approvePayment(id:string){
    if(this.actor.role!=='CHECKER')throw new Error('checker role required');
    const payment=this.getPayment(id);
    if(!canApprove({actorId:this.actor.userId,makerId:payment.makerId},payment.version)) throw new Error('maker cannot approve own payment');
    if(payment.state!=='PENDING_APPROVAL') throw new Error('payment not pending approval');
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row) throw new Error('payment not found');
      if(row.state!=='PENDING_APPROVAL'||row.version!==payment.version){
        throw new Error('payment not pending approval');
      }
      if(!canApprove({actorId:this.actor.userId,makerId:row.makerId},row.version)){
        throw new Error('maker cannot approve own payment');
      }
      row.state=transitionPayment(row.state,'APPROVE');
      row.approvedVersion=row.version;
      d.audit.push({tenantId:this.actor.tenantId,seq:d.audit.length+1,actor:this.actor.userId,action:'PAYMENT_APPROVED',entity:id,at:Date.now()});
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  private changeState(id:string,state:LocalPayment['state'],action:string,expected:LocalPayment){
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row) throw new Error('payment not found');
      // A state transition from a preflight snapshot must not overwrite a
      // concurrent approval, bank outcome or revised payment version.
      if(row.state!==expected.state||row.version!==expected.version){
        throw new Error('stale payment state');
      }
      if(action==='PAYMENT_SUBMITTED'&&row.makerId!==this.actor.userId)throw new Error('forbidden');
      if(action==='PAYMENT_QUEUED'&&row.approvedVersion!==row.version){
        throw new Error('payment not eligible for queue');
      }
      row.state=state;
      this.appendAuditTo(d,action,id);
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  queuePayment(id:string){
    if(this.actor.role!=='CHECKER'&&this.actor.role!=='TREASURY_ADMIN')throw new Error('checker or admin role required');
    const payment=this.getPayment(id);
    if(payment.state!=='APPROVED'||payment.approvedVersion!==payment.version) throw new Error('payment not eligible for queue');
    return this.changeState(id,transitionPayment(payment.state,'QUEUE'),'PAYMENT_QUEUED',payment);
  }

  async dispatchPayment(id:string,adapter:BankAdapter){
    if(this.actor.role!=='CHECKER'&&this.actor.role!=='TREASURY_ADMIN')throw new Error('checker or admin role required');
    // Reserve once in durable storage BEFORE any external bank request.
    // The QUEUED -> DISPATCHING transition is atomic across SQLite writers.
    // A crash at any point leaves DISPATCHING/UNKNOWN for manual reconciliation;
    // neither state is eligible for automatic re-dispatch.
    const reserved=this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row||row.state!=='QUEUED'||row.approvedVersion!==row.version){
        throw new Error('payment not eligible for dispatch');
      }
      row.state=transitionPayment(row.state,'BEGIN_DISPATCH');
      this.appendAuditTo(d,'PAYMENT_DISPATCH_RESERVED',id);
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
    const registry=new BankDispatchRegistry();
    const dispatch=registry.begin({tenantId:reserved.tenantId,paymentId:reserved.id,version:reserved.version});
    let result:Awaited<ReturnType<BankAdapter['submit']>>;
    try{
      result=await adapter.submit({tenantId:reserved.tenantId,paymentId:reserved.id,
        version:reserved.version,idempotencyKey:dispatch.idempotencyKey});
      registry.record(dispatch.idempotencyKey,result.outcome);
    }catch{
      // The bank might have accepted the request before the transport failed.
      // Conservatively mark UNKNOWN rather than rolling back to QUEUED.
      this.store.update(d=>{
        const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
        if(!row)throw new Error('payment not found');
        if(row.state==='DISPATCHING'&&row.version===reserved.version){
          row.state=transitionPayment(row.state,'UNKNOWN_RESULT');
          this.appendAuditTo(d,'PAYMENT_BANK_UNKNOWN',id);
        }
        return d;
      });
      throw new Error('bank dispatch outcome unknown: manual review required');
    }
    return this.store.update(d=>{
      const row=d.payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id);
      if(!row||row.state!=='DISPATCHING'||row.version!==reserved.version){
        throw new Error('stale dispatch reservation: manual review required');
      }
      row.state=transitionPayment(row.state,result.outcome==='REJECTED'?'FAIL'
        :result.outcome==='UNKNOWN'?'UNKNOWN_RESULT':'DISPATCH');
      row.bankReference=result.bankReference;
      this.appendAuditTo(d,'PAYMENT_BANK_'+result.outcome,id);
      return d;
    }).payments.find(x=>x.tenantId===this.actor.tenantId&&x.id===id)!;
  }

  async pollPaymentStatus(id:string,adapter:BankAdapter){
    if(this.actor.role!=='CHECKER'&&this.actor.role!=='TREASURY_ADMIN')throw new Error('checker or admin role required');
    const payment=this.getPayment(id);
    if(payment.state!=='SUBMITTED'||!payment.bankReference) throw new Error('payment not eligible for polling');
    const outcome=await adapter.poll(payment.bankReference);
    if(outcome==='ACCEPTED'||outcome==='SUBMITTED'){
      this.appendAudit('PAYMENT_BANK_'+outcome,id);
      return this.getPayment(id);
    }
    if(outcome==='REJECTED') return this.changeState(id,transitionPayment(payment.state,'FAIL'),'PAYMENT_BANK_REJECTED',payment);
    return this.changeState(id,transitionPayment(payment.state,'UNKNOWN_RESULT'),'PAYMENT_BANK_UNKNOWN',payment);
  }

  getDashboard(){return dashboard(this.actor.tenantId,this.listPayments())}
}

