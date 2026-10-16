import assert from 'node:assert/strict';
import {isIntegrationsEditorReady} from './gui-readiness.mjs';
import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,basename} from 'node:path';
assert.equal(process.platform,'win32');
const [exe,reportDir]=process.argv.slice(2);
assert(exe&&existsSync(exe),'real installed TreasuryFlow.exe required');
assert(reportDir,'evidence output directory required');
mkdirSync(reportDir,{recursive:true});
const port=9345;
const report={mode:'REAL_INSTALLED_ELECTRON_CDP',exe:basename(exe),cdp:false,localOrigin:false,integrations:false,queryEditor:false,copyQuery:false,copyExactlyEditedSql:false,clipboardMode:'INTERCEPTED_API_NOT_WINDOWS_CLIPBOARD',screenshot:false,stage:'connect',cdpReconnections:0,localEntry:false,visitedRoutes:[],syntheticAccount:false,syntheticBeneficiary:false,syntheticDraft:false,appReopened:false,durableData:false,auditPersisted:false,upgrade:'NOT_RUN_NO_BASELINE',outcome:'NOT_RUN'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,timeout=75000){let error;const until=Date.now()+timeout;while(Date.now()<until){try{const x=await fn();if(x)return x;}catch(e){error=e;}await sleep(400);}throw error||Error('CDP_WAIT_TIMEOUT');}
async function connect(url){
 const ws=new WebSocket(url);
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('CDP_WS_TIMEOUT')),10000);
 ws.addEventListener('open',()=>{clearTimeout(t);resolve();},{once:true});
 ws.addEventListener('error',()=>{clearTimeout(t);reject(Error('CDP_WS_ERROR'));},{once:true});});
 let next=0;const pending=new Map();
 ws.addEventListener('message',ev=>{let msg;try{msg=JSON.parse(ev.data);}catch{return;}
  const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.t);
  msg.error?p.reject(Error('CDP_REMOTE_ERROR')):p.resolve(msg.result);});
 const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;
  const t=setTimeout(()=>{pending.delete(id);reject(Error('CDP_TIMEOUT'));},20000);
  pending.set(id,{resolve,reject,t});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async code=>{const x=await command('Runtime.evaluate',{expression:code,awaitPromise:true,returnByValue:true});
  if(x.exceptionDetails)throw Error('CDP_EVALUATION_ERROR');return x.result?.value;};
 await command('Runtime.enable');await command('Page.enable');
 return {ws,command,evaluate};
}
let proc,conn;
try{
 const env={...process.env,BANK_ADAPTER_MODE:'disabled',TREASURYFLOW_DESKTOP_LOCAL:'1',TREASURYFLOW_DATA_FILE:join(reportDir,'vm-only-treasuryflow.sqlite')};
 proc=spawn(exe,['--remote-debugging-port='+port,'--remote-allow-origins=*'],{env,stdio:'ignore',windowsHide:false});
 const target=await wait(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1500)});
 if(!r.ok)return null;const pages=await r.json();
 return pages.find(p=>p.type==='page'&&p.url?.startsWith('http://127.0.0.1:3210')&&p.webSocketDebuggerUrl)?.webSocketDebuggerUrl;});
 conn=await connect(target);report.cdp=true;

 const origin='http://127.0.0.1:3210';
 const go=async(path,heading)=>{
   // A full Next.js navigation may replace the renderer's CDP target and
   // invalidate pending Page.navigate replies. Reattach by URL after navigation.
   report.stage='native-route:'+path;
   const dest=origin+path;
   const pending=conn.command('Page.navigate',{url:dest}).catch(()=>null);
   await Promise.race([pending,sleep(850)]);
   const socket=await wait(async()=>{
     const response=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1500)});
     if(!response.ok)return null;
     const pages=await response.json();
     return pages.find(p=>p.type==='page'&&p.url?.startsWith(dest)&&p.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
   },35000);
   try{conn.ws.close()}catch{}
   conn=await connect(socket);
   report.cdpReconnections++;
   return wait(async()=>{
     const x=await conn.evaluate("({path:location.pathname,text:document.body?.innerText||'',errorToast:!!document.querySelector('.toast-error')})");
     return x?.path===path&&x.text.includes(heading)&&!x.errorToast&&!x.text.includes('خطا در بارگذاری صفحه')?x:null;
   },30000);
 };
 const iban=(digit)=>{
   const number='0'.repeat(23)+String(digit);
   let mod=0;for(const d of number+'182700')mod=(mod*10+Number(d))%97;
   return 'IR'+String(98-mod).padStart(2,'0')+number;
 };
 const submit=async (page,marker,fields)=>{
   await go(page,marker);
   await conn.evaluate('window.__vmSynthetic='+JSON.stringify(fields));
   const submitted=await conn.evaluate("(()=>{const form=document.querySelector('main form');if(!form)return 'NO_FORM';for(const [k,v] of Object.entries(window.__vmSynthetic)){const el=form.elements.namedItem(k);if(!el)return 'MISSING_'+k;if(el.type==='checkbox'){el.checked=Boolean(v);}else if(el.tagName==='SELECT'){el.value=v==='@FIRST'?[...el.options].find(o=>o.value)?.value||'':String(v);}else{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,String(v));}el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}if(!form.reportValidity())return 'INVALID_FORM';form.requestSubmit();return 'SUBMITTED';})()");
   if(submitted!=='SUBMITTED')return submitted;
   // Next Server Actions can close or replace the CDP target on redirect.
   // Follow the browser's actual URL, then attach to its current target.
   report.stage='native-post-action:'+page;
   const redirected=await wait(async()=>{
     const response=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1500)});
     if(!response.ok)return null;
     const pages=await response.json();
     return pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl&&(
       page==='/payments/new'
        ? x.url?.startsWith(origin+'/payments/')&&!x.url?.startsWith(origin+'/payments/new')
        : x.url?.startsWith(origin+page+'?')
     ))||null;
   },45000);
   if(redirected.url.includes('error='))throw Error('NATIVE_FORM_SERVER_ACTION_REJECTED_'+page);
   try{conn.ws.close()}catch{}
   conn=await connect(redirected.webSocketDebuggerUrl);
   report.cdpReconnections++;
   return submitted;
 };
 await go('/login','ورود به محیط محلی امن');
 assert(await conn.evaluate("(()=>{const a=document.querySelector('a[href=\"/dashboard\"]');if(!a)return false;a.click();return true;})()"),'NATIVE_LOCAL_ENTRY_MISSING');
 await wait(()=>conn.evaluate("location.pathname==='/dashboard'&&document.body?.innerText.includes('داشبورد خزانه‌داری')"));
 report.localEntry=true; // local entry link, NOT credential authentication
 for(const [route,heading] of [
  ['/dashboard','داشبورد خزانه‌داری'],['/payments','حواله‌ها'],
  ['/payments/new','ثبت حواله جدید'],['/accounts','حساب‌های بانکی'],
  ['/beneficiaries','طرف‌حساب‌ها'],['/queue','صف ارسال'],
  ['/reconciliation','مغایرت‌گیری'],['/integrations','اتصال به دیتابیس'],
  ['/reports','گزارش‌های خزانه‌داری'],['/audit','رویدادهای حسابرسی']
 ]){await go(route,heading);report.visitedRoutes.push({route,status:'PASS'});}
 const home=await wait(()=>conn.evaluate('({href:location.href,title:document.title})'));
 report.localOrigin=new URL(home.href).origin==='http://127.0.0.1:3210';
 assert(report.localOrigin,'NATIVE_APP_ORIGIN_NOT_LOCAL');
 assert.match(home.title,/TreasuryFlow/i);
 await go('/integrations','اتصال به دیتابیس');
 const page=await wait(async()=>{const x=await conn.evaluate(
 "({href:location.href,title:document.title,editor:!!document.querySelector('textarea'),copy:[...document.querySelectorAll('button')].some(b=>b.textContent.includes('کپی کوئری'))})");
 return isIntegrationsEditorReady(x)?x:null;});
 report.integrations=true;report.queryEditor=page.editor;report.copyQuery=page.copy;
 assert(report.queryEditor,'QUERY_EDITOR_MISSING_IN_NATIVE_APP');
 assert(report.copyQuery,'COPY_BUTTON_MISSING_IN_NATIVE_APP');
 const editedSql='SELECT TOP (7) 7 AS CopyProbe';
 const prepared=await conn.evaluate(`(() => {
  const field=document.querySelector('textarea[name="query"]') || document.querySelector('textarea');
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('کپی کوئری'));
  if(!field || !button) return false;
  window.__tfCapturedQuery=null;
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__tfCapturedQuery=value;}}});
  const descriptor=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value');
  descriptor.set.call(field, ${JSON.stringify(editedSql)});
  field.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
 })()`);
 assert(prepared,'QUERY_COPY_SETUP_FAILED');
 await sleep(300);
 const clicked=await conn.evaluate(`(() => {
  const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('کپی کوئری'));
  if(!button) return false;
  button.click();
  return true;
 })()`);
 assert(clicked,'QUERY_COPY_BUTTON_NOT_CLICKABLE');
 report.copyExactlyEditedSql=await wait(()=>conn.evaluate('window.__tfCapturedQuery === '+JSON.stringify(editedSql)),10000);
 assert(report.copyExactlyEditedSql,'EDITED_QUERY_NOT_COPIED_EXACTLY');
 const png=await conn.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 assert(png.data,'NATIVE_SCREENSHOT_MISSING');
 writeFileSync(join(reportDir,'treasuryflow-installed-ui.png'),Buffer.from(png.data,'base64'));report.screenshot=true;

 // Synthetic local actions through the actual installed Electron UI.
 assert.equal(await submit('/accounts','افزودن حساب بانکی',{
  name:'VM-SYNTHETIC-SOURCE',bankName:'VM-ONLY-BANK',iban:iban(1)}),'SUBMITTED');
 await wait(()=>conn.evaluate("location.pathname==='/accounts'&&document.body?.innerText.includes('حساب ثبت شد')&&document.body.innerText.includes('VM-SYNTHETIC-SOURCE')"));
 report.syntheticAccount=true;
 assert.equal(await submit('/beneficiaries','افزودن طرف‌حساب',{
  name:'VM-SYNTHETIC-BENEFICIARY',iban:iban(2),whitelisted:true}),'SUBMITTED');
 await wait(()=>conn.evaluate("location.pathname==='/beneficiaries'&&document.body?.innerText.includes('طرف‌حساب ثبت شد')&&document.body.innerText.includes('VM-SYNTHETIC-BENEFICIARY')"));
 report.syntheticBeneficiary=true;
 assert.equal(await submit('/payments/new','ثبت پیش‌نویس حواله',{
  sourceAccountId:'@FIRST',beneficiaryId:'@FIRST',amountIrr:'1234567',
  paymentDate:'2026-10-16',clientReference:'VM-DRAFT-'+(process.env.GITHUB_RUN_ID||'LOCAL'),
  description:'VM synthetic draft only'}),'SUBMITTED');
 await wait(()=>conn.evaluate("/^\\/payments\\/[^/]+$/.test(location.pathname)&&document.body?.innerText.includes('VM-DRAFT-')"));
 report.syntheticDraft=true;
 conn.ws.close();
 execFileSync('taskkill.exe',['/T','/F','/PID',String(proc.pid)],{stdio:'ignore',timeout:10000});
 await wait(async()=>{try{await fetch(origin+'/api/ready',{signal:AbortSignal.timeout(1000)});return false;}catch{return true;}},15000);
 proc=spawn(exe,['--remote-debugging-port='+port,'--remote-allow-origins=*'],{env,stdio:'ignore',windowsHide:false});
 const second=await wait(async()=>{
  const r=await fetch(origin+'/api/ready',{signal:AbortSignal.timeout(1500)});
  if(!r.ok)return null;const ready=await r.json();
  if(ready.status!=='ready'||ready.bankAdapter!=='disabled')return null;
  const targets=await (await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1500)})).json();
  return targets.find(p=>p.type==='page'&&p.url?.startsWith(origin)&&p.webSocketDebuggerUrl)?.webSocketDebuggerUrl;
 },75000);
 conn=await connect(second);report.appReopened=true;
 await go('/accounts','حساب‌های بانکی');
 assert(await conn.evaluate("document.body.innerText.includes('VM-SYNTHETIC-SOURCE')"),'NATIVE_ACCOUNT_NOT_DURABLE');
 await go('/beneficiaries','طرف‌حساب‌ها');
 assert(await conn.evaluate("document.body.innerText.includes('VM-SYNTHETIC-BENEFICIARY')"),'NATIVE_BENEFICIARY_NOT_DURABLE');
 await go('/payments','حواله‌ها');
 assert(await conn.evaluate("document.body.innerText.includes('VM-DRAFT-')"),'NATIVE_DRAFT_NOT_DURABLE');
 report.durableData=true;
 await go('/audit','رویدادهای حسابرسی');
 report.auditPersisted=await conn.evaluate("document.body.innerText.includes('ACCOUNT_CREATED')&&document.body.innerText.includes('PAYMENT_CREATED')");
 assert(report.auditPersisted,'NATIVE_AUDIT_NOT_DURABLE');
 report.outcome='REAL_INSTALLED_ELECTRON_GUI_PASS';
}catch(e){report.outcome='FAILED';report.errorCode=(e?.message||'UNKNOWN').slice(0,140);process.exitCode=1;}
finally{
 try{conn?.ws.close()}catch{}
 if(proc){try{execFileSync('taskkill.exe',['/T','/F','/PID',String(proc.pid)],{stdio:'ignore',timeout:10000});}catch{}}
 writeFileSync(join(reportDir,'treasuryflow-native-gui.json'),JSON.stringify(report,null,2));
 console.log('Native Electron CDP GUI:',report.outcome);
}
