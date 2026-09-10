'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  HiMail, HiLogout, HiIdentification, HiMenuAlt3, HiX,
  HiChartPie, HiPlusCircle, HiDocumentText, HiClock, HiCog, HiSupport, HiArrowLeft
} from 'react-icons/hi';
import { supabase } from '@/lib/superbase';
import { useRouter } from 'next/navigation';

export default function TopNav({ userName = 'User', userRole = 'USER' }) {
  const [profileOpen, setProfileOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile]           = useState(null);
  const [loggingOut, setLoggingOut]     = useState(false);
  const [welcomeSeen, setWelcomeSeen]   = useState(true);

  const profileRef = useRef(null);
  const router     = useRouter();

  // Fetch profile details ya mtumiaji wa sasa
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

      // Welcome notification — inaonyesha mara ya kwanza tu kwa kila user
      const key = `welcomed_${user.id}`;
      if (!localStorage.getItem(key)) {
        setWelcomeSeen(false);
      }
    };
    fetchProfile();
  }, []);

  // Close dropdown ukibonyeza nje
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Logout halisi
  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/log_in');
  };

  const dismissWelcome = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) localStorage.setItem(`welcomed_${user.id}`, 'true');
    setWelcomeSeen(true);
  };

  const displayName  = profile?.full_name || profile?.username || userName;
  const displayEmail = profile?.email || '—';
  const displayId    = profile?.id || '—';

  const mobileLinks = [
    { href: '/user_dashbourd', label: 'Dashboard', icon: HiChartPie },
    { href: '/user_dashbourd/new_loan', label: 'Request New Loan', icon: HiPlusCircle },
    { href: '/user_dashbourd/active_loan', label: 'My Active Loans', icon: HiDocumentText },
    { href: '/user_dashbourd/history_loan', label: 'Past / History Loans', icon: HiClock },
    { href: '/user_dashbourd/setting', label: 'Settings', icon: HiCog },
    { href: '/user_dashbourd/help', label: 'Help & Support', icon: HiSupport },
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
      {/* Welcome notification — inaonyesha mara ya kwanza tu */}
      {!welcomeSeen && (
        <div className="w-full bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-emerald-400 font-medium">
              🎉 Welcome! Your account is active. You can now apply for a loan.
            </p>
          </div>
          <button
            onClick={dismissWelcome}
            className="text-emerald-400/60 hover:text-emerald-400 text-xs font-semibold ml-4 cursor-pointer shrink-0"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

    <header className="sticky top-0 z-50 w-full bg-[#121212]/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between text-white">

      {/* Logo */}
      <div>
        <h1 className="text-xl font-bold tracking-wide">
          Omar <span className="text-amber-400">microfinance</span>
        </h1>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">

        {/* Mobile menu trigger */}
        <button
          type="button"
          aria-label="Go back"
          onClick={() => router.back()}
          className="order-first rounded-xl border border-zinc-800 p-2 text-zinc-300 transition hover:border-amber-400 hover:text-amber-400 md:hidden cursor-pointer"
        >
          <HiArrowLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(open => !open)}
          className="order-first rounded-xl border border-zinc-800 p-2 text-zinc-300 transition hover:border-amber-400 hover:text-amber-400 md:hidden cursor-pointer"
        >
          {mobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenuAlt3 className="h-6 w-6" />}
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full hover:border-zinc-700 transition cursor-pointer"
          >
            <p className="text-sm font-semibold text-white leading-tight hidden sm:block">{displayName}</p>
            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-zinc-950 font-bold shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 text-xs text-zinc-300 space-y-4">

              {/* Header */}
              <div className="border-b border-zinc-800 pb-3">
                <p className="text-sm font-bold text-white">{displayName}</p>
                <p className="text-[11px] text-zinc-500">Account Profile</p>
              </div>

              {/* Details — data halisi */}
              <div className="space-y-2 text-zinc-400">
                <div className="flex items-center space-x-2.5 truncate">
                  <HiMail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <HiIdentification className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ID: {displayId}</span>
                </div>
                {profile?.username && (
                  <div className="flex items-center space-x-2.5">
                    <span className="text-amber-400 font-bold shrink-0">@</span>
                    <span>{profile.username}</span>
                  </div>
                )}
              </div>

              {/* Logout */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full bg-zinc-800/80 hover:bg-red-500/10 hover:text-red-400 text-zinc-300 font-medium py-2 px-3 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <HiLogout className="w-4 h-4" />
                  <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile navigation drawer */}
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={() => setMobileMenuOpen(false)}
      aria-hidden={!mobileMenuOpen}
    >
      <aside
        className={`absolute left-0 top-0 h-full w-[min(21rem,85vw)] border-r border-zinc-800 bg-[#121212] px-5 pb-6 pt-24 shadow-2xl transition-transform duration-300 ease-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(event) => event.stopPropagation()}
        aria-label="Mobile navigation"
      >
        <div className="mb-6 border-b border-zinc-800 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">User Menu</p>
          <p className="mt-2 text-sm text-zinc-400">Navigate your Omar Microfinance account</p>
        </div>
        <nav className="space-y-2">
          {mobileLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <Icon className="h-5 w-5 text-amber-400" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
    </>
  );
}
