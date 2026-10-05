export function maskIban(iban:string){return iban.replace(/(.{4})/g,'$1 ').trim()}
export function AccountCards({rows}:{rows:{id:string;name:string;iban:string;bankName:string;status:string}[]}){
 if(!rows.length)return <div className="empty-state"><strong>حساب بانکی تعریف نشده است</strong><span>برای ثبت حواله، ابتدا حساب مبدأ را اضافه کنید.</span></div>;
 return <div className="account-grid">{rows.map(a=><article className="account-card" key={a.id}><div className="account-top"><div><span className="bank-pill">{a.bankName}</span><h3>{a.name}</h3></div><span className="badge badge-settled">فعال</span></div><code>{maskIban(a.iban)}</code><div className="account-meta"><span>موجودی زنده در دسترس نیست</span><span>اتصال بانکی غیرفعال امن</span></div></article>)}</div>
}
export function BeneficiaryTable({rows}:{rows:{id:string;name:string;iban:string;whitelisted:boolean}[]}){
 if(!rows.length)return <div className="empty-state"><strong>طرف‌حسابی ثبت نشده است</strong><span>ذی‌نفعان مجاز حواله را تعریف کنید.</span></div>;
 return <div className="table-wrap"><table><thead><tr><th>نام</th><th>شبا</th><th>وضعیت مجاز</th></tr></thead><tbody>{rows.map(b=><tr key={b.id}><td><strong>{b.name}</strong></td><td dir="ltr">{maskIban(b.iban)}</td><td><span className={b.whitelisted?'badge badge-settled':'badge'}>{b.whitelisted?'مجاز':'غیرفعال'}</span></td></tr>)}</tbody></table></div>
}
