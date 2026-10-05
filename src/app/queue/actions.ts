'use server';
import {revalidatePath} from 'next/cache';
import {getDesktopTreasuryService} from '../../platform/application/server-service';

export async function queuePaymentAction(formData:FormData){
 const id=String(formData.get('id')??'');
 getDesktopTreasuryService().queuePayment(id);
 revalidatePath('/queue');
 revalidatePath('/payments/'+id);
 revalidatePath('/payments');
}
