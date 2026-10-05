import { describe,expect,it } from 'vitest';
import { rial } from './money';
describe('rial',()=>{it('accepts integer IRR',()=>expect(rial(1250)).toBe(1250));it('rejects fractional money',()=>expect(()=>rial(1.2)).toThrow())});
