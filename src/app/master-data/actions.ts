'use server';
import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {getDesktopTreasuryService} from '../../platform/application/server-service';

export async function createAccountAction(formData:FormData){
 try{
  getDesktopTreasuryService().createAccount({id:randomUUID(),name:String(formData.get('name')??''),iban:String(formData.get('iban')??''),bankName:String(formData.get('bankName')??'')});
 }catch(error){redirect('/accounts?error='+encodeURIComponent(error instanceof Error?error.message:'invalid account'))}
 revalidatePath('/accounts');redirect('/accounts?created=1');
}
export async function createBeneficiaryAction(formData:FormData){
 try{
  getDesktopTreasuryService().createBeneficiary({id:randomUUID(),name:String(formData.get('name')??''),iban:String(formData.get('iban')??''),whitelisted:formData.get('whitelisted')==='on'});
 }catch(error){redirect('/beneficiaries?error='+encodeURIComponent(error instanceof Error?error.message:'invalid beneficiary'))}
 revalidatePath('/beneficiaries');redirect('/beneficiaries?created=1');
}
