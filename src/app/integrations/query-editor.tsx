'use client';
import {useState} from 'react';
import {copyQueryText} from './clipboard';
import {SAMPLE_READ_ONLY_SQL,validateReadOnlySql} from '../../platform/integration/read-only-query';

/** A local-only editor: no database call and no secret storage. */
export function QueryEditor(){
 const [sql,setSql]=useState(SAMPLE_READ_ONLY_SQL);
 const [feedback,setFeedback]=useState<'idle'|'copied'|'error'>('idle');
 const result=validateReadOnlySql(sql);
 async function copy(){const ok=await copyQueryText(sql);setFeedback(ok?'copied':'error');}
 return <section className="panel" aria-labelledby="read-only-query-title">
  <div className="section-title"><div>
   <h3 id="read-only-query-title">Read Only Query — نمونه SQL قابل ویرایش</h3>
   <p>نام جدول و ستون‌ها نمونه‌اند؛ آن‌ها را بر اساس ساختار واقعی SQL Server تنظیم کنید.</p>
  </div></div>
  <label htmlFor="treasuryflow-sql-editor">متن کوئری</label>
  <textarea id="treasuryflow-sql-editor" dir="ltr" lang="en"
   spellCheck={false} value={sql} rows={13}
   onChange={event=>{setSql(event.target.value);setFeedback('idle');}}
   style={{width:'100%',minHeight:280,padding:16,border:'1px solid #cbd5e1',borderRadius:10,fontFamily:'Consolas,monospace',fontSize:13,lineHeight:1.7,resize:'vertical',direction:'ltr',textAlign:'left'}}
   aria-describedby="sql-readonly-status"/>
  <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:10,marginTop:12}}>
   <button type="button" className="btn btn-primary" disabled={!sql} onClick={copy}>کپی کوئری</button>
   <button type="button" className="btn btn-secondary"
    onClick={()=>{setSql(SAMPLE_READ_ONLY_SQL);setFeedback('idle');}}>بازگردانی نمونه</button>
   <span id="sql-readonly-status" role="status" aria-live="polite">
    {feedback==='copied'?'متن کامل کوئری کپی شد.':
     feedback==='error'?'کپی خودکار ممکن نبود؛ متن را انتخاب و با Ctrl+C کپی کنید.':
     result.ok?'ساختار اولیه کوئری قابل قبول است؛ این تأیید اتصال یا مجوز SQL نیست.':
     'کوئری باید یک SELECT ساده و فقط‌خواندنی باشد.'}
   </span>
  </div>
  {!result.ok&&<p className="alert-banner danger" role="alert" data-code={result.code}>
   کوئری برای اجرای پیش‌نمایش مجاز نیست: {result.message}</p>}
  <p style={{fontSize:12,color:'#667085',lineHeight:1.9,marginTop:12}}>
   این صفحه هیچ کوئری را اجرا نمی‌کند. اعتبارسنجی محلی جایگزین حساب SQL با دسترسی صرفاً SELECT نیست.
   برای خواندن واقعی باید اتصال تست، حساب کم‌اختیار و نگاشت ستون‌ها جداگانه تأیید شود.
  </p>
 </section>;
}
