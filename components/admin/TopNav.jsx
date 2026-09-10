'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Hash, LogOut, AtSign, Mail, X, Menu, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/superbase';
import { useRouter } from 'next/navigation';

export default function TopNav() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile]                 = useState(null);
  const [loggingOut, setLoggingOut]           = useState(false);
  const [welcomeSeen, setWelcomeSeen]         = useState(true);

  const menuRef = useRef(null);
  const router  = useRouter();

  // Fetch admin profile + welcome check
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, email')
        .eq('id', user.id)
        .single();

      setProfile({ ...data, id: user.id.slice(0, 8).toUpperCase() });

      const key = `admin_welcomed_${user.id}`;
      if (!localStorage.getItem(key)) setWelcomeSeen(false);
    };
    fetchProfile();
  }, []);

  // Close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/log_in');
  };

  const dismissWelcome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) localStorage.setItem(`admin_welcomed_${user.id}`, 'true');
    setWelcomeSeen(true);
  };

  const displayName = profile?.full_name || profile?.username || 'Admin';
  const initials    = displayName.charAt(0).toUpperCase();

  const mobileLinks = [
    { href: '/admin_dashbourd', label: 'Dashboard' },
    { href: '/admin_dashbourd/loan_request', label: 'Loan Requests' },
    { href: '/admin_dashbourd/active_loan', label: 'Active Loans' },
    { href: '/admin_dashbourd/users_management', label: 'Users Management' },
    { href: '/admin_dashbourd/payment_logs', label: 'System Logs' },
    { href: '/admin_dashbourd/setting', label: 'Settings' },
    { href: '/admin_dashbourd/help', label: 'Help & Support' },
  ];

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Welcome banner */}
      {!welcomeSeen && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-amber-400 font-medium">
              Welcome! Your account is active. You may start to manage your disbursements and loans.
            </p>
          </div>
          <button onClick={dismissWelcome} className="text-amber-400/60 hover:text-amber-400 ml-4 cursor-pointer shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full min-w-0 bg-[#121614]/95 backdrop-blur-md border-b border-neutral-800/60 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-white relative">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-xl font-bold tracking-wide whitespace-nowrap">
            Omar <span className="text-amber-400">microfinance</span>
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => router.back()}
            className="order-first rounded-lg border border-neutral-800 p-1.5 sm:rounded-xl sm:p-2 text-neutral-300 transition hover:border-amber-400 hover:text-amber-400 md:hidden cursor-pointer"
          >
            <ArrowLeft size={16} className="sm:h-5 sm:w-5" />
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(open => !open)}
            className="order-first rounded-lg border border-neutral-800 p-1.5 sm:rounded-xl sm:p-2 text-neutral-300 transition hover:border-amber-400 hover:text-amber-400 md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X size={16} className="sm:h-5 sm:w-5" /> : <Menu size={16} className="sm:h-5 sm:w-5" />}
          </button>

          <div className="relative sm:ml-2" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 p-1 sm:py-1.5 sm:px-3 rounded-full transition-all cursor-pointer"
            >
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-medium text-neutral-300">{displayName}</span>
                <span className="block text-[9px] uppercase tracking-wider text-amber-400">Admin</span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-800 border border-amber-500/60 text-amber-400 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-72 bg-[#121614] border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50">
                <div className="pb-3 border-b border-neutral-800/80">
                  <p className="text-sm font-bold text-white">{displayName}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">Admin Account</p>
                </div>

                <div className="py-3 space-y-3 text-xs">
                  <div className="flex items-center gap-3 text-neutral-300">
                    <Mail size={14} className="text-amber-400 shrink-0" />
                    <span className="truncate">{profile?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-300">
                    <Hash size={14} className="text-amber-400 shrink-0" />
                    <span>ID: {profile?.id || '—'}</span>
                  </div>
                  {profile?.username && (
                    <div className="flex items-center gap-3 text-neutral-300">
                      <AtSign size={14} className="text-amber-400 shrink-0" />
                      <span>{profile.username}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-800/80 pt-3">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-all text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      >
        <aside
          className={`absolute left-0 top-0 h-full w-[min(21rem,85vw)] border-r border-neutral-800 bg-[#121614] px-5 pb-6 pt-24 shadow-2xl transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
          aria-label="Mobile navigation"
        >
          <div className="mb-6 border-b border-neutral-800 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Admin Menu</p>
            <p className="mt-2 text-sm text-neutral-400">Navigate the Omar Microfinance console</p>
          </div>
          <nav className="space-y-2">
            {mobileLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-neutral-300 transition hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
