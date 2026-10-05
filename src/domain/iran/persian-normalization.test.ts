import { describe,expect,it } from 'vitest'; import { normalizePersianText } from './persian-normalization';
describe('Persian normalization',()=>{it('normalizes Arabic yeh/kaf and digits',()=>expect(normalizePersianText('\u064A \u0643 \u0661\u0662\u06F3')).toBe('\u06CC \u06A9 123'))});
