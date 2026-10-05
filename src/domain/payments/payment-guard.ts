export type PaymentGuardInput={sourceAccountId:string;beneficiaryId:string;iban:string;amountIrr:number;clientReference:string;paymentDate:string};
export type PaymentGuardResult={ok:true}|{ok:false;code:'INVALID_IBAN'|'DUPLICATE_REFERENCE'|'DUPLICATE_PAYMENT'};
const normalized=(v:string)=>v.replace(/\s+/g,'').toUpperCase();
export function isValidIranianIban(v:string){const iban=normalized(v);if(!/^IR\d{24}$/.test(iban))return false;const rearranged=iban.slice(4)+iban.slice(0,4);let rem=0;for(const ch of rearranged){const part=/\d/.test(ch)?ch:String(ch.charCodeAt(0)-55);for(const digit of part)rem=(rem*10+Number(digit))%97}return rem===1}
export function evaluatePaymentGuard(next:PaymentGuardInput,existing:PaymentGuardInput[]):PaymentGuardResult{
 if(!isValidIranianIban(next.iban)) return {ok:false,code:'INVALID_IBAN'};
 if(existing.some(p=>p.clientReference.trim()===next.clientReference.trim())) return {ok:false,code:'DUPLICATE_REFERENCE'};
 const fingerprint=(p:PaymentGuardInput)=>[p.sourceAccountId,p.beneficiaryId,normalized(p.iban),p.amountIrr,p.paymentDate].join('|');
 if(existing.some(p=>fingerprint(p)===fingerprint(next))) return {ok:false,code:'DUPLICATE_PAYMENT'};
 return {ok:true};
}
