import {describe,expect,it} from 'vitest';import {safeDispatchDecision} from './queue-policy';
describe('safe queue policy',()=>{it('never auto retries UNKNOWN',()=>expect(safeDispatchDecision('UNKNOWN')).toBe('MANUAL_REVIEW'));it('allows only approved payment to enter queue',()=>{expect(safeDispatchDecision('APPROVED')).toBe('QUEUE');expect(safeDispatchDecision('DRAFT')).toBe('BLOCK')})});
