import Link from 'next/link';
export function LocalEntryCard(){
 return <section className="local-entry-card">
  <div className="brand-mark login-mark">TF</div>
  <p className="eyebrow">TREASURYFLOW DESKTOP</p>
  <h1>ورود به محیط محلی امن</h1>
  <p>نسخه عملیاتی محلی برای مدیریت خزانه‌داری. داده‌ها روی همین دستگاه نگهداری می‌شوند.</p>
  <div className="local-safety"><strong>ارسال بانکی واقعی غیرفعال است</strong><span>هیچ درخواست بانکی بدون Adapter و پیکربندی صریح اجرا نمی‌شود.</span></div>
  <Link className="btn btn-primary login-button" href="/dashboard">ورود به داشبورد</Link>
 </section>;
}
