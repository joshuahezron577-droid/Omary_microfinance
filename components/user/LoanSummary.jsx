'use client';

import React from 'react';
import { HiCheckCircle, HiClock, HiX, HiCheck } from 'react-icons/hi';

const fmt = (n) => `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

const STATUS_MAP = {
  active:    { label: 'Active',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    icon: HiCheckCircle },
  pending:   { label: 'Pending',   color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: HiClock },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: HiCheck },
  rejected:  { label: 'Rejected',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',    icon: HiX },
};

// loans zinakuja tayari kutoka dashboard page — hazihitaji fetch tena
export default function LoanSummary({ loans = [] }) {
  // Onyesha mikopo 4 ya hivi karibuni tu
  const recent = loans.slice(0, 4);

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">My Loans Overview</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Mikopo yako yote — hai, inayosubiri, na iliyokamilika.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-full">
          {loans.length} Jumla
        </span>
      </div>

      {/* Empty state */}
      {loans.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-600">
          <HiClock className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Bado hujawahi kuomba mkopo.</p>
          <p className="text-xs mt-1 text-zinc-700">Bonyeza "Omba Mkopo" kuanza.</p>
        </div>
      )}

      {/* Loan cards */}
      {loans.length > 0 && (
        <div className="space-y-3">
          {recent.map((loan) => {
            const principal = Number(loan.amount || 0);
            const interest  = principal * (Number(loan.interest_rate || 0) / 100);
            const total     = principal + interest;
            const paid      = Number(loan.amount_paid || 0);
            const progress  = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

            const s = STATUS_MAP[loan.status] || STATUS_MAP.pending;
            const StatusIcon = s.icon;

            return (
              <div
                key={loan.id}
                className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-3"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                      {loan.id.slice(0, 8)}...
                    </span>
                    <h4 className="text-sm font-semibold text-white leading-tight">
                      {loan.purpose || 'Mkopo'}
                    </h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${s.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {s.label}
                  </span>
                </div>

                {/* Amount row */}
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    Kiasi: <strong className="text-white">{fmt(principal)}</strong>
                  </span>
                  <span>
                    {loan.status === 'active'
                      ? loan.due_date
                        ? <>Next payment: <strong className="text-amber-400">{new Date(loan.due_date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></>
                        : <span className="text-blue-400">Active loan</span>
                      : loan.status === 'pending'
                      ? <span className="text-amber-400/70">Pending — awaiting admin approval</span>
                      : loan.status === 'completed'
                      ? <span className="text-emerald-400">Completed ✓</span>
                      : <span className="text-rose-400">Rejected by admin</span>
                    }
                  </span>
                </div>

                {/* Progress bar — onyesha tu kwa active/completed */}
                {(loan.status === 'active' || loan.status === 'completed') && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Urejeshaji</span>
                      <span className="text-white font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          progress >= 100
                            ? 'bg-emerald-500'
                            : progress > 50
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-r from-amber-600 to-amber-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Kama ziko zaidi ya 4 */}
          {loans.length > 4 && (
            <p className="text-xs text-center text-zinc-600 pt-1">
              + mikopo {loans.length - 4} zaidi — angalia ukurasa wa "Active Loans"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
