import {describe,expect,it} from 'vitest';
import {prepareReadOnlySql,validateReadOnlySql,SAMPLE_READ_ONLY_SQL} from './read-only-query';
describe('SQL Server read-only query contract',()=>{
 it('preserves approved sample',()=>expect(prepareReadOnlySql(SAMPLE_READ_ONLY_SQL)).toBe(SAMPLE_READ_ONLY_SQL));
 it('auto limits SELECT without TOP',()=>expect(prepareReadOnlySql('SELECT Name FROM dbo.Users')).toBe('SELECT TOP (100) Name FROM dbo.Users'));
 it('keeps TOP <= 100',()=>expect(prepareReadOnlySql('SELECT TOP 15 Id FROM dbo.Users')).toBe('SELECT TOP 15 Id FROM dbo.Users'));
 it.each([
  'SELECT * INTO dbo.Copied FROM dbo.Source',
  'SELECT 1; DROP TABLE dbo.Users',
  'SELECT TOP 9999 * FROM dbo.Source',
  "SELECT * FROM OPENROWSET(BULK 'f', SINGLE_BLOB)",
  'SELECT 1 -- comment',
  'SELECT 1 UNION SELECT 2',
 ])('rejects unsafe SQL %s',q=>expect(validateReadOnlySql(q).ok).toBe(false));
 it('does not flag keywords inside SQL string literals',()=>expect(validateReadOnlySql("SELECT Code FROM dbo.Users WHERE Code='DROP;DELETE'").ok).toBe(true));
});
