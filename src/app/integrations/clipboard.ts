/** Copy precisely the editor's current text without sending it to a server. */
export async function copyQueryText(text:string):Promise<boolean>{
 if(!text)return false;
 try{
  if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(text);return true;
  }
 }catch{/* Fall back for desktop browsers */ }
 if(typeof document==='undefined')return false;
 const field=document.createElement('textarea');field.value=text;field.readOnly=true;
 field.setAttribute('aria-hidden','true');
 field.style.cssText='position:fixed;opacity:0;pointer-events:none;left:0;top:0';
 try{document.body.appendChild(field);field.focus();field.select();return document.execCommand('copy');}
 catch{return false;}finally{field.remove();}
}
