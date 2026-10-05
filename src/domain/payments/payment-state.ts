export type PaymentState='DRAFT'|'PENDING_APPROVAL'|'APPROVED'|'QUEUED'|'SUBMITTED'|'SETTLED'|'FAILED'|'UNKNOWN'|'NEEDS_REVIEW';
export type PaymentEvent='SUBMIT'|'APPROVE'|'QUEUE'|'DISPATCH'|'SETTLE'|'FAIL'|'UNKNOWN_RESULT'|'REVIEW';
const transitions:Partial<Record<PaymentState,Partial<Record<PaymentEvent,PaymentState>>>>={DRAFT:{SUBMIT:'PENDING_APPROVAL'},PENDING_APPROVAL:{APPROVE:'APPROVED'},APPROVED:{QUEUE:'QUEUED'},QUEUED:{DISPATCH:'SUBMITTED'},SUBMITTED:{SETTLE:'SETTLED',FAIL:'FAILED',UNKNOWN_RESULT:'UNKNOWN'},UNKNOWN:{REVIEW:'NEEDS_REVIEW'}};
export function transitionPayment(state:PaymentState,event:PaymentEvent):PaymentState{const next=transitions[state]?.[event];if(!next)throw new Error(`Forbidden transition ${state}/${event}`);return next;}
