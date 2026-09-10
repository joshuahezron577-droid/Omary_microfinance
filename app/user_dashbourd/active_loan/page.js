'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HiCash, HiClock, HiCheckCircle, HiExclamationCircle, HiRefresh } from 'react-icons/hi';
import { supabase } from '@/lib/superbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

// Tengeneza ratiba ya malipo (repayment schedule) kutoka loan data
function buildSchedule(loan) {
  const principal   = Number(loan.amount || 0);
  const rate        = Number(loan.interest_rate || 0);
  const interest    = principal * (rate / 100);
  const total       = principal + interest;
  const durationStr = loan.duration || '1 Month';
  const months      = parseInt(durationStr) || 1;
  const installment = Math.round(total / months);
  const paid        = Number(loan.amount_paid || 0);

  const startDate = loan.created_at ? new Date(loan.created_at) : new Date();
  const rows = [];

  let cumulativeRequired = 0;

  for (let i = 0; i < months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);

    cumulativeRequired += installment;

    // Awamu ni "Imelipwa" kama fedha zilizolipwa zinafika kiwango cha awamu hii
    const isPaid    = paid >= cumulativeRequired;
    // Awamu ya sasa ni ile ya kwanza ambayo haijafikiwa bado
    const isCurrent = !isPaid && (paid >= cumulativeRequired - installment);

    rows.push({
      no:          i + 1,
      dueDate:     dueDate.toISOString(),
      amount:      installment,
      status:      isPaid ? 'Paid' : isCurrent ? 'Due Next' : 'Upcoming',
      statusColor: isPaid
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        : isCurrent
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-zinc-800 text-zinc-500 border-zinc-700',
      paidDate:    isPaid ? '✓' : '—',
    });
  }

  // Hesabu sahihi ya awamu zilizolipwa
  const installmentsPaid = installment > 0 ? Math.floor(paid / installment) : 0;

  return { rows, installment, total, installmentsPaid };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ActiveLoanPage() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Pata mtumiaji wa sasa
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/log_in';
      return;
    }

    // 2. Pata mikopo yake yenye status = 'active' au 'completed'
    const { data, error: err } = await supabase
      .from('loans')
      .select(`
        id, amount, interest_rate, duration, purpose,
        payment_provider, account_number,
        amount_paid, due_date, created_at, status
      `)
      .eq('user_id', user.id)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setLoans(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // ── Hesabu za jumla ───────────────────────────────────────────────────────
  const totalOutstanding = loans.reduce((sum, l) => {
    const principal = Number(l.amount || 0);
    const interest  = principal * (Number(l.interest_rate || 0) / 100);
    const total     = principal + interest;
    const paid      = Number(l.amount_paid || 0);
    return sum + Math.max(0, total - paid);
  }, 0);

  // Mkopo wa kwanza (wa hivi karibuni) kwa summary ya juu
  const primaryLoan   = loans[0] || null;
  const primaryData   = primaryLoan ? buildSchedule(primaryLoan) : null;
  const primaryPaid   = primaryLoan ? Number(primaryLoan.amount_paid || 0) : 0;
  const primaryTotal  = primaryData?.total || 1;
  const progress      = Math.min(100, Math.round((primaryPaid / primaryTotal) * 100));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-5xl mx-auto text-white space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HiCash className="w-5 h-5 text-amber-400" /> Mkopo Wangu Unaoendelea
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Taarifa za mkopo wako na ratiba ya malipo</p>
        </div>
        <button
          onClick={fetchLoans}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-40 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />
            <div className="h-40 bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-32 bg-zinc-900/30 border border-zinc-800 rounded-2xl animate-pulse" />
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
          <HiExclamationCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Imeshindikana kupakia data</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button onClick={fetchLoans} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer">
            Jaribu tena
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && loans.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <HiCheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Huna mkopo unaoendelea kwa sasa.</p>
          <p className="text-xs mt-1 text-zinc-700">Omba mkopo mpya na usubiri idhini ya admin.</p>
        </div>
      )}

      {/* MAIN CONTENT */}
      {!loading && !error && loans.length > 0 && (
        <>
          {/* ── 1. TOP SUMMARY ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left: Outstanding balance */}
            <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Salio Linalobaki (Jumla)</p>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  {fmt(totalOutstanding)}
                </h2>
              </div>

              {primaryLoan && (
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800/80">
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase">Malipo Yanayofuata</p>
                    <p className="text-sm font-bold text-zinc-200 mt-0.5">
                      {fmtDate(primaryLoan.due_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase">Kiwango cha Awamu</p>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">
                      {fmt(primaryData?.installment)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: circular progress */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
              {/* SVG circular progress */}
              <div className="relative w-20 h-20 mb-3">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#27272a" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="#10b981" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-emerald-400">
                  {progress}%
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Repayment Progress</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {fmt(primaryPaid)} / {fmt(primaryTotal)}
              </p>
            </div>
          </div>

          {/* ── 2. LOAN CARDS ──────────────────────────────────────────── */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              My Active Loan Details
            </h3>

            {loans.map((loan) => {
              const principal  = Number(loan.amount || 0);
              const rate       = Number(loan.interest_rate || 0);
              const interest   = principal * (rate / 100);
              const total      = principal + interest;
              const paid       = Number(loan.amount_paid || 0);
              const remaining  = Math.max(0, total - paid);
              const isComplete = loan.status === 'completed';
              const progress   = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
              const { installment } = buildSchedule(loan);

              return (
                <div key={loan.id} className={`border p-6 rounded-2xl space-y-4 ${
                  isComplete
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-zinc-900/30 border-zinc-800'
                }`}>

                  {/* Top row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-zinc-500">{loan.id.slice(0, 8)}...</span>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                        isComplete
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {isComplete ? 'Completed' : 'Active'}
                      </span>
                      {loan.purpose && (
                        <span className="text-xs text-zinc-400">{loan.purpose}</span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-white">{fmt(principal)}</div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Interest Rate</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{rate}% APR</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Date Applied</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{fmtDate(loan.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Duration</p>
                      <p className="font-semibold text-zinc-200 mt-0.5">{loan.duration || '—'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Installment</p>
                      <p className="font-semibold text-amber-400 mt-0.5">{fmt(installment)}</p>
                    </div>
                  </div>

                  {/* Balance row */}
                  <div className="grid grid-cols-3 gap-3 bg-zinc-900/60 border border-zinc-800/60 p-4 rounded-xl text-xs">
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Total (+Interest)</p>
                      <p className="font-bold text-white">{fmt(total)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Paid</p>
                      <p className="font-bold text-emerald-400">{fmt(paid)}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[10px] uppercase">Remaining</p>
                      <p className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isComplete ? 'TZS 0' : fmt(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                      <span>Repayment Progress</span>
                      <span className="text-white font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isComplete
                            ? 'bg-emerald-500'
                            : progress > 60
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            : progress > 30
                            ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                            : 'bg-gradient-to-r from-rose-600 to-rose-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Account info */}
                  {(loan.payment_provider || loan.account_number) && (
                    <div className="text-xs text-zinc-500 bg-zinc-900/40 border border-zinc-800/50 px-4 py-2 rounded-xl">
                      Payment Account:{' '}
                      <span className="text-emerald-400 font-semibold">{loan.payment_provider}</span>
                      {loan.account_number && (
                        <span className="font-mono text-zinc-300 ml-1">— {loan.account_number}</span>
                      )}
                    </div>
                  )}

                  {/* Completed badge */}
                  {isComplete && (
                    <div className="text-center py-1">
                      <span className="text-xs text-emerald-400 font-semibold">
                        ✓ Loan Fully Settled — Read Only
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── 3. REPAYMENT SCHEDULE — ya mkopo wa kwanza ─────────────── */}
          {primaryLoan && primaryData && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                  Repayment Schedule &amp; History
                </h3>
                <span className="text-[11px] text-zinc-500">Read-Only View</span>
              </div>

              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                      <tr>
                        <th className="px-5 py-3 font-semibold">#</th>
                        <th className="px-5 py-3 font-semibold">Tarehe ya Malipo</th>
                        <th className="px-5 py-3 font-semibold">Kiasi cha Awamu</th>
                        <th className="px-5 py-3 font-semibold">Hali</th>
                        <th className="px-5 py-3 font-semibold">Payment Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {primaryData.rows.map((row) => (
                        <tr key={row.no} className="hover:bg-zinc-900/50 transition">
                          <td className="px-5 py-3 font-medium text-zinc-400">{row.no}</td>
                          <td className="px-5 py-3 font-semibold text-zinc-200">{fmtDate(row.dueDate)}</td>
                          <td className="px-5 py-3 font-semibold text-amber-400">{fmt(row.amount)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${row.statusColor}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-zinc-500">{row.paidDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress summary */}
              <div className="flex items-center gap-4 text-xs text-zinc-500 px-1">
                <span>
                  Awamu zilizolipwa:{' '}
                  <strong className="text-emerald-400">
                    {primaryData.installmentsPaid}
                  </strong>
                  /{primaryData.rows.length} installments paid
                </span>
                <span>·</span>
                <span>
                  Kilicholipwa jumla:{' '}
                  <strong className="text-emerald-400">{fmt(primaryPaid)}</strong>
                </span>
                <span>·</span>
                <span>
                  Kilichobaki:{' '}
                  <strong className="text-rose-400">{fmt(Math.max(0, primaryTotal - primaryPaid))}</strong>
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
