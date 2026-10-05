import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {runReconciliationAction} from './actions';
import {ReconciliationResultPanel} from './components';
import type {Reconciliation} from '../../domain/reconciliation';

export const dynamic='force-dynamic';

export default async function ReconciliationPage({searchParams}:{searchParams:Promise<{status?:string;paymentId?:string;candidateIds?:string;error?:string}>}){
 const params=await searchParams;
 const service=getDesktopTreasuryService();
 const accounts=service.listAccounts();
 let result:Reconciliation|undefined;
 if(params.status==='MATCHED'&&params.paymentId) result={status:'MATCHED',paymentId:params.paymentId};
 else if(params.status==='AMBIGUOUS') result={status:'AMBIGUOUS',candidateIds:(params.candidateIds??'').split(',').filter(Boolean)};
 else if(params.status==='UNMATCHED') result={status:'UNMATCHED'};
 return <div className="page-stack">
  <section className="page-head"><div><p className="eyebrow">RECONCILIATION</p><h2>مغایرت‌گیری</h2><p>تطبیق تراکنش بانکی با حواله‌های ثبت‌شده بر اساس حساب، مرجع و مبلغ.</p></div></section>
  <section className="recon-layout">
   <article className="panel">
    <div className="section-title"><div><h3>بررسی تراکنش</h3><p>اطلاعات ردیف صورت‌حساب را وارد کنید.</p></div></div>
    {params.error&&<div className="alert-banner danger"><strong>ورودی نامعتبر است.</strong><span>همه فیلدهای الزامی را کنترل کنید.</span></div>}
    <form action={runReconciliationAction} className="recon-form">
      <label><span>حساب بانکی</span><select name="accountId" required><option value="">انتخاب حساب</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label><span>مرجع بانکی / داخلی</span><input name="reference" required placeholder="REF-..."/></label>
      <label><span>مبلغ تراکنش (ریال)</span><input name="amountIrr" type="number" step="1" required/></label>
      <label><span>تاریخ</span><input name="date" type="date" required/></label>
      <label><span>شناسه ردیف بانک</span><input name="sourceId" placeholder="اختیاری"/></label>
      <button className="btn btn-primary" type="submit" disabled={!accounts.length}>اجرای تطبیق</button>
    </form>
   </article>
   <article className="panel">
    <div className="section-title"><div><h3>نتیجه تطبیق</h3><p>هیچ تطبیق مبهمی به‌صورت خودکار نهایی نمی‌شود.</p></div></div>
    {result?<ReconciliationResultPanel result={result}/>:<div className="empty-state"><strong>هنوز تطبیقی اجرا نشده است</strong><span>اطلاعات تراکنش بانکی را وارد کنید تا نتیجه اینجا نمایش داده شود.</span></div>}
   </article>
  </section>
 </div>
}
