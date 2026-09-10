"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Wallet, Users, Settings, History, LifeBuoy, LogOut } from 'lucide-react';
import { supabase } from '@/lib/superbase';

export default function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems = [
    { name: 'Dashboard',        icon: LayoutDashboard, href: '/admin_dashbourd' },
    { name: 'Loan Requests',    icon: FileText,         href: '/admin_dashbourd/loan_request' },
    { name: 'Active Loans',     icon: Wallet,           href: '/admin_dashbourd/active_loan' },
    { name: 'Users Management', icon: Users,            href: '/admin_dashbourd/users_management' },
    { name: 'System Logs',      icon: History,          href: '/admin_dashbourd/payment_logs' },
    { name: 'Settings',         icon: Settings,         href: '/admin_dashbourd/setting' },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/log_in');
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 bg-[#121614] border-r border-neutral-800/60 flex-col justify-between p-4 min-h-screen">
      <div>
        {/* Logo / Title */}
        <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-neutral-800/60">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
            L
          </div>
          <span className="font-bold tracking-wide text-white text-sm">Admin Console</span>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Icon size={18} className={active ? 'text-amber-400' : 'text-neutral-500'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Help & Logout */}
      <div className="space-y-3 pt-4 border-t border-neutral-800/60">
        <Link href="/admin_dashbourd/help" className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <LifeBuoy size={16} /> Help & Support
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}