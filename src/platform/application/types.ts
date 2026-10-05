import type {PaymentState} from '../../domain/payments/payment-state';
export type LocalAccount={id:string;tenantId:string;name:string;iban:string;bankName:string;status:'ACTIVE'|'INACTIVE'};
export type LocalBeneficiary={id:string;tenantId:string;name:string;iban:string;whitelisted:boolean};
export type LocalPayment={id:string;tenantId:string;makerId:string;sourceAccountId:string;beneficiaryId:string;amountIrr:number;paymentDate:string;clientReference:string;description:string;version:number;state:PaymentState;approvedVersion?:number;bankReference?:string};
export type LocalAudit={tenantId:string;seq:number;actor:string;action:string;entity:string;at:number};
export type LocalStoreData={version:1;meta:{organizationName:string};accounts:LocalAccount[];beneficiaries:LocalBeneficiary[];payments:LocalPayment[];audit:LocalAudit[]};
export type ActorContext={tenantId:string;userId:string;role:'MAKER'|'CHECKER'|'TREASURY_ADMIN'|'AUDITOR'};
