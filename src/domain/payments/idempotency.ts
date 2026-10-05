import {createHash} from 'node:crypto';
export type LogicalPayment={tenantId:string;sourceAccountId:string;beneficiaryId:string;amountIrr:number;paymentDate:string;clientReference:string};
export function logicalPaymentKey(p:LogicalPayment){const material=[p.tenantId,p.sourceAccountId,p.beneficiaryId,String(p.amountIrr),p.paymentDate,p.clientReference.trim().toUpperCase()].join('|');return createHash('sha256').update(material).digest('hex');}
export function decideDuplicate(key:string,existing:Set<string>){return existing.has(key)?'REJECT_DUPLICATE':'ACCEPT' as const;}
