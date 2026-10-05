import './globals.css';
import {AppShell} from './ui/AppShell';
export const metadata={title:'TreasuryFlow',description:'سامانه مدیریت خزانه‌داری و حواله‌های بانکی'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body><AppShell>{children}</AppShell></body></html>}
