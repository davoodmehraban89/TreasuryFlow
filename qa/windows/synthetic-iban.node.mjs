import test from 'node:test';
import assert from 'node:assert/strict';
import { createSyntheticIranianIban } from './synthetic-iban.mjs';

function mod97(iban) {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const sequence = /[0-9]/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const digit of sequence) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder;
}
test('VM-only source and beneficiary IBANs are exactly 26 characters and checksum-valid', () => {
  for (const seed of [1, 2]) {
    const iban = createSyntheticIranianIban(seed);
    assert.match(iban, /^IR[0-9]{24}$/);
    assert.equal(iban.length, 26);
    assert.equal(mod97(iban), 1);
  }
  assert.notEqual(createSyntheticIranianIban(1), createSyntheticIranianIban(2));
});
test('rejects fixture seeds outside the synthetic one-digit range', () => {
  for (const value of [0, 10, -1, 1.1, NaN]) assert.throws(() => createSyntheticIranianIban(value));
});
