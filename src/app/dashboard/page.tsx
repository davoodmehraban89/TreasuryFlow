import {getDesktopTreasuryService} from '../../platform/application/server-service';
import {DashboardView} from './dashboard-view';
export const dynamic='force-dynamic';
export default function DashboardPage(){
 const service=getDesktopTreasuryService();
 const summary=service.getDashboard();
 const recent=service.listPayments().slice(-6).reverse().map(p=>({id:p.id,reference:p.clientReference,amountIrr:p.amountIrr,state:p.state}));
 return <DashboardView data={summary} recent={recent}/>;
}
