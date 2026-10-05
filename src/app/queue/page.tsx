import Link from 'next/link';
import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {PaymentStatus} from '../payments/payment-components';
import {queuePaymentAction} from './actions';
import {safeDispatchDecision} from './queue-policy';

export const dynamic='force-dynamic';

export default function QueuePage(){
 const service=getDesktopTreasuryService();
 const beneficiaries=new Map(service.listBeneficiaries().map(b=>[b.id,b.name]));
 const rows=service.listPayments().filter(p=>['APPROVED','QUEUED','UNKNOWN','NEEDS_REVIEW'].includes(p.state));
 return <div className="page-stack">
  <section className="page-head"><div><p className="eyebrow">SUBMISSION QUEUE</p><h2>صف ارسال بانکی</h2><p>حواله‌های تأییدشده برای ورود به صف. ارسال واقعی بانک در این نسخه غیرفعال است.</p></div></section>
  <div className="alert-banner warning"><strong>Bank Adapter غیرفعال است.</strong><span>افزودن به صف مجاز است، اما هیچ درخواست واقعی به بانک ارسال نمی‌شود.</span></div>
  <section className="panel"><div className="section-title"><div><h3>صف کنترل‌شده</h3><p>{rows.length.toLocaleString('fa-IR')} مورد</p></div></div>
   {rows.length===0?<div className="empty-state"><strong>موردی برای صف وجود ندارد</strong><span>حواله پس از تأیید کنترل‌کننده در این بخش ظاهر می‌شود.</span><Link className="btn btn-secondary" href="/payments">مشاهده حواله‌ها</Link></div>:
   <div className="table-wrap"><table><thead><tr><th>مرجع</th><th>ذی‌نفع</th><th>مبلغ</th><th>وضعیت</th><th>تصمیم امن</th></tr></thead><tbody>{rows.map(p=>{const decision=safeDispatchDecision(p.state);return <tr key={p.id}><td><Link href={'/payments/'+p.id}>{p.clientReference}</Link></td><td>{beneficiaries.get(p.beneficiaryId)??'—'}</td><td>{p.amountIrr.toLocaleString('fa-IR')} ریال</td><td><PaymentStatus state={p.state}/></td><td>{decision==='QUEUE'?<form action={queuePaymentAction}><input type="hidden" name="id" value={p.id}/><button className="btn btn-secondary" type="submit">افزودن به صف</button></form>:decision==='MANUAL_REVIEW'?<span className="manual-review">بررسی دستی — بدون Retry</span>:<span className="muted-text">بدون اقدام</span>}</td></tr>})}</tbody></table></div>}
  </section>
 </div>
}
