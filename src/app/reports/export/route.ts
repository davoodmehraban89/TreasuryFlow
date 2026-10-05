import {getDesktopTreasuryService} from '../../../platform/application/server-service';
import {buildReportCsv} from '../actions';

export const dynamic='force-dynamic';

export async function GET(request:Request){
 const url=new URL(request.url);
 const state=url.searchParams.get('state')??'';
 const rows=getDesktopTreasuryService().listPayments().filter(p=>!state||p.state===state).map(p=>({tenantId:p.tenantId,reference:p.clientReference,state:p.state,amountIrr:p.amountIrr}));
 const csv=buildReportCsv('local',rows);
 return new Response('\uFEFF'+csv,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="treasuryflow-report.csv"'}});
}
