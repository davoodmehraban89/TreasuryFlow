'use server';

import {randomUUID} from 'node:crypto';
import {redirect} from 'next/navigation';
import {revalidatePath} from 'next/cache';
import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {validatePaymentDraftInput} from './payment-components';

export async function createPaymentAction(formData:FormData){
  const input={
    sourceAccountId:String(formData.get('sourceAccountId')??''),
    beneficiaryId:String(formData.get('beneficiaryId')??''),
    amountIrr:Number(formData.get('amountIrr')??0),
    paymentDate:String(formData.get('paymentDate')??''),
    clientReference:String(formData.get('clientReference')??'').trim()
  };
  const errors=validatePaymentDraftInput(input);
  if(errors.length) redirect('/payments/new?error='+encodeURIComponent(errors.join(',')));
  const service=getDesktopTreasuryService();
  const payment=service.createPayment({
    id:randomUUID(),
    ...input,
    description:String(formData.get('description')??'')
  });
  revalidatePath('/dashboard');
  revalidatePath('/payments');
  redirect('/payments/'+payment.id);
}

export async function submitPaymentAction(formData:FormData){
  const id=String(formData.get('id')??'');
  getDesktopTreasuryService().submitPayment(id);
  revalidatePath('/payments/'+id);
  revalidatePath('/payments');
}

export async function approvePaymentAction(formData:FormData){
  const id=String(formData.get('id')??'');
  getDesktopTreasuryService({tenantId:'local',userId:'local-checker',role:'CHECKER'}).approvePayment(id);
  revalidatePath('/payments/'+id);
  revalidatePath('/payments');
}
