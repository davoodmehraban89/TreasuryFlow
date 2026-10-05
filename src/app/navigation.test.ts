import {describe,expect,it} from 'vitest';
import {PRIMARY_NAV} from './ui/navigation';

describe('primary navigation contract',()=>{
  it('uses unique real routes for every primary screen',()=>{
    const hrefs=PRIMARY_NAV.map(x=>x.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toEqual(expect.arrayContaining(['/dashboard','/payments','/payments/new','/accounts','/reconciliation','/queue','/reports','/audit']));
    for(const href of hrefs){expect(href.startsWith('/')).toBe(true);expect(href.includes('#')).toBe(false)}
  });
  it('keeps Persian labels readable',()=>{
    for(const item of PRIMARY_NAV){expect(item.labelFa).toMatch(/[\u0600-\u06FF]/);expect(item.labelFa).not.toContain('?')}
  });
});
