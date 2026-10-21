import {describe,it,expect} from 'vitest';
import {isProductionOperationBlocked as blocked} from './production-http-guard';
const production={NODE_ENV:'production',TREASURYFLOW_DESKTOP_LOCAL:'0'};
describe('production access fails closed at ingress',()=>{
  it('blocks financial and action endpoints before any data access',()=>{
    for(const path of ['/','/dashboard','/accounts','/payments','/payments/new',
      '/queue','/audit','/api/payments','/api/transfer/submit','/reports/export',
      '/integrations','/master-data','/reconciliation','/%2e%2e/payments']){
      expect(blocked(production,path),path).toBe(true);
    }
  });
  it('exposes only login view and readiness (not operations)',()=>{
    expect(blocked(production,'/login')).toBe(false);
    expect(blocked(production,'/api/ready')).toBe(false);
    expect(blocked(production,'/api/ready/secret')).toBe(true);
    expect(blocked(production,'/login/dashboard')).toBe(true);
  });
  it('cannot be bypassed by unrelated environment flags',()=>{
    for(const x of [{}, {BANK_ADAPTER_MODE:'disabled'}, {IDENTITY_PROVIDER:'oidc-ref'},
       {AUTH_PROXY_HMAC_SECRET:'configured'}, {TREASURYFLOW_DESKTOP_LOCAL:'true'}]){
      expect(blocked({...production,...x},'/payments')).toBe(true);
    }
  });
  it('never treats live-bank mode as an operational authorization, even on desktop',()=>{
    for(const local of ['1','0',undefined]){
      for(const nodeMode of ['production','development']){
        const e={NODE_ENV:nodeMode,TREASURYFLOW_DESKTOP_LOCAL:local,BANK_ADAPTER_MODE:'live'};
        expect(blocked(e,'/payments')).toBe(true);
        expect(blocked(e,'/api/transfer/submit')).toBe(true);
        expect(blocked(e,'/api/ready')).toBe(false);
      }
    }
  });
  it('preserves isolated local desktop and developer flow',()=>{
    expect(blocked({NODE_ENV:'development'},'/dashboard')).toBe(false);
    expect(blocked({NODE_ENV:'production',TREASURYFLOW_DESKTOP_LOCAL:'1'},'/payments')).toBe(false);
  });
});
