import { describe, expect, it } from 'vitest';
import { APP_NAME } from './shell';
describe('application shell',()=>{it('identifies TreasuryFlow',()=>{expect(APP_NAME).toBe('TreasuryFlow')})});
