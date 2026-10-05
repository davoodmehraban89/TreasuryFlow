'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {PRIMARY_NAV} from './navigation';
import type {ReactNode} from 'react';

export function AppShell({children,title='مرکز عملیات خزانه‌داری',actions}:{children:ReactNode;title?:string;actions?:ReactNode}){
 const pathname=usePathname();
 return <div className="app-shell">
  <aside className="sidebar" aria-label="ناوبری اصلی">
   <div className="brand-block"><div className="brand-mark">TF</div><div><strong>TreasuryFlow</strong><span>سامانه مدیریت خزانه‌داری</span></div></div>
   <nav className="main-nav">{PRIMARY_NAV.map(item=>{const active=pathname===item.href||(item.href!=='/dashboard'&&pathname.startsWith(item.href+'/'));return <Link key={item.href} href={item.href} className={active?'nav-link active':'nav-link'} aria-current={active?'page':undefined}><span className="nav-icon" aria-hidden>{item.icon}</span><span>{item.labelFa}</span></Link>})}</nav>
   <div className="sidebar-footer"><div className="env-chip"><span className="dot"/>محیط محلی امن</div><small>ارسال بانکی واقعی غیرفعال است</small></div>
  </aside>
  <div className="app-workspace">
   <header className="topbar"><div><p className="topbar-kicker">عملیات مالی سازمان</p><h1>{title}</h1></div><div className="topbar-actions">{actions}<div className="system-chip"><span className="dot"/>سامانه پایدار</div><div className="user-chip"><span className="avatar">م</span><div><strong>مدیر خزانه‌داری</strong><small>دسترسی محلی</small></div></div></div></header>
   <main className="content-canvas">{children}</main>
  </div>
 </div>
}
