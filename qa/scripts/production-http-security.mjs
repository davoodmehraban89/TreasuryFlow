import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port=3132,base='http://127.0.0.1:'+port;
const env={...process.env,DATABASE_URL:'evidence-ref',IDENTITY_PROVIDER:'oidc-ref',
  AUTH_PROXY_HMAC_SECRET:'synthetic-smoke-secret',KMS_KEY_ID:'kms-ref',
  SIEM_ENDPOINT:'siem-ref',WAF_POLICY_ID:'waf-ref',ALERT_CHANNEL:'ops-ref',
  BANK_ADAPTER_MODE:'disabled',TREASURYFLOW_DESKTOP_LOCAL:'0'};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env,stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 let ready=false;
 for(let i=0;i<50;i++){
   try{const r=await fetch(base+'/api/ready',{signal:AbortSignal.timeout(1800)});if(r.status===200){ready=true;break}}catch{}
   await sleep(250);
 }
 assert(ready,'PRODUCTION_READY_TIMEOUT');
 let count=0;
 const forged=[
  {'X-Authenticated-User':'system-admin','X-Forwarded-User':'admin'},
  {'X-User-Role':'SUPERUSER','X-Tenant-Id':'local'},
  {'Cookie':'session=forged; is_admin=true'},
  {'X-Middleware-Subrequest':'middleware:middleware:middleware:middleware:middleware'}
 ];
 for(const path of ['/','/dashboard','/payments','/accounts','/reports/export',
   '/audit','/queue','/api/transfer/submit','/integrations']){
   for(const headers of forged){
     const response=await fetch(base+path,{headers,redirect:'manual'});
     assert.equal(response.status,403,'HEADER_BYPASS_'+path);
     assert.equal(response.headers.get('cache-control'),'no-store');
     assert.equal(response.headers.get('x-content-type-options'),'nosniff');
     assert.match(await response.text(),/دسترسی عملیاتی مسدود است/);
     count++;
   }
 }
 for(const path of ['/payments/new','/api/transfer/submit','/accounts']){
   const r=await fetch(base+path,{method:'POST',body:'amountIrr=100&role=admin',
      headers:{'Content-Type':'application/x-www-form-urlencoded','X-Authenticated-User':'admin'}});
   assert.equal(r.status,403,'POST_BYPASS_'+path);count++;
 }
 console.log('GATE_PASS_PRODUCTION_HTTP_SECURITY_'+count+'_SPOOF_AND_WRITE_ATTEMPTS_DENIED');
}catch(e){console.error('PRODUCTION_HTTP_SECURITY_FAIL_'+String(e.message).replace(/[^A-Za-z0-9_]/g,''));process.exitCode=1}
finally{child.kill();await sleep(300)}
