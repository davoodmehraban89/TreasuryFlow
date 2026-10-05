import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {filterAudit} from '../../domain/operations/audit-explorer';
import {AuditTable} from './components';

export const dynamic='force-dynamic';

export default async function AuditPage({searchParams}:{searchParams:Promise<{actor?:string;action?:string}>}){
 const params=await searchParams;
 const raw=getDesktopTreasuryService().listAudit();
 const rows=filterAudit('local',raw.map(r=>({tenantId:r.tenantId,seq:r.seq,actor:r.actor,action:r.action,entity:r.entity,at:r.at})),{actor:params.actor||undefined,action:params.action||undefined});
 return <div className="page-stack">
  <section className="page-head"><div><p className="eyebrow">AUDIT TRAIL</p><h2>رویدادهای حسابرسی</h2><p>دفتر رویدادهای عملیاتی به‌صورت فقط‌خواندنی.</p></div></section>
  <section className="panel"><form className="filter-bar compact" method="get"><input name="actor" defaultValue={params.actor??''} placeholder="کاربر"/><input name="action" defaultValue={params.action??''} placeholder="نوع عملیات"/><button className="btn btn-secondary">فیلتر</button></form><AuditTable rows={rows}/></section>
 </div>
}
