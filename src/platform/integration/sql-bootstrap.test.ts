import {describe,expect,it} from 'vitest';
import {validateSqlBootstrapConfig, planTreasuryFlowBootstrap} from './sql-bootstrap';

describe('SQL bootstrap preflight',()=>{
  it('rejects incomplete SQL Server configuration before connecting',()=>{
    expect(()=>validateSqlBootstrapConfig({server:'',database:'Peyvast',auth:{mode:'windows'}})).toThrow(/server/i);
    expect(()=>validateSqlBootstrapConfig({server:'SQL01',database:'',auth:{mode:'windows'}})).toThrow(/database/i);
  });
  it('requires both accounting signature tables before planning writes',()=>{
    const plan=planTreasuryFlowBootstrap({tables:['Sanad'],procedures:[]});
    expect(plan.compatible).toBe(false);
    expect(plan.statements).toEqual([]);
  });
  it('uses only TreasuryFlow-owned objects for a compatible database',()=>{
    const plan=planTreasuryFlowBootstrap({tables:['Sanad','Havale'],procedures:[]});
    expect(plan.compatible).toBe(true);
    expect(plan.statements.join('\n')).toMatch(/TreasuryFlow/i);
    expect(plan.statements.join('\n')).not.toMatch(/ALTER\s+TABLE\s+(Sanad|Havale)/i);
  });
});
