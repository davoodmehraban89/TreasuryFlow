'use server';
import {redirect} from 'next/navigation';
import {reconcile} from '../../domain/reconciliation';
import {getDesktopTreasuryService} from '../../platform/application/server-service';

export async function runReconciliationAction(formData:FormData){
 const accountId=String(formData.get('accountId')??'');
 const reference=String(formData.get('reference')??'').trim();
 const sourceId=String(formData.get('sourceId')??'').trim()||'manual';
 const date=String(formData.get('date')??'');
 const amountIrr=Number(formData.get('amountIrr')??0);
 if(!accountId||!reference||!date||!Number.isSafeInteger(amountIrr)||amountIrr===0) redirect('/reconciliation?error=invalid');
 const service=getDesktopTreasuryService();
 const result=reconcile(
  {tenantId:'local',accountId,sourceId,amountIrr,date,reference},
  service.listPayments().map(p=>({tenantId:p.tenantId,accountId:p.sourceAccountId,paymentId:p.id,amountIrr:p.amountIrr,reference:p.clientReference}))
 );
 const params=new URLSearchParams({status:result.status});
 if(result.status==='MATCHED') params.set('paymentId',result.paymentId);
 if(result.status==='AMBIGUOUS') params.set('candidateIds',result.candidateIds.join(','));
 redirect('/reconciliation?'+params.toString());
}
