import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyVerifiedBankEvidence as apply, mayAutomaticallyDispatch,
  hasFinalBankOutcome, ReconciliationError,
} from '../src/reconciliation.mjs';

const payment = (status = 'UNKNOWN') => ({
  id: 'transfer-1', status, amountMinor: '1200000', currency: 'IRR',
  version: 5, bankReference: null, appliedProofs: [],
});
const proof = (kind = 'SETTLED') => ({
  evidenceId: 'bank-event-1', kind, paymentId: 'transfer-1',
  amountMinor: '1200000', currency: 'IRR', bankReference: 'bank-ref-1',
  verifiedBy: 'trusted-bank-adapter', observedAt: '2026-10-13T10:00:00Z',
  definitive: kind === 'REJECTED',
});
function fails(fn, code) {
  assert.throws(fn, (err) => err instanceof ReconciliationError && err.code === code);
}

test('bank acknowledgment is not final settlement', () => {
  const next = apply(payment(), proof('ACCEPTED')).payment;
  assert.equal(next.status, 'BANK_ACCEPTED');
  assert.equal(next.version, 6);
  assert.equal(hasFinalBankOutcome(next.status), false);
});
test('verified settlement resolves UNKNOWN without another transfer', () => {
  const next = apply(payment(), proof()).payment;
  assert.equal(next.status, 'SETTLED');
  assert.equal(hasFinalBankOutcome(next.status), true);
});
test('definitive rejection resolves UNKNOWN', () => {
  const next = apply(payment(), proof('REJECTED')).payment;
  assert.equal(next.status, 'BANK_REJECTED');
  assert.equal(hasFinalBankOutcome(next.status), true);
});
test('non-definitive bank failure cannot be treated as rejection', () => {
  fails(() => apply(payment(), {...proof('REJECTED'), definitive: false}), 'NON_DEFINITIVE_REJECTION');
});
test('UNKNOWN and all post-send statuses cannot auto-dispatch', () => {
  assert.equal(mayAutomaticallyDispatch('READY'), true);
  for (const s of ['DISPATCHING', 'UNKNOWN', 'BANK_ACCEPTED', 'SETTLED', 'BANK_REJECTED']) {
    assert.equal(mayAutomaticallyDispatch(s), false);
  }
});
test('same verified event is idempotent and returns snapshot identity', () => {
  const first = apply(payment(), proof()).payment;
  const next = apply(first, proof());
  assert.equal(next.changed, false);
  assert.strictEqual(next.payment, first);
});
test('same event ID with changed contents is rejected', () => {
  const first = apply(payment(), proof()).payment;
  fails(() => apply(first, {...proof(), observedAt: '2026-10-13T10:00:01Z'}), 'EVIDENCE_ID_COLLISION');
});
test('mismatched recipient payment, amount and currency are rejected', () => {
  fails(() => apply(payment(), {...proof(), paymentId: 'other'}), 'PAYMENT_MISMATCH');
  fails(() => apply(payment(), {...proof(), amountMinor: '1200001'}), 'AMOUNT_MISMATCH');
  fails(() => apply(payment(), {...proof(), currency: 'USD'}), 'CURRENCY_MISMATCH');
});
test('settlement and acknowledgment require a bank reference', () => {
  fails(() => apply(payment(), {...proof(), bankReference: ''}), 'MISSING_BANK_REFERENCE');
  fails(() => apply(payment(), {...proof('ACCEPTED'), bankReference: ''}), 'MISSING_BANK_REFERENCE');
});
test('evidence cannot affect a READY non-dispatched payment', () => {
  fails(() => apply(payment('READY'), proof()), 'NOT_DISPATCHED');
});
test('conflicting terminal outcomes are rejected', () => {
  const settled = apply(payment(), proof()).payment;
  fails(() => apply(settled, {...proof('REJECTED'), evidenceId: 'evt-2'}), 'TERMINAL_CONFLICT');
  const rejected = apply(payment(), proof('REJECTED')).payment;
  fails(() => apply(rejected, {...proof('SETTLED'), evidenceId: 'evt-2'}), 'TERMINAL_CONFLICT');
});
test('new evidence cannot change bank reference', () => {
  const accepted = apply(payment(), proof('ACCEPTED')).payment;
  fails(() => apply(accepted, {...proof(), evidenceId: 'evt-2', bankReference: 'another-bank-ref'}), 'BANK_REFERENCE_CONFLICT');
});
test('matching acknowledgment followed by settlement is allowed', () => {
  const acknowledged = apply(payment(), proof('ACCEPTED')).payment;
  const settled = apply(acknowledged, {...proof(), evidenceId: 'evt-2'}).payment;
  assert.equal(settled.status, 'SETTLED');
  assert.equal(settled.appliedProofs.length, 2);
  assert.equal(settled.version, 7);
});
test('unverified, malformed amounts and dates fail closed', () => {
  fails(() => apply(payment(), {...proof(), verifiedBy: ''}), 'UNVERIFIED_EVIDENCE');
  fails(() => apply(payment(), {...proof(), amountMinor: '1.20'}), 'INVALID_PROOF');
  fails(() => apply(payment(), {...proof(), observedAt: 'not-a-date'}), 'INVALID_PROOF');
  fails(() => apply({...payment(), amountMinor: 1200000}, proof()), 'INVALID_PAYMENT');
});
test('applied event digest does not store the bank reference in proof history', () => {
  const applied = apply(payment(), proof()).payment.appliedProofs[0];
  assert.deepEqual(Object.keys(applied).sort(), ['digest', 'evidenceId']);
  assert.equal(applied.digest.length, 64);
});
test('input snapshot is unchanged by apply', () => {
  const original = payment();
  const snapshot = JSON.stringify(original);
  apply(original, proof());
  assert.equal(JSON.stringify(original), snapshot);
});
