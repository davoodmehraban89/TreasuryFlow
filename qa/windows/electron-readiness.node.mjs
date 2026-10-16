import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isExpectedReadiness } = require('../../electron/ready-check.cjs');
const ready = JSON.stringify({status:'ready',bankAdapter:'disabled',missing:[]});

test('accepts a real TreasuryFlow ready response with banking disabled', () => {
  assert.equal(isExpectedReadiness(200, ready), true);
});
test('rejects an unrelated web page served on port 3210', () => {
  assert.equal(isExpectedReadiness(200, '<html>unrelated service</html>'), false);
});
test('rejects 404 and 503 responses even with ready-looking bodies', () => {
  assert.equal(isExpectedReadiness(404, ready), false);
  assert.equal(isExpectedReadiness(503, ready), false);
});
test('rejects a live or unspecified banking adapter', () => {
  assert.equal(isExpectedReadiness(200, JSON.stringify({status:'ready',bankAdapter:'live'})), false);
  assert.equal(isExpectedReadiness(200, JSON.stringify({status:'ready'})), false);
});
test('rejects missing, malformed and oversized responses', () => {
  assert.equal(isExpectedReadiness(200, ''), false);
  assert.equal(isExpectedReadiness(200, '{}'), false);
  assert.equal(isExpectedReadiness(200, 'x'.repeat(4097)), false);
});
