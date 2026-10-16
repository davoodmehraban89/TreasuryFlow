import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join,basename} from 'node:path';
assert.equal(process.platform,'win32');
const [exe,reportDir]=process.argv.slice(2);
assert(exe&&existsSync(exe),'real installed TreasuryFlow.exe required');
assert(reportDir,'evidence output directory required');
mkdirSync(reportDir,{recursive:true});
const port=9345;
const report={mode:'REAL_INSTALLED_ELECTRON_CDP',exe:basename(exe),cdp:false,localOrigin:false,integrations:false,queryEditor:false,copyQuery:false,screenshot:false,outcome:'NOT_RUN'};
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
 const env={...process.env,BANK_ADAPTER_MODE:'disabled',TREASURYFLOW_DESKTOP_LOCAL:'1'};
 proc=spawn(exe,['--remote-debugging-port='+port,'--remote-allow-origins=*'],{env,stdio:'ignore',windowsHide:false});
 const target=await wait(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(1500)});
 if(!r.ok)return null;const pages=await r.json();
 return pages.find(p=>p.type==='page'&&p.url?.startsWith('http://127.0.0.1:3210')&&p.webSocketDebuggerUrl)?.webSocketDebuggerUrl;});
 conn=await connect(target);report.cdp=true;
 const home=await wait(()=>conn.evaluate('({href:location.href,title:document.title})'));
 report.localOrigin=new URL(home.href).origin==='http://127.0.0.1:3210';
 assert(report.localOrigin,'NATIVE_APP_ORIGIN_NOT_LOCAL');
 assert.match(home.title,/TreasuryFlow/i);
 await conn.command('Page.navigate',{url:'http://127.0.0.1:3210/integrations'});
 const page=await wait(async()=>{const x=await conn.evaluate(
 "({href:location.href,title:document.title,editor:!!document.querySelector('textarea'),copy:[...document.querySelectorAll('button')].some(b=>b.textContent.includes('کپی کوئری'))})");
 return x?.href?.endsWith('/integrations')?x:null;});
 report.integrations=true;report.queryEditor=page.editor;report.copyQuery=page.copy;
 assert(report.queryEditor,'QUERY_EDITOR_MISSING_IN_NATIVE_APP');
 assert(report.copyQuery,'COPY_BUTTON_MISSING_IN_NATIVE_APP');
 const png=await conn.command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 assert(png.data,'NATIVE_SCREENSHOT_MISSING');
 writeFileSync(join(reportDir,'treasuryflow-installed-ui.png'),Buffer.from(png.data,'base64'));report.screenshot=true;
 report.outcome='REAL_INSTALLED_ELECTRON_GUI_PASS';
}catch(e){report.outcome='FAILED';report.errorCode=(e?.message||'UNKNOWN').slice(0,140);process.exitCode=1;}
finally{
 try{conn?.ws.close()}catch{}
 if(proc){try{execFileSync('taskkill.exe',['/T','/F','/PID',String(proc.pid)],{stdio:'ignore',timeout:10000});}catch{}}
 writeFileSync(join(reportDir,'treasuryflow-native-gui.json'),JSON.stringify(report,null,2));
 console.log('Native Electron CDP GUI:',report.outcome);
}
