import Link from 'next/link';
import {getDesktopTreasuryService} from '../../../platform/application/server-service';
import {createPaymentAction} from '../payment-actions';

export const dynamic='force-dynamic';

export default async function NewPaymentPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const params=await searchParams;
  const service=getDesktopTreasuryService();
  const accounts=service.listAccounts();
  const beneficiaries=service.listBeneficiaries().filter(b=>b.whitelisted);
  const ready=accounts.length>0&&beneficiaries.length>0;
  return <div className="form-page">
    <section className="page-head"><div><p className="eyebrow">NEW TRANSFER</p><h2>ثبت حواله جدید</h2><p>اطلاعات حواله را وارد کنید. ارسال بانکی در محیط محلی غیرفعال است و ثبت فقط به‌صورت پیش‌نویس انجام می‌شود.</p></div><Link className="btn btn-secondary" href="/payments">بازگشت به حواله‌ها</Link></section>
    {!ready&&<div className="alert-banner warning"><strong>پیش‌نیاز ثبت حواله کامل نیست.</strong><span>ابتدا حداقل یک حساب بانکی و یک طرف‌حساب مجاز تعریف کنید.</span><div><Link href="/accounts">تعریف حساب</Link><Link href="/beneficiaries">تعریف طرف‌حساب</Link></div></div>}
    {params.error&&<div className="alert-banner danger"><strong>اطلاعات فرم کامل یا معتبر نیست.</strong><span>{params.error}</span></div>}
    <form action={createPaymentAction} className="transfer-form panel">
      <div className="form-section"><div className="section-caption"><span>۱</span><div><h3>مبدأ و مقصد</h3><p>حساب برداشت و ذی‌نفع تأییدشده را انتخاب کنید.</p></div></div>
        <div className="form-grid two">
          <label><span>حساب مبدأ</span><select name="sourceAccountId" required disabled={!ready}><option value="">انتخاب حساب</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>)}</select></label>
          <label><span>ذی‌نفع</span><select name="beneficiaryId" required disabled={!ready}><option value="">انتخاب طرف‌حساب</option>{beneficiaries.map(b=><option key={b.id} value={b.id}>{b.name} — {b.iban}</option>)}</select></label>
        </div>
      </div>
      <div className="form-section"><div className="section-caption"><span>۲</span><div><h3>مشخصات پرداخت</h3><p>مبلغ در دیتابیس به ریال نگهداری می‌شود.</p></div></div>
        <div className="form-grid two">
          <label><span>مبلغ (ریال)</span><input name="amountIrr" type="number" min="1" step="1" required inputMode="numeric" placeholder="مثلاً 25000000"/></label>
          <label><span>تاریخ پرداخت</span><input name="paymentDate" type="date" required/></label>
          <label><span>شماره/مرجع داخلی</span><input name="clientReference" required maxLength={80} placeholder="مثلاً PAY-1405-001"/></label>
          <label><span>شرح حواله</span><input name="description" maxLength={240} placeholder="شرح اختیاری"/></label>
        </div>
      </div>
      <div className="form-footer"><div><strong>مرحله بعد</strong><span>حواله به‌صورت پیش‌نویس ثبت می‌شود و سپس برای تأیید ارسال خواهد شد.</span></div><button className="btn btn-primary" type="submit" disabled={!ready}>ثبت پیش‌نویس حواله</button></div>
    </form>
  </div>
}
