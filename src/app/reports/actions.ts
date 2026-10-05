import {toCsv,type ReportRow} from '../../domain/operations/reports';
export function buildReportCsv(tenantId:string,rows:ReportRow[]){return toCsv(tenantId,rows)}
