export type PaymentStatus = 'READY' | 'DISPATCHING' | 'UNKNOWN' | 'BANK_ACCEPTED' | 'SETTLED' | 'BANK_REJECTED';
export type EvidenceKind = 'ACCEPTED' | 'SETTLED' | 'REJECTED';
export type AppliedProof = { evidenceId: string; digest: string };
export interface PaymentSnapshot {
  id: string;
  status: PaymentStatus;
  amountMinor: string;
  currency: string;
  version: number;
  bankReference?: string | null;
  appliedProofs: readonly AppliedProof[];
}
/** Only the trusted server-side bank adapter may fill verifiedBy after verifying the external response. */
export interface VerifiedBankEvidence {
  evidenceId: string;
  kind: EvidenceKind;
  paymentId: string;
  amountMinor: string;
  currency: string;
  bankReference?: string;
  verifiedBy: string;
  observedAt: string;
  definitive?: boolean;
}
export class ReconciliationError extends Error { constructor(code: string, message: string); code: string; }
export function applyVerifiedBankEvidence(payment: PaymentSnapshot, proof: VerifiedBankEvidence): {
  payment: PaymentSnapshot;
  changed: boolean;
  reason: 'DUPLICATE_EVIDENCE' | 'APPLIED';
};
export function mayAutomaticallyDispatch(status: PaymentStatus): boolean;
export function hasFinalBankOutcome(status: PaymentStatus): boolean;
