import Link from 'next/link';

export type PaymentRow={
  id:string;
  clientReference:string;
  beneficiaryName:string;
  amountIrr:number;
  paymentDate:string;
  state:string;
};

export function validatePaymentDraftInput(input:{
  sourceAccountId:string;
  beneficiaryId:string;
  amountIrr:number;
  paymentDate:string;
  clientReference:string;
}){
  const errors:string[]=[];
  if(!input.sourceAccountId) errors.push('sourceAccountId');
  if(!input.beneficiaryId) errors.push('beneficiaryId');
  if(!Number.isSafeInteger(input.amountIrr)||input.amountIrr<=0) errors.push('amountIrr');
  if(!input.paymentDate) errors.push('paymentDate');
  if(!input.clientReference.trim()) errors.push('clientReference');
  return errors;
}

const stateFa:Record<string,string>={
  DRAFT:'پیش‌نویس',
  PENDING_APPROVAL:'در انتظار تأیید',
  APPROVED:'تأییدشده',
  QUEUED:'در صف ارسال',
  DISPATCHING:'در حال بررسی نتیجه ارسال',
  SUBMITTED:'ارسال‌شده',
  SETTLED:'تسویه‌شده',
  FAILED:'ناموفق',
  UNKNOWN:'نتیجه نامعلوم',
  NEEDS_REVIEW:'نیازمند بررسی'
};

export function PaymentStatus({state}:{state:string}){
  return <span className={'badge badge-'+state.toLowerCase()}>{stateFa[state]??state}</span>;
}

export function PaymentsTable({rows}:{rows:PaymentRow[]}){
  if(rows.length===0) return <div className="empty-state"><strong>حواله‌ای یافت نشد</strong><span>فیلترها را تغییر دهید یا یک حواله جدید ثبت کنید.</span></div>;
  return <div className="table-wrap"><table className="data-table">
    <thead><tr><th>مرجع</th><th>ذی‌نفع</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th><th></th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id}>
      <td><strong>{row.clientReference}</strong></td>
      <td>{row.beneficiaryName}</td>
      <td>{row.amountIrr.toLocaleString('fa-IR')} ریال</td>
      <td>{row.paymentDate}</td>
      <td><PaymentStatus state={row.state}/></td>
      <td><Link className="table-action" href={'/payments/'+row.id}>جزئیات</Link></td>
    </tr>)}</tbody>
  </table></div>;
}
