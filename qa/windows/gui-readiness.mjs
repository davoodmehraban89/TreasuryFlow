/** Wait for the hydrated editor, not just a changed URL, before GUI assertions. */
export function isIntegrationsEditorReady(page) {
  if (!page || page.editor !== true || page.copy !== true) return false;
  try {
    const url = new URL(page.href);
    return url.origin === 'http://127.0.0.1:3210' && url.pathname === '/integrations';
  } catch {
    return false;
  }
}
