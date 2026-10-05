import {describe,expect,it} from 'vitest';import {renderDashboardText} from './dashboard-view';
describe('dashboard view',()=>{it('uses Persian labels and explicit empty state',()=>{const t=renderDashboardText({total:0,totalIrr:0,unknown:0,settled:0,needsReview:0});expect(t).toContain('مرکز عملیات خزانه‌داری');expect(t).toContain('داده عملیاتی ثبت نشده است');expect(t).not.toContain('???')})});
