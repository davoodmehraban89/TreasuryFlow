import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';

const nextBin=join(process.cwd(),'node_modules','next','dist','bin','next');
const isolatedDir=mkdtempSync(join(tmpdir(),'treasuryflow-ci-smoke-'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function withServer(port,env,check){
 const child=spawn(process.execPath,[nextBin,'start','-p',String(port),'-H','127.0.0.1'],{
  env,stdio:['ignore','pipe','pipe'],windowsHide:true
 });
 let output='',exited=false,launchError=null;
 const collect=chunk=>{output=(output+chunk.toString('utf8')).slice(-3000);};
 child.stdout.on('data',collect);
 child.stderr.on('data',collect);
 child.on('error',error=>{launchError=error;});
 child.on('exit',()=>{exited=true;});
 const origin='http://127.0.0.1:'+port;
 let lastFailure='server did not respond';
 try{
  const expires=Date.now()+45000;
  while(Date.now()<expires){
   if(launchError)throw launchError;
   if(exited)throw new Error('Next.js process exited during smoke test');
   try{await check(origin);return;}
   catch(error){lastFailure=error instanceof Error?error.message:String(error);}
   await sleep(500);
  }
  throw new Error('Smoke timeout: '+lastFailure);
 }catch(error){
  console.error('application-smoke details:',error instanceof Error?error.message:String(error));
  if(output)console.error('Next.js output (last 3000 characters):',output);
  throw error;
 }finally{if(child.exitCode===null&&!child.killed)child.kill();}
}

async function getJson(origin,path){
 const res=await fetch(origin+path,{signal:AbortSignal.timeout(3000),redirect:'manual'});
 return {status:res.status,body:await res.json()};
}

async function expectPage(origin,path,marker){
 const res=await fetch(origin+path,{signal:AbortSignal.timeout(3000)});
 const html=await res.text();
 assert.equal(res.status,200,path+': HTTP '+res.status);
 assert(html.includes(marker),path+': expected application content missing');
}

async function main(){
 const base={...process.env,NODE_ENV:'production',BANK_ADAPTER_MODE:'disabled'};
 const localEnv={...base,TREASURYFLOW_DESKTOP_LOCAL:'1',
  TREASURYFLOW_DATA_FILE:join(isolatedDir,'treasuryflow-test.sqlite')};
 await withServer(3101,localEnv,async origin=>{
  const ready=await getJson(origin,'/api/ready');
  assert.equal(ready.status,200,'local desktop readiness status');
  assert.equal(ready.body.status,'ready','local desktop readiness body');
  assert.equal(ready.body.bankAdapter,'disabled','bank must remain disabled');
  await expectPage(origin,'/login','ورود به محیط محلی امن');
  await expectPage(origin,'/dashboard','داشبورد خزانه‌داری');
  await expectPage(origin,'/integrations','کپی کوئری');
 });
 console.log('application-smoke: local desktop ready; login/dashboard/SQL UI passed; bank disabled');

 const productionEnv={...base,TREASURYFLOW_DESKTOP_LOCAL:'0'};
 for(const name of ['DATABASE_URL','IDENTITY_PROVIDER','AUTH_PROXY_HMAC_SECRET',
  'KMS_KEY_ID','SIEM_ENDPOINT','WAF_POLICY_ID','ALERT_CHANNEL'])delete productionEnv[name];
 await withServer(3102,productionEnv,async origin=>{
  const ready=await getJson(origin,'/api/ready');
  assert.equal(ready.status,503,'unconfigured production readiness must fail closed');
  assert.equal(ready.body.status,'not-ready','unconfigured production readiness response');
  assert(ready.body.missing.includes('DATABASE_URL'),'missing production prerequisites not reported');
  assert.equal(ready.body.bankAdapter,'disabled','no production bank connection');
 });
 console.log('application-smoke: unconfigured production readiness correctly blocked');
 console.log('application-smoke: PASS');
}

try{await main();}
catch{process.exitCode=1;console.error('application-smoke: FAIL');}
finally{
 try{rmSync(isolatedDir,{recursive:true,force:true});}
 catch(error){console.warn('Temporary smoke fixture cleanup deferred:',error?.code||'UNKNOWN');}
}
