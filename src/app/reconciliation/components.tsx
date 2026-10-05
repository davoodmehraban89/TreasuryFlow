import Link from 'next/link';
import type {Reconciliation} from '../../domain/reconciliation';

export function ReconciliationResultPanel({result}:{result:Reconciliation}){
 if(result.status==='MATCHED') return <div className="recon-result matched"><strong>تطبیق قطعی</strong><span>این تراکنش با یک حواله منطبق شد.</span><Link href={'/payments/'+result.paymentId}>مشاهده حواله</Link></div>;
 if(result.status==='AMBIGUOUS') return <div className="recon-result ambiguous"><strong>نیازمند بررسی دستی</strong><span>{result.candidateIds.length.toLocaleString('fa-IR')} حواله کاندید پیدا شد؛ انتخاب خودکار انجام نشد.</span></div>;
 return <div className="recon-result unmatched"><strong>تطبیقی پیدا نشد</strong><span>این ردیف باید توسط کاربر بررسی شود.</span></div>;
}
