import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=3133,base='http://127.0.0.1:'+port;
const env={...process.env,DATABASE_URL:'evidence-ref',IDENTITY_PROVIDER:'oidc-ref',
  AUTH_PROXY_HMAC_SECRET:'synthetic-smoke-secret',KMS_KEY_ID:'kms-ref',
  SIEM_ENDPOINT:'siem-ref',WAF_POLICY_ID:'waf-ref',ALERT_CHANNEL:'ops-ref',
  BANK_ADAPTER_MODE:'disabled',TREASURYFLOW_DESKTOP_LOCAL:'0'};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env,stdio:'ignore'});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 let ready=false;
 for(let i=0;i<50;i++){
   try{if((await fetch(base+'/api/ready',{signal:AbortSignal.timeout(1500)})).status===200){ready=true;break}}catch{}
   await pause(250);
 }
 assert(ready,'PRODUCTION_APP_NOT_READY');
 const allowed=await fetch(base+'/login',{redirect:'manual'});
 assert.equal(allowed.status,200,'LOGIN_MUST_REMAIN_ACCESSIBLE');
 for(const path of ['/payments?role=admin','/api/ready/anything','/login/dashboard',
   '/reports/export?format=xlsx','/pay%6dents','/%70ayments','/payments/%2e%2e/accounts',
   '/api/financial/write','/favicon.ico/evil']){
   const r=await fetch(base+path,{redirect:'manual'});
   assert.equal(r.status,403,'EDGE_PATH_BYPASS_'+path);
 }
 const readyResponse=await fetch(base+'/api/ready?path=/payments');
 assert.equal(readyResponse.status,200);
 const readyData=await readyResponse.json();
 assert.equal(readyData.bankAdapter,'disabled');
 assert.equal(readyData.status,'ready');
 assert(!JSON.stringify(readyData).includes('synthetic-smoke-secret'));
 console.log('GATE_PASS_PRODUCTION_HTTP_10_EDGE_PATHS_AND_READINESS');
}catch(e){console.error('PRODUCTION_HTTP_EDGE_FAIL_'+String(e.message).replace(/[^A-Za-z0-9_]/g,''));process.exitCode=1}
finally{child.kill();await pause(300)}
