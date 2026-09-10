'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Wallet, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/superbase';

export default function StatsCards() {
  const [stats, setStats] = useState({
    totalUsers: null,
    pendingRequests: null,
    activeLoans: null,
    totalDisbursed: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Endesha maswali yote manne kwa wakati mmoja
    const [usersRes, pendingRes, activeRes, disbursedRes, activeAccountsRes] = await Promise.all([
      // 1. Total registered users
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),

      // 2. Maombi yanayosubiri (pending loans)
      supabase
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // 3. Mikopo hai (active loans)
      supabase
        .from('loans')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),

      // 4. Jumla ya fedha zilizotolewa (active + completed)
      supabase
        .from('loans')
        .select('amount')
        .in('status', ['active', 'completed']),

      // 5. Active accounts — users waliowahi kuwasilisha mkopo angalau mmoja
      supabase
        .from('loans')
        .select('user_id')
        .not('user_id', 'is', null),
    ]);

    // Angalia makosa
    const firstErr =
      usersRes.error || pendingRes.error || activeRes.error || disbursedRes.error || activeAccountsRes.error;
    if (firstErr) {
      setError(firstErr.message);
      setLoading(false);
      return;
    }

    // Hesabu jumla ya fedha
    const totalDisbursed = (disbursedRes.data || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    // Hesabu distinct users wenye loans
    const distinctActiveUsers = new Set((activeAccountsRes.data || []).map(r => r.user_id)).size;

    setStats({
      totalUsers: distinctActiveUsers,
      pendingRequests: pendingRes.count ?? 0,
      activeLoans: activeRes.count ?? 0,
      totalDisbursed,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Format TZS bila decimal
  const fmtMoney = (n) =>
    `TZS ${Number(n).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

  const cards = [
    {
      title: 'Active Accounts',
      value: stats.totalUsers,
      display: stats.totalUsers,
      icon: Users,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      subtitle: 'Waliowahi kuomba mkopo',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      display: stats.pendingRequests,
      icon: Clock,
      color: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/20',
      subtitle: 'Maombi yanayosubiri ukaguzi',
    },
    {
      title: 'Active Loans',
      value: stats.activeLoans,
      display: stats.activeLoans,
      icon: Wallet,
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: 'Mikopo iliyoidhinishwa',
    },
    {
      title: 'Total Disbursed',
      value: stats.totalDisbursed,
      display: stats.totalDisbursed !== null ? fmtMoney(stats.totalDisbursed) : null,
      icon: TrendingUp,
      color: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      subtitle: 'Jumla ya fedha zilizotolewa',
    },
  ];

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center gap-3 text-rose-400">
        <AlertTriangle size={18} />
        <div>
          <p className="text-sm font-semibold">Imeshindikana kupakia takwimu</p>
          <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="ml-auto text-xs bg-rose-500/10 hover:bg-amber-400 hover:text-neutral-950 hover:border-amber-300 border border-rose-500/20 px-3 py-1.5 rounded-lg font-semibold transition-colors duration-200 cursor-pointer"
        >
          Jaribu tena
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((item, idx) => {
        const Icon = item.icon;
        const isLoading = loading || item.display === null;

        return (
          <div
            key={idx}
            className="bg-[#121614] border-2 border-neutral-800/80 rounded-2xl p-4 sm:p-5 shadow-xl hover:border-amber-400 hover:border-t-amber-300 hover:shadow-amber-400/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-default relative overflow-hidden"
          >
            {/* Refresh ikoni — top right */}
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-medium text-neutral-400">{item.title}</span>
              <div className={`p-1.5 sm:p-2 rounded-xl border ${item.iconBg}`}>
                <Icon size={14} className={`sm:w-4 sm:h-4 ${item.color}`} />
              </div>
            </div>

            {/* Thamani */}
            {isLoading ? (
              <div className="space-y-2 mt-1">
                <div className="h-7 w-24 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-zinc-800/60 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className={`text-xl sm:text-2xl font-extrabold mb-1 ${item.color}`}>
                  {item.display}
                </div>
                <div className="text-[11px] text-neutral-500">{item.subtitle}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
