'use strict';

// Never accept an unrelated service or an error page on TreasuryFlow's fixed localhost port.
function isExpectedReadiness(statusCode, body) {
  if (statusCode !== 200 || typeof body !== 'string' || body.length > 4096) return false;
  try {
    const result = JSON.parse(body);
    return result !== null && typeof result === 'object' &&
      result.status === 'ready' && result.bankAdapter === 'disabled';
  } catch {
    return false;
  }
}

module.exports = { isExpectedReadiness };
