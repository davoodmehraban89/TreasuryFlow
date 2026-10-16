// Synthetic-only Iranian IBAN fixture for isolated Windows VM tests.
// IR + 2 check digits + 22 BBAN digits = exactly 26 characters.
export function createSyntheticIranianIban(digit) {
  if (!Number.isInteger(digit) || digit < 1 || digit > 9) throw Error('INVALID_FIXTURE_DIGIT');
  const bban = '0'.repeat(21) + String(digit);
  let remainder = 0;
  for (const ch of bban + '182700') remainder = (remainder * 10 + Number(ch)) % 97;
  return 'IR' + String(98 - remainder).padStart(2, '0') + bban;
}
