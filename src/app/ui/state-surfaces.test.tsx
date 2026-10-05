import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {StateView} from './StateView';
import {PermissionBoundary} from './PermissionBoundary';

describe('shared state surfaces',()=>{
  it('renders permission denied with alert semantics',()=>{
    const html=renderToStaticMarkup(<PermissionBoundary role="MAKER" allowed={['AUDITOR']}><span>secret</span></PermissionBoundary>);
    expect(html).toContain('دسترسی کافی ندارید');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('secret');
  });
  it('renders explicit empty state',()=>{
    expect(renderToStaticMarkup(<StateView kind="empty" title="داده‌ای نیست"/>)).toContain('داده‌ای نیست');
  });
});
