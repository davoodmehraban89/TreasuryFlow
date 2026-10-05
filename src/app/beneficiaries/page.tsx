import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {BeneficiaryTable} from '../master-data/components';
import {createBeneficiaryAction} from '../master-data/actions';
export const dynamic='force-dynamic';
export default async function BeneficiariesPage({searchParams}:{searchParams:Promise<{error?:string;created?:string}>}){
 const params=await searchParams;const rows=getDesktopTreasuryService().listBeneficiaries();
 return <div className="page-stack"><section className="page-head"><div><p className="eyebrow">BENEFICIARIES</p><h2>طرف‌حساب‌ها</h2><p>ذی‌نفعان مجاز حواله و شماره شبای مقصد.</p></div></section>
 {params.error&&<div className="alert-banner danger"><strong>ثبت طرف‌حساب انجام نشد.</strong><span>{params.error}</span></div>}
 {params.created&&<div className="alert-banner success"><strong>طرف‌حساب ثبت شد.</strong><span>وضعیت مجاز بودن آن در جدول مشخص است.</span></div>}
 <section className="panel"><div className="section-title"><div><h3>فهرست طرف‌حساب‌ها</h3><p>{rows.length.toLocaleString('fa-IR')} رکورد</p></div></div><BeneficiaryTable rows={rows}/></section>
 <section className="panel"><div className="section-title"><div><h3>افزودن طرف‌حساب</h3><p>برای استفاده در حواله، مقصد باید صریحاً مجاز شود.</p></div></div><form action={createBeneficiaryAction} className="inline-form"><label><span>نام ذی‌نفع</span><input name="name" required placeholder="نام شخص یا شرکت"/></label><label className="wide"><span>شماره شبا</span><input name="iban" dir="ltr" required placeholder="IR..."/></label><label className="check-label"><input type="checkbox" name="whitelisted" defaultChecked/><span>مقصد مجاز برای حواله</span></label><button className="btn btn-primary" type="submit">افزودن طرف‌حساب</button></form></section>
 </div>
}
