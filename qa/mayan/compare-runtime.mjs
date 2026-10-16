// Safely compare sanitized runtime captures. Synthetic fixtures are not proof of application parity.
export function meaningOfMayan(row) {
  if (row.status === 4 && row.isError === false &&
      row.insertResult?.error === false && Number(row.insertResult?.errorCode) === 200 &&
      typeof row.insertResult?.issueId === 'string' && row.insertResult.issueId.length > 0)
    return 'API_ACCEPTED_NOT_SETTLED';
  if (row.status === 1 && row.isError !== true) return 'NO_BANK_ACCEPTANCE_PROOF';
  if (row.status === 3 && row.isError === true) return 'ERROR_REQUIRES_REVIEW';
  return 'CONFLICT_REQUIRES_REVIEW';
}
export function compareMayanTreasuryRuntime(mayan, treasury) {
  if (mayan?.source !== 'MAYAN_RUNTIME_CAPTURE' ||
      treasury?.source !== 'TREASURY_RUNTIME_CAPTURE' ||
      mayan.currency !== 'IRR' || treasury.currency !== 'IRR' ||
      !Array.isArray(mayan.rows) || !Array.isArray(treasury.rows)) throw Error('VERIFIED_SANITIZED_RUNTIME_CAPTURES_REQUIRED');
  const diff = [], m = new Map(), t = new Map();
  for (const row of mayan.rows) {
    if (typeof row.caseId !== 'string' || !/^[A-Z0-9_-]{1,64}$/.test(row.caseId) || m.has(row.caseId))
      throw Error('MAYAN_CASE_ID_NOT_UNIQUE');
    m.set(row.caseId, row);
  }
  for (const row of treasury.rows) {
    if (typeof row.caseId !== 'string' || !/^[A-Z0-9_-]{1,64}$/.test(row.caseId) || t.has(row.caseId))
      throw Error('TREASURY_CASE_ID_NOT_UNIQUE');
    t.set(row.caseId, row);
  }
  for (const [caseId,row] of m) {
    const out = t.get(caseId);
    if (!out) {diff.push({caseId,code:'MISSING_TREASURY_ROW'});continue;}
    const monetary = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value);
    if (!monetary(row.amountIrr) || !monetary(out.amountIrr)) throw Error('IRR_UNIT_OR_INTEGER_UNVERIFIED');
    if (row.amountIrr !== out.amountIrr) diff.push({caseId,code:'AMOUNT_IRR_MISMATCH'});
    for (const f of ['paymentIdentifier','depositIdentifier'])
      if (String(row[f]??'') !== String(out[f]??'')) diff.push({caseId,code:'IDENTIFIER_MISMATCH',field:f});
    const meaning = meaningOfMayan(row);
    if (meaning === 'API_ACCEPTED_NOT_SETTLED' && out.state !== 'SUBMITTED')
      diff.push({caseId,code:'ACCEPTANCE_WRONGLY_PROMOTED_TO_SETTLEMENT_OR_OTHER'});
    if (meaning !== 'API_ACCEPTED_NOT_SETTLED' && ['SUBMITTED','SETTLED'].includes(out.state))
      diff.push({caseId,code:'UNPROVEN_BANK_DISPATCH_OR_SETTLEMENT'});
  }
  for (const id of t.keys()) if (!m.has(id)) diff.push({caseId:id,code:'EXTRA_TREASURY_ROW'});
  return {passed:diff.length===0,total:m.size,differences:diff};
}
