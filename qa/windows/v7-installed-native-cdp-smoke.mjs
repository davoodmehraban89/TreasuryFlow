import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const [exe,fixtureDir]=process.argv.slice(2);
assert.equal(process.platform,'win32');
assert(exe&&existsSync(exe)&&fixtureDir,'EXACT_INSTALLED_EXE_AND_ISOLATED_DIR_REQUIRED');
mkdirSync(fixtureDir,{recursive:true});
const root='http://127.0.0.1:3210',debug='http://127.0.0.1:9345';
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const report={status:'NOT_RUN',cdpConnected:false,bankDisabled:false,
  pages:[],actualLocalClick:false,stage:'BOOT',reconnections:0};
let app,conn;
async function targets(){
 const response=await fetch(debug+'/json/list',{signal:AbortSignal.timeout(2000)});
 assert(response.ok,'CDP_TARGET_LIST_UNAVAILABLE');
 return response.json();
}
async function connect(target){
 const ws=new WebSocket(target);
 await new Promise((ok,fail)=>{
   const timer=setTimeout(()=>fail(Error('CDP_CONNECT_TIMEOUT')),10000);
   ws.addEventListener('open',()=>{clearTimeout(timer);ok()},{once:true});
   ws.addEventListener('error',()=>{clearTimeout(timer);fail(Error('CDP_CONNECT_ERROR'));},{once:true});
 });
 let id=0;const pending=new Map();
 ws.addEventListener('message',message=>{
   let v;try{v=JSON.parse(message.data)}catch{return}
   const p=pending.get(v.id);if(!p)return;
   pending.delete(v.id);clearTimeout(p.timer);
   v.error?p.fail(Error('CDP_REMOTE_ERROR')):p.ok(v.result);
 });
 const send=(method,params={})=>new Promise((ok,fail)=>{
   const n=++id,timer=setTimeout(()=>{pending.delete(n);fail(Error('CDP_COMMAND_TIMEOUT'))},12000);
   pending.set(n,{ok,fail,timer});
   ws.send(JSON.stringify({id:n,method,params}));
 });
 const evaluate=async expression=>{
   const reply=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
   if(reply.exceptionDetails)throw Error('CDP_SCRIPT_ERROR');
   return reply.result?.value;
 };
 await send('Runtime.enable');await send('Page.enable');
 return {ws,send,evaluate,uri:target};
}
async function until(fn,timeoutMs=65000){
 const stop=Date.now()+timeoutMs;let latest;
 while(Date.now()<stop){
   // On Windows, the launcher PID may exit after handing off to a renderer.
   // Require actual localhost readiness and CDP instead of equating launcher
   // lifecycle with failure. The test deadline remains bounded.
   if(app?.exitCode!==null&&app?.exitCode!==undefined)report.launcherExited=true;
   try{const outcome=await fn();if(outcome)return outcome}catch(e){latest=e}
   await sleep(350);
 }
 throw latest||Error('CDP_NATIVE_ROUTE_TIMEOUT');
}
async function attach(expectedPath){
 const listing=await targets();
 const matched=listing.find(p=>p.type==='page'&&p.url?.startsWith(root)&&p.webSocketDebuggerUrl);
 if(!matched)return null;
 if(!conn||conn.uri!==matched.webSocketDebuggerUrl){
   const fresh=await connect(matched.webSocketDebuggerUrl);
   try{conn?.ws.close()}catch{}
   conn=fresh;report.reconnections++;
 }
 const result=await conn.evaluate("({route:location.pathname,text:document.body?.innerText||'',anchors:[...document.querySelectorAll('a')].map(a=>a.getAttribute('href'))})");
 return result?.route===expectedPath?result:null;
}
async function go(path,heading){
 report.stage='ROUTE_'+path.replace(/[^a-z]/gi,'_');
 const initial=await attach(path).catch(()=>null);
 if(!initial){
   if(conn)await conn.send('Page.navigate',{url:root+path}).catch(()=>null);
   else {
     await until(async()=>{const targetsNow=await targets();return targetsNow.some(p=>p.type==='page'&&p.url?.startsWith(root))});
     const existing=await attach('/login').catch(()=>null);
     if(!existing){const listing=await targets();const t=listing.find(p=>p.type==='page'&&p.webSocketDebuggerUrl);if(t)conn=await connect(t.webSocketDebuggerUrl)}
     await conn?.send('Page.navigate',{url:root+path}).catch(()=>null);
   }
 }
 return until(async()=>{
   const p=await attach(path);
   return p&&p.text.includes(heading)?p:null;
 },65000);
}
try{
 const separateUserData=join(fixtureDir,'isolated-electron-localappdata');
 const roamingUserData=join(fixtureDir,'isolated-electron-roaming-appdata');
 mkdirSync(separateUserData,{recursive:true});
 mkdirSync(roamingUserData,{recursive:true});
 // Electron userData on Windows defaults to APPDATA (Roaming), not LOCALAPPDATA.
 // Both must be isolated after force-killing the preceding synthetic launcher.
 const env={...process.env,LOCALAPPDATA:separateUserData,APPDATA:roamingUserData,TREASURYFLOW_DESKTOP_LOCAL:'1',BANK_ADAPTER_MODE:'disabled',
   TREASURYFLOW_ENABLE_MAYAN_EXTERNAL_READ:'0',TREASURYFLOW_MAYAN_ENABLE_EXTERNAL_READ:'0',
   TREASURYFLOW_ENABLE_SQL_LAB:'0',
   TREASURYFLOW_DATA_FILE:join(fixtureDir,'synthetic-v7-ui.sqlite')};
 const prior=await fetch(root+'/api/ready',{signal:AbortSignal.timeout(900)}).then(()=>true,()=>false);
 assert(!prior,'STALE_LOCAL_SERVICE_BEFORE_TEST');
 app=spawn(exe,['--remote-debugging-port=9345','--remote-allow-origins=*'],{env,stdio:'ignore'});
 report.stage='LOCAL_READY';
 const ready=await until(async()=>{
   const r=await fetch(root+'/api/ready',{signal:AbortSignal.timeout(1400)});
   if(!r.ok)return null;
   const v=await r.json();
   return v.status==='ready'&&v.bankAdapter==='disabled'?v:null;
 },65000);
 assert.equal(ready.bankAdapter,'disabled');
 report.bankDisabled=true;
 const login=await go('/login','ورود به محیط محلی امن');
 report.cdpConnected=true;
 assert(login.anchors.includes('/dashboard'),'NATIVE_LOCAL_LOGIN_ENTRY_MISSING');
 const clicked=await conn.evaluate("(()=>{const anchor=document.querySelector('a[href=\"/dashboard\"]');if(!anchor)return false;anchor.click();return true})()");
 assert(clicked,'NATIVE_ENTRY_NOT_CLICKABLE');
 await until(async()=>attach('/dashboard').then(x=>x?.text.includes('داشبورد خزانه‌داری')?x:null),65000);
 report.actualLocalClick=true;
 for(const [route,title] of [
   ['/dashboard','داشبورد خزانه‌داری'],['/payments','حواله‌ها'],
   ['/accounts','حساب‌های بانکی'],['/queue','صف ارسال بانکی'],
   ['/audit','رویدادهای حسابرسی']]){
   const view=await go(route,title);
   assert(view.text.includes(title),'NATIVE_ROUTE_HEADING_MISSING');
   report.pages.push({route,pass:true});
 }
 const queue=await go('/queue','صف ارسال بانکی');
 assert(queue.text.includes('غیرفعال'),'LIVE_BANK_MUST_REMAIN_DISABLED');
 const screen=await conn.send('Page.captureScreenshot',{format:'png'});
 assert(typeof screen.data==='string'&&screen.data.length>1000,'NATIVE_REAL_RENDERER_SCREENSHOT_MISSING');
 report.screenshot=true;
 report.status='PASS';
 console.log('GATE_PASS_V7_NONFINAL_REAL_ELECTRON_CDP_LOGIN_CLICK_FIVE_ROUTES_SIX_PAGES_BANK_DISABLED');
}catch(e){
 report.status='FAIL';
 report.error=String(e?.message||'UNKNOWN').replace(/[^A-Z0-9_]/gi,'_').slice(0,90);
 report.launcherExitCode=Number.isInteger(app?.exitCode)?app.exitCode:null;
 report.cdpAttempts=report.reconnections;
 console.log('V7_NATIVE_CDP_FAILURE_CLASS_'+report.error);
 process.exitCode=1;
}finally{
 try{conn?.ws.close()}catch{}
 if(app?.pid)try{execFileSync('taskkill.exe',['/PID',String(app.pid),'/T','/F'],{stdio:'ignore',timeout:14000})}catch{}
 writeFileSync(join(fixtureDir,'v7-native-cdp-qa.json'),JSON.stringify(report,null,2));
}