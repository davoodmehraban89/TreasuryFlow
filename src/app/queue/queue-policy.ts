import type {PaymentState} from '../../domain/payments/payment-state';
export type SafeDispatchDecision='QUEUE'|'MANUAL_REVIEW'|'BLOCK';
export function safeDispatchDecision(state:PaymentState):SafeDispatchDecision{
 if(state==='UNKNOWN'||state==='NEEDS_REVIEW') return 'MANUAL_REVIEW';
 if(state==='APPROVED') return 'QUEUE';
 return 'BLOCK';
}
