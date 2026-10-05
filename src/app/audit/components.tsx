export type AuditRow={tenantId:string;seq:number;actor:string;action:string;entity:string;at:number};
export function AuditTable({rows}:{rows:AuditRow[]}){
 if(!rows.length)return <div className="empty-state"><strong>رویداد حسابرسی یافت نشد</strong><span>عملیات حساس ثبت‌شده در اینجا نمایش داده می‌شود.</span></div>;
 return <div className="table-wrap"><table><thead><tr><th>ردیف</th><th>کاربر</th><th>عملیات</th><th>موجودیت</th><th>زمان</th></tr></thead><tbody>{rows.map(r=><tr key={r.seq}><td>{r.seq.toLocaleString('fa-IR')}</td><td>{r.actor}</td><td><code>{r.action}</code></td><td>{r.entity}</td><td>{new Date(r.at).toLocaleString('fa-IR')}</td></tr>)}</tbody></table></div>
}
