import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {QueryEditor} from './query-editor';
import IntegrationsPage from './page';
describe('read-only integration UI',()=>{
 it('renders editable SQL and copy button',()=>{
  const html=renderToStaticMarkup(<QueryEditor/>);
  expect(html).toContain('id="treasuryflow-sql-editor"');
  expect(html).toContain('SELECT TOP (100)');
  expect(html).toContain('کپی کوئری');
  expect(html).toContain('dir="ltr"');
 });
 it('explains real data source is not yet linked',()=>{
  const html=renderToStaticMarkup(<IntegrationsPage/>);
  expect(html).toContain('Destination_IBAN');
  expect(html).toContain('Payment_Identifier');
  expect(html).toContain('Deposit_Identifier');
  expect(html).toContain('اتصال زنده در این مرحله فعال نیست');
 });
});
