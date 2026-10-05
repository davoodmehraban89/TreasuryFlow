export type NavItem={labelFa:string;href:string;group:'operations'|'controls'|'reports';icon:string};
export const PRIMARY_NAV:readonly NavItem[]=[
{labelFa:'داشبورد',href:'/dashboard',group:'operations',icon:'⌂'},
{labelFa:'حواله‌ها',href:'/payments',group:'operations',icon:'⇄'},
{labelFa:'ثبت حواله',href:'/payments/new',group:'operations',icon:'＋'},
{labelFa:'حساب‌های بانکی',href:'/accounts',group:'operations',icon:'▣'},
{labelFa:'مغایرت‌گیری',href:'/reconciliation',group:'controls',icon:'≋'},
{labelFa:'صف ارسال',href:'/queue',group:'controls',icon:'↥'},
{labelFa:'طرف‌حساب‌ها',href:'/beneficiaries',group:'controls',icon:'◎'},
{labelFa:'گزارش‌ها',href:'/reports',group:'reports',icon:'▤'},
{labelFa:'رویدادهای حسابرسی',href:'/audit',group:'reports',icon:'◫'}
] as const;
