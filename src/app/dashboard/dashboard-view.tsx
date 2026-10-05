import Link from 'next/link';

type Summary={total:number;totalIrr:number;unknown:number;settled:number;needsReview:number};
type Recent={id:string;reference:string;amountIrr:number;state:string}[];

const faNumber=(n:number)=>n.toLocaleString('fa-IR');

export function DashboardView({data,recent}:{data:Summary;recent:Recent}){
  const pending=Math.max(0,data.total-data.settled);
  return <div className="dashboard-page">
    <section className="page-head">
      <div>
        <p className="eyebrow">TREASURY OPERATIONS</p>
        <h2>داشبورد خزانه‌داری</h2>
        <p>نمای لحظه‌ای از وضعیت حواله‌ها، موارد نیازمند بررسی و سلامت عملیات محلی.</p>
      </div>
      <Link className="btn btn-primary" href="/payments/new">+ ثبت حواله جدید</Link>
    </section>

    <section className="stat-grid" aria-label="شاخص‌های اصلی">
      <Link href="/payments" className="stat-card">
        <span className="stat-label">کل حواله‌ها</span>
        <strong>{faNumber(data.total)}</strong>
        <small>مشاهده فهرست کامل</small>
      </Link>
      <Link href="/payments?state=PENDING" className="stat-card">
        <span className="stat-label">در جریان</span>
        <strong>{faNumber(pending)}</strong>
        <small>پیش‌نویس، تأیید و صف</small>
      </Link>
      <Link href="/payments?state=NEEDS_REVIEW" className="stat-card warning-card">
        <span className="stat-label">نیازمند بررسی</span>
        <strong>{faNumber(data.needsReview+data.unknown)}</strong>
        <small>نتیجه نامعلوم یا مورد باز</small>
      </Link>
      <Link href="/reports" className="stat-card">
        <span className="stat-label">مبلغ کل ثبت‌شده</span>
        <strong>{faNumber(data.totalIrr)} <em>ریال</em></strong>
        <small>گزارش‌های عملیاتی</small>
      </Link>
    </section>

    <section className="dashboard-grid">
      <article className="panel">
        <div className="section-title">
          <div><h3>فعالیت اخیر</h3><p>آخرین حواله‌های ثبت‌شده در محیط محلی</p></div>
          <Link href="/payments">مشاهده همه</Link>
        </div>
        {recent.length===0?<div className="empty-state"><strong>هنوز حواله‌ای ثبت نشده است</strong><span>برای شروع، حساب بانکی و طرف‌حساب را تعریف و اولین حواله را ایجاد کنید.</span><Link href="/payments/new" className="btn btn-secondary">ثبت اولین حواله</Link></div>:
        <div className="table-wrap"><table><thead><tr><th>مرجع</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>{recent.map(row=><tr key={row.id}><td><Link href={'/payments/'+row.id}>{row.reference}</Link></td><td>{faNumber(row.amountIrr)} ریال</td><td><span className={'badge badge-'+row.state.toLowerCase()}>{row.state}</span></td></tr>)}</tbody></table></div>}
      </article>

      <div className="side-stack">
        <article className="panel health-panel">
          <div className="section-title"><div><h3>سلامت اتصال</h3><p>وضعیت کانال‌های عملیاتی</p></div></div>
          <ul className="health-list">
            <li><span><i className="health-dot ok"/>داده محلی</span><b>فعال</b></li>
            <li><span><i className="health-dot muted"/>اتصال بانک</span><b>غیرفعال امن</b></li>
            <li><span><i className="health-dot ok"/>ثبت حسابرسی</span><b>فعال</b></li>
          </ul>
        </article>
        <article className="panel shortcut-panel">
          <div className="section-title"><div><h3>کنترل‌های کلیدی</h3><p>مسیرهای پرتکرار عملیات</p></div></div>
          <div className="shortcut-grid">
            <Link href="/reconciliation">مغایرت‌گیری</Link>
            <Link href="/queue">صف ارسال</Link>
            <Link href="/accounts">حساب‌های بانکی</Link>
            <Link href="/audit">حسابرسی</Link>
          </div>
        </article>
      </div>
    </section>
  </div>
}
