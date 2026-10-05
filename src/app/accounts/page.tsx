import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {AccountCards} from '../master-data/components';
import {createAccountAction} from '../master-data/actions';
export const dynamic='force-dynamic';
export default async function AccountsPage({searchParams}:{searchParams:Promise<{error?:string;created?:string}>}){
 const params=await searchParams;const rows=getDesktopTreasuryService().listAccounts();
 return <div className="page-stack"><section className="page-head"><div><p className="eyebrow">BANK ACCOUNTS</p><h2>حساب‌های بانکی</h2><p>حساب‌های مبدأ حواله. موجودی یا اتصال زنده فقط در صورت وجود Adapter واقعی نمایش داده می‌شود.</p></div></section>
 {params.error&&<div className="alert-banner danger"><strong>ثبت حساب انجام نشد.</strong><span>{params.error}</span></div>}
 {params.created&&<div className="alert-banner success"><strong>حساب ثبت شد.</strong><span>اکنون می‌توانید از آن به‌عنوان مبدأ حواله استفاده کنید.</span></div>}
 <section className="panel"><div className="section-title"><div><h3>حساب‌های ثبت‌شده</h3><p>{rows.length.toLocaleString('fa-IR')} حساب</p></div></div><AccountCards rows={rows}/></section>
 <section className="panel"><div className="section-title"><div><h3>افزودن حساب بانکی</h3><p>شماره شبا با کنترل معتبر ایران بررسی می‌شود.</p></div></div><form action={createAccountAction} className="inline-form"><label><span>نام حساب</span><input name="name" required placeholder="مثلاً حساب جاری شرکت"/></label><label><span>بانک</span><input name="bankName" required placeholder="نام بانک"/></label><label className="wide"><span>شماره شبا</span><input name="iban" dir="ltr" required placeholder="IR..."/></label><button className="btn btn-primary" type="submit">افزودن حساب</button></form></section>
 </div>
}
