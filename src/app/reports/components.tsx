export function ReportSummary({summary}:{summary:{count:number;totalIrr:number;settledIrr:number}}){
 return <div className="report-kpis">
  <article><span>تعداد حواله</span><strong>{summary.count.toLocaleString('fa-IR')}</strong></article>
  <article><span>مبلغ کل</span><strong>{summary.totalIrr.toLocaleString('fa-IR')} <em>ریال</em></strong></article>
  <article><span>تسویه‌شده</span><strong>{summary.settledIrr.toLocaleString('fa-IR')} <em>ریال</em></strong></article>
 </div>
}
