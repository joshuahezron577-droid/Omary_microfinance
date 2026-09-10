'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HiArchiveBox, HiBanknotes, HiCheckBadge, HiCalendar, HiShieldCheck } from 'react-icons/hi2';
import { RefreshCw, AlertTriangle } from 'lucide-react';
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

const STATUS_CONFIG = {
  completed: { label: 'Completed',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', remark: 'Fully Repaid' },
  rejected:  { label: 'Rejected',   color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',          remark: 'Application Rejected by Admin' },
  active:    { label: 'Active',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          remark: 'Currently Active' },
  pending:   { label: 'Pending',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       remark: 'Awaiting Admin Approval' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoanHistoryPage() {
  const [loans, setLoans]         = useState([]);
  const [guarantors, setGuarantors] = useState({}); // { loan_id: guarantor_row }
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/log_in'; return; }

    // Fetch loans
    const { data: loansData, error: loansErr } = await supabase
      .from('loans')
      .select(`
        id, amount, interest_rate, duration, purpose,
        status, amount_paid, due_date, created_at,
        approved_at, disbursed_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (loansErr) { setError(loansErr.message); setLoading(false); return; }

    setLoans(loansData || []);

    // Fetch guarantors kwa loans hizo zote
    if (loansData && loansData.length > 0) {
      const loanIds = loansData.map(l => l.id);

      const { data: guarantorData } = await supabase
        .from('guarantors')
        .select('loan_id, full_name, relationship, phone_no, occupation')
        .in('loan_id', loanIds);

      // Map kwa loan_id ili iwe rahisi kutafuta
      const gMap = {};
      (guarantorData || []).forEach(g => { gMap[g.loan_id] = g; });
      setGuarantors(gMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-5xl mx-auto text-white space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center text-amber-400">
            <HiArchiveBox className="w-6 h-6 mr-2" /> Loan History &amp; Archive
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Complete audit trail of all your loan applications and their statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && (
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-xs text-zinc-300">
              Total: <span className="font-bold text-white">{loans.length} Loans</span>
            </div>
          )}
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl animate-pulse space-y-4">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className="h-5 w-24 bg-zinc-800 rounded" />
                  <div className="h-5 w-20 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-6 w-28 bg-zinc-800 rounded" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(j => <div key={j} className="h-10 bg-zinc-800 rounded-xl" />)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(j => <div key={j} className="h-8 bg-zinc-800 rounded" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Failed to load loan history</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button onClick={fetchHistory} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">
            Try again
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && loans.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <HiArchiveBox className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No loan history yet.</p>
          <p className="text-xs mt-1 text-zinc-700">Your loan applications will appear here.</p>
        </div>
      )}

      {/* RECORDS */}
      {!loading && !error && loans.length > 0 && (
        <div className="space-y-4">
          {loans.map((loan) => {
            const principal  = Number(loan.amount || 0);
            const rate       = Number(loan.interest_rate || 0);
            const interest   = principal * (rate / 100);
            const totalOwed  = principal + interest;
            const paid       = Number(loan.amount_paid || 0);
            const cfg        = STATUS_CONFIG[loan.status] || STATUS_CONFIG.pending;
            const guarantor  = guarantors[loan.id];

            // Guarantor — jina tu
            const guarantorName = guarantor?.full_name || '—';

            // Occupation kutoka guarantors table
            const occupation = guarantor?.occupation || '—';

            return (
              <div
                key={loan.id}
                className="bg-zinc-900/40 border border-zinc-800 p-5 md:p-6 rounded-2xl space-y-5 hover:border-zinc-700 transition"
              >
                {/* TOP: ID + status + purpose + amount */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {loan.purpose && (
                      <span className="text-sm font-bold text-white">{loan.purpose}</span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-600">{loan.id.slice(0, 8)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase">Principal Disbursed</p>
                    <p className="text-base font-extrabold text-white">{fmt(principal)}</p>
                  </div>
                </div>

                {/* TIMELINE: 4 columns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase flex items-center mb-1">
                      <HiCalendar className="w-3 h-3 mr-1 text-zinc-400" /> Date Applied
                    </p>
                    <p className="font-semibold text-zinc-300">{fmtDate(loan.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase flex items-center mb-1">
                      <HiCheckBadge className="w-3 h-3 mr-1 text-emerald-400" /> Date Approved
                    </p>
                    <p className="font-semibold text-zinc-300">{fmtDate(loan.approved_at)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase flex items-center mb-1">
                      <HiBanknotes className="w-3 h-3 mr-1 text-amber-400" /> Disbursed Date
                    </p>
                    <p className="font-semibold text-zinc-300">{fmtDate(loan.disbursed_at)}</p>
                  </div>
                  {loan.due_date && (
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase flex items-center mb-1">
                        <HiShieldCheck className="w-3 h-3 mr-1 text-blue-400" /> Due Date
                      </p>
                      <p className="font-semibold text-zinc-300">{fmtDate(loan.due_date)}</p>
                    </div>
                  )}
                </div>

                {/* BOTTOM: Totals + Guarantor + Occupation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase block">
                      Total Paid (Incl. {rate}%):
                    </span>
                    <span className="font-semibold text-emerald-400">{fmt(paid)}</span>
                    {['active', 'pending'].includes(loan.status) && (
                      <span className="text-zinc-600 ml-1 text-[10px]">/ {fmt(totalOwed)}</span>
                    )}
                  </div>
                  {guarantorName !== '—' && (
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Assigned Guarantor:</span>
                      <span className="font-medium text-zinc-300">{guarantorName}</span>
                    </div>
                  )}
                  {occupation !== '—' && (
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase block">Guarantor Occupation:</span>
                      <span className="font-medium text-zinc-300">{occupation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
