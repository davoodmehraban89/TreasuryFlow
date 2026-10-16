import test from 'node:test';
import assert from 'node:assert/strict';
import { isIntegrationsEditorReady } from './gui-readiness.mjs';

const ready = { href:'http://127.0.0.1:3210/integrations', editor:true, copy:true };

test('accepts a hydrated integrations editor with copy control', () => {
  assert.equal(isIntegrationsEditorReady(ready), true);
});
test('does not race ahead when navigation finished but editor is not hydrated', () => {
  assert.equal(isIntegrationsEditorReady({...ready, editor:false}), false);
  assert.equal(isIntegrationsEditorReady({...ready, copy:false}), false);
});
test('rejects a login redirect or another page', () => {
  assert.equal(isIntegrationsEditorReady({...ready, href:'http://127.0.0.1:3210/login'}), false);
});
test('rejects an unrelated origin or malformed data', () => {
  assert.equal(isIntegrationsEditorReady({...ready, href:'https://example.com/integrations'}), false);
  assert.equal(isIntegrationsEditorReady(null), false);
  assert.equal(isIntegrationsEditorReady({...ready, href:'not a URL'}), false);
});
