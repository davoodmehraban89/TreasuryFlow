import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {report} from '../../domain/operations/reports';
import {ReportSummary} from './components';

export const dynamic='force-dynamic';

export default async function ReportsPage({searchParams}:{searchParams:Promise<{state?:string}>}){
 const params=await searchParams;
 const service=getDesktopTreasuryService();
 const state=params.state??'';
 const rows=service.listPayments().filter(p=>!state||p.state===state).map(p=>({tenantId:p.tenantId,reference:p.clientReference,state:p.state,amountIrr:p.amountIrr}));
 const summary=report('local',rows);
 return <div className="page-stack">
  <section className="page-head"><div><p className="eyebrow">REPORTING</p><h2>گزارش‌های خزانه‌داری</h2><p>گزارش عملیاتی از داده‌های واقعی ثبت‌شده در همین محیط.</p></div><a className="btn btn-secondary" href={'/reports/export'+(state?'?state='+encodeURIComponent(state):'')}>دانلود CSV</a></section>
  <ReportSummary summary={summary}/>
  <section className="panel"><form className="filter-bar compact" method="get"><select name="state" defaultValue={state}><option value="">همه وضعیت‌ها</option><option value="DRAFT">پیش‌نویس</option><option value="PENDING_APPROVAL">در انتظار تأیید</option><option value="APPROVED">تأییدشده</option><option value="QUEUED">در صف</option><option value="SETTLED">تسویه‌شده</option></select><button className="btn btn-secondary">اعمال</button></form>
   {rows.length===0?<div className="empty-state"><strong>داده‌ای برای گزارش وجود ندارد</strong><span>پس از ثبت حواله، گزارش اینجا تکمیل می‌شود.</span></div>:<div className="table-wrap"><table><thead><tr><th>مرجع</th><th>وضعیت</th><th>مبلغ</th></tr></thead><tbody>{rows.map(r=><tr key={r.reference}><td>{r.reference}</td><td>{r.state}</td><td>{r.amountIrr.toLocaleString('fa-IR')} ریال</td></tr>)}</tbody></table></div>}
  </section>
 </div>
}
