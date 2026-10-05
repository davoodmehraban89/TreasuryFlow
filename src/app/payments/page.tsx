import Link from 'next/link';
import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {PaymentsTable} from './payment-components';

export const dynamic='force-dynamic';

export default async function PaymentsPage({searchParams}:{searchParams:Promise<{q?:string;state?:string}>}){
  const params=await searchParams;
  const service=getDesktopTreasuryService();
  const beneficiaries=new Map(service.listBeneficiaries().map(b=>[b.id,b.name]));
  const q=(params.q??'').trim().toLowerCase();
  const state=(params.state??'').trim();
  const rows=service.listPayments()
    .filter(p=>!state||p.state===state||state==='PENDING'&&['DRAFT','PENDING_APPROVAL','APPROVED','QUEUED'].includes(p.state))
    .filter(p=>!q||p.clientReference.toLowerCase().includes(q)||(beneficiaries.get(p.beneficiaryId)??'').toLowerCase().includes(q))
    .map(p=>({id:p.id,clientReference:p.clientReference,beneficiaryName:beneficiaries.get(p.beneficiaryId)??'—',amountIrr:p.amountIrr,paymentDate:p.paymentDate,state:p.state}));
  return <div className="page-stack">
    <section className="page-head"><div><p className="eyebrow">PAYMENTS</p><h2>حواله‌ها</h2><p>مدیریت پیش‌نویس، تأیید، صف ارسال و وضعیت حواله‌های خزانه‌داری.</p></div><Link className="btn btn-primary" href="/payments/new">+ ثبت حواله</Link></section>
    <section className="panel">
      <form className="filter-bar" method="get">
        <input name="q" defaultValue={params.q??''} placeholder="جستجو بر اساس مرجع یا ذی‌نفع" aria-label="جستجوی حواله"/>
        <select name="state" defaultValue={params.state??''} aria-label="فیلتر وضعیت">
          <option value="">همه وضعیت‌ها</option><option value="DRAFT">پیش‌نویس</option><option value="PENDING_APPROVAL">در انتظار تأیید</option><option value="APPROVED">تأییدشده</option><option value="QUEUED">در صف ارسال</option><option value="SETTLED">تسویه‌شده</option><option value="NEEDS_REVIEW">نیازمند بررسی</option>
        </select>
        <button className="btn btn-secondary" type="submit">اعمال فیلتر</button>
      </form>
      <PaymentsTable rows={rows}/>
    </section>
  </div>
}
