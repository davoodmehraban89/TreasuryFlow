import './globals.css';
const nav=['داشبورد عملیات','پرداخت‌ها','تأییدها','بانک و تطبیق','هشدارها','گزارش‌ها','مرکز سلامت','رویدادهای حسابرسی'];
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body><div className="shell"><aside aria-label="ناوبری اصلی"><div className="brand">TreasuryFlow</div><nav>{nav.map(x=><a key={x} href={'#'+x}>{x}</a>)}</nav></aside><div className="workspace"><header><strong>مرکز عملیات خزانه‌داری</strong><span className="health">سامانه پایدار</span></header>{children}</div></div></body></html>}
