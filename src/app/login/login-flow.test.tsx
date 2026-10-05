import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {LocalEntryCard} from './entry-card';

describe('local login entry',()=>{
  it('labels desktop local mode explicitly and provides keyboard-native link',()=>{
    const html=renderToStaticMarkup(<LocalEntryCard/>);
    expect(html).toContain('محیط محلی امن');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('ارسال بانکی واقعی غیرفعال');
  });
});
