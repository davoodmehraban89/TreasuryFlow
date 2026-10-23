import Link from 'next/link';
import {getDesktopTreasuryService} from '../../../platform/application/server-service';
import {PaymentStatus} from '../payment-components';
import {approvePaymentAction,submitPaymentAction} from '../payment-actions';

export const dynamic='force-dynamic';

const steps=['DRAFT','PENDING_APPROVAL','APPROVED','QUEUED','DISPATCHING','SUBMITTED','SETTLED'];
const label:Record<string,string>={DRAFT:'پیش‌نویس',PENDING_APPROVAL:'در انتظار تأیید',APPROVED:'تأییدشده',QUEUED:'در صف ارسال',DISPATCHING:'در انتظار نتیجه بانک',SUBMITTED:'ارسال‌شده',SETTLED:'تسویه‌شده'};

export default async function PaymentDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const makerService=getDesktopTreasuryService();
  const payment=makerService.getPayment(id);
  const account=makerService.listAccounts().find(a=>a.id===payment.sourceAccountId);
  const beneficiary=makerService.listBeneficiaries().find(b=>b.id===payment.beneficiaryId);
  const currentIndex=steps.indexOf(payment.state);
  return <div className="detail-page">
    <section className="page-head"><div><p className="eyebrow">TRANSFER DETAIL</p><h2>جزئیات حواله</h2><p>مرجع داخلی: <b>{payment.clientReference}</b></p></div><div className="action-row"><Link className="btn btn-secondary" href="/payments">بازگشت</Link>{payment.state==='DRAFT'&&<form action={submitPaymentAction}><input type="hidden" name="id" value={payment.id}/><button className="btn btn-primary">ارسال برای تأیید</button></form>}{payment.state==='PENDING_APPROVAL'&&<form action={approvePaymentAction}><input type="hidden" name="id" value={payment.id}/><button className="btn btn-primary">تأیید توسط کنترل‌کننده</button></form>}</div></section>
    <section className="detail-grid">
      <article className="panel"><div className="section-title"><div><h3>مشخصات حواله</h3><p>اطلاعات ثبت‌شده و وضعیت فعلی</p></div><PaymentStatus state={payment.state}/></div>
        <dl className="detail-list"><div><dt>مبلغ</dt><dd>{payment.amountIrr.toLocaleString('fa-IR')} ریال</dd></div><div><dt>حساب مبدأ</dt><dd>{account?.name??'—'}<small>{account?.iban}</small></dd></div><div><dt>ذی‌نفع</dt><dd>{beneficiary?.name??'—'}<small>{beneficiary?.iban}</small></dd></div><div><dt>تاریخ پرداخت</dt><dd>{payment.paymentDate}</dd></div><div><dt>شرح</dt><dd>{payment.description||'—'}</dd></div><div><dt>ثبت‌کننده</dt><dd>{payment.makerId}</dd></div></dl>
      </article>
      <article className="panel"><div className="section-title"><div><h3>چرخه حواله</h3><p>مسیر کنترل‌شده از ثبت تا تسویه</p></div></div><ol className="timeline">{steps.map((s,i)=><li key={s} className={i<currentIndex?'done':i===currentIndex?'current':''}><i/><div><strong>{label[s]}</strong><span>{i===currentIndex?'وضعیت فعلی':i<currentIndex?'تکمیل‌شده':'در انتظار'}</span></div></li>)}</ol>{['DISPATCHING','UNKNOWN','NEEDS_REVIEW','FAILED'].includes(payment.state)&&<div className="alert-banner warning"><strong>این حواله نیازمند بررسی دستی است.</strong><span>هیچ موفقیت یا ارسال مجدد خودکاری برای نتیجه نامعلوم انجام نمی‌شود.</span></div>}</article>
    </section>
  </div>
}
