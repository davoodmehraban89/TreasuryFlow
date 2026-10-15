import {QueryEditor} from './query-editor';
export const metadata={title:'اتصال به دیتابیس | TreasuryFlow'};
const requiredColumns=[
 {name:'Row_ID',purpose:'کلید ردیف منبع'},
 {name:'Destination_IBAN',purpose:'شبای مقصد'},
 {name:'Beneficiary_Name',purpose:'نام ذی‌نفع'},
 {name:'Amount_IRR',purpose:'مبلغ صحیح به ریال'},
 {name:'Client_Reference',purpose:'شناسه یکتا نزد خزانه'},
 {name:'Payment_Identifier',purpose:'شناسه پرداخت، در صورت وجود'},
 {name:'Deposit_Identifier',purpose:'شناسه واریز، در صورت وجود'}
] as const;
export default function IntegrationsPage(){
 return <div className="page-stack">
  <header className="page-head"><div><p className="eyebrow">DATABASE INTEGRATION</p>
   <h2>اتصال به دیتابیس</h2>
   <p>طراحی قرارداد خواندن داده از SQL Server بدون تغییر جداول حسابداری.</p>
  </div></header>
  <div className="alert-banner">
   اتصال زنده در این مرحله فعال نیست؛ برای جلوگیری از افشای داده و تغییر ناخواسته، هیچ تنظیمات محرمانه‌ای در این صفحه دریافت یا ذخیره نمی‌شود.
  </div>
  <QueryEditor/>
  <section className="panel" aria-labelledby="expected-fields">
   <div className="section-title"><div><h3 id="expected-fields">قرارداد خروجی پیشنهادی حواله</h3>
    <p>ساختار واقعی را می‌توان با SQL View یا نام مستعار ستون‌ها (AS) به این قرارداد نگاشت.</p>
   </div></div>
   <div className="table-wrap"><table><thead><tr><th scope="col">ستون پیشنهادی</th><th scope="col">کاربرد</th></tr></thead>
    <tbody>{requiredColumns.map(item=><tr key={item.name}><td dir="ltr">{item.name}</td><td>{item.purpose}</td></tr>)}</tbody>
   </table></div>
  </section>
 </div>;
}
