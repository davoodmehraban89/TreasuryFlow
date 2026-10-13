/**
 * Pure, offline TreasuryFlow bank-reconciliation transition guard.
 * It DOES NOT send transfers, call a bank, authenticate evidence or write to a DB.
 * Only a server-side trusted adapter may produce evidence with verifiedBy.
 */
import { createHash } from 'node:crypto';

export class ReconciliationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ReconciliationError';
    this.code = code;
  }
}

const assert = (condition, code, message) => {
  if (!condition) throw new ReconciliationError(code, message);
};
const validText = (value) => typeof value === 'string' && value.length > 0 && value.trim() === value;
const validMoney = (value) => typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value);
const validCurrency = (value) => typeof value === 'string' && /^[A-Z]{3}$/.test(value);
const allowedStatuses = new Set(['READY', 'DISPATCHING', 'UNKNOWN', 'BANK_ACCEPTED', 'SETTLED', 'BANK_REJECTED']);
const allowedKinds = new Set(['ACCEPTED', 'SETTLED', 'REJECTED']);

const stableDigest = (proof) => createHash('sha256').update(JSON.stringify([
  proof.evidenceId, proof.kind, proof.paymentId, proof.amountMinor,
  proof.currency, proof.bankReference, proof.verifiedBy, proof.observedAt,
  proof.definitive === true,
])).digest('hex');

/**
 * Uses a verified response from a trusted server-side banking adapter to move
 * an already-dispatched payment toward a terminal state.
 * The caller must commit the result with an atomic version check.
 */
export function applyVerifiedBankEvidence(payment, proof) {
  assert(payment && typeof payment === 'object', 'INVALID_PAYMENT', 'Payment snapshot missing');
  assert(validText(payment.id), 'INVALID_PAYMENT', 'Payment ID missing');
  assert(allowedStatuses.has(payment.status), 'INVALID_PAYMENT', 'Payment status unknown');
  assert(validMoney(payment.amountMinor), 'INVALID_PAYMENT', 'Payment amount must be decimal minor units');
  assert(validCurrency(payment.currency), 'INVALID_PAYMENT', 'Payment currency must be ISO-like uppercase code');
  assert(Number.isSafeInteger(payment.version) && payment.version >= 0, 'INVALID_PAYMENT', 'Version missing');
  assert(Array.isArray(payment.appliedProofs), 'INVALID_PAYMENT', 'Applied proofs missing');
  assert(proof && typeof proof === 'object', 'INVALID_PROOF', 'Bank evidence missing');
  assert(validText(proof.evidenceId) && validText(proof.paymentId), 'INVALID_PROOF', 'Evidence ID/payment ID missing');
  assert(allowedKinds.has(proof.kind), 'INVALID_PROOF', 'Evidence kind unknown');
  assert(validMoney(proof.amountMinor), 'INVALID_PROOF', 'Evidence amount invalid');
  assert(validCurrency(proof.currency), 'INVALID_PROOF', 'Evidence currency invalid');
  assert(validText(proof.verifiedBy), 'UNVERIFIED_EVIDENCE', 'Only trusted adapters may verify bank evidence');
  assert(validText(proof.observedAt) && !Number.isNaN(Date.parse(proof.observedAt)), 'INVALID_PROOF', 'Evidence timestamp invalid');
  assert(payment.id === proof.paymentId, 'PAYMENT_MISMATCH', 'Evidence belongs to another payment');
  assert(payment.amountMinor === proof.amountMinor, 'AMOUNT_MISMATCH', 'Evidence amount differs from payment');
  assert(payment.currency === proof.currency, 'CURRENCY_MISMATCH', 'Evidence currency differs from payment');
  if (proof.kind === 'SETTLED' || proof.kind === 'ACCEPTED') {
    assert(validText(proof.bankReference), 'MISSING_BANK_REFERENCE', 'Bank reference required');
  }
  if (proof.kind === 'REJECTED') {
    assert(proof.definitive === true, 'NON_DEFINITIVE_REJECTION', 'A transient bank failure is not a final rejection');
  }

  const digest = stableDigest(proof);
  const existing = payment.appliedProofs.find((event) => event?.evidenceId === proof.evidenceId);
  if (existing) {
    assert(existing.digest === digest, 'EVIDENCE_ID_COLLISION', 'Evidence ID reused with changed content');
    return { payment, changed: false, reason: 'DUPLICATE_EVIDENCE' };
  }
  assert(payment.status !== 'READY', 'NOT_DISPATCHED', 'Payment has no recorded dispatch attempt');
  assert(payment.status !== 'SETTLED' && payment.status !== 'BANK_REJECTED', 'TERMINAL_CONFLICT', 'Terminal payment requires manual conflict investigation');
  if (proof.kind === 'ACCEPTED' && payment.status === 'BANK_ACCEPTED' && payment.bankReference !== proof.bankReference) {
    throw new ReconciliationError('BANK_REFERENCE_CONFLICT', 'Conflicting bank references require manual investigation');
  }
  if (payment.bankReference && proof.bankReference && payment.bankReference !== proof.bankReference) {
    throw new ReconciliationError('BANK_REFERENCE_CONFLICT', 'Conflicting bank references require manual investigation');
  }

  const nextStatus = {
    ACCEPTED: 'BANK_ACCEPTED',
    SETTLED: 'SETTLED',
    REJECTED: 'BANK_REJECTED',
  }[proof.kind];
  return {
    changed: true,
    reason: 'APPLIED',
    payment: {
      ...payment,
      status: nextStatus,
      version: payment.version + 1,
      bankReference: proof.bankReference ?? payment.bankReference ?? null,
      appliedProofs: [...payment.appliedProofs, { evidenceId: proof.evidenceId, digest }],
    },
  };
}

/** No automatic retry after a dispatch attempt, including UNKNOWN and REJECTED. */
export function mayAutomaticallyDispatch(status) {
  assert(allowedStatuses.has(status), 'INVALID_STATUS', 'Unknown payment status');
  return status === 'READY';
}

/** A bank acceptance is NOT a settlement receipt. */
export function hasFinalBankOutcome(status) {
  assert(allowedStatuses.has(status), 'INVALID_STATUS', 'Unknown payment status');
  return status === 'SETTLED' || status === 'BANK_REJECTED';
}
