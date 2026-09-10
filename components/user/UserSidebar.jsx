'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HiCash, HiChartPie, HiChevronDown, HiChevronUp,
  HiCog, HiClock, HiDocumentText, HiLogout,
  HiPlusCircle, HiSupport
} from 'react-icons/hi';
import { supabase } from '@/lib/superbase';

export default function UserSidebar({ activeTab = 'dashboard', setActiveTab }) {
  const [isLoansOpen, setIsLoansOpen] = useState(true);
  const [loggingOut, setLoggingOut]   = useState(false);
  const router = useRouter();

  const navigate   = (tab) => setActiveTab?.(tab);
  const linkClass  = (tab) => `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
    activeTab === tab
      ? 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
  }`;

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/log_in');
  };

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col justify-between border-r border-zinc-800 bg-[#121212] p-5 text-white md:flex">

      {/* NAV */}
      <div>
        <nav className="space-y-2" aria-label="Dashboard navigation">
          <Link href="/user_dashbourd" className={linkClass('dashboard')}>
            <HiChartPie className="h-5 w-5" /> Dashboard
          </Link>

          {/* Loans accordion */}
          <button
            type="button"
            onClick={() => setIsLoansOpen(o => !o)}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <span className="flex items-center gap-3"><HiCash className="h-5 w-5" /> Loans</span>
            {isLoansOpen ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>

          {isLoansOpen && (
            <div className="ml-4 space-y-1 border-l border-zinc-800 pl-3">
              <Link href="/user_dashbourd/new_loan" className={linkClass('request-loan')}>
                <HiPlusCircle className="h-4 w-4 text-amber-400" /> Request New Loan
              </Link>
              <Link href="/user_dashbourd/active_loan" className={linkClass('active_loan')}>
                <HiDocumentText className="h-4 w-4" /> My Active Loans
              </Link>
              <Link href="/user_dashbourd/history_loan" className={linkClass('history_loan')}>
                <HiClock className="h-4 w-4" /> Past / History Loans
              </Link>
            </div>
          )}

          <Link href="/user_dashbourd/setting" className={linkClass('settings')}>
            <HiCog className="h-5 w-5" /> Settings
          </Link>
        </nav>
      </div>

      {/* BOTTOM */}
      <div className="space-y-2 border-t border-zinc-800 pt-5">
        <Link href="/user_dashbourd/help" className={linkClass('support')}>
          <HiSupport className="h-5 w-5" /> Help &amp; Support
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition cursor-pointer disabled:opacity-50"
        >
          <HiLogout className="h-5 w-5" />
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>

        <p className="px-1 text-[10px] tracking-widest text-zinc-600">Omar Microfinance</p>
      </div>
    </aside>
  );
}
