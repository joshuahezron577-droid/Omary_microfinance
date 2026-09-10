'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History, ArrowDownLeft, ArrowUpRight, ShieldCheck,
  CheckCircle, XCircle, RefreshCw, AlertTriangle, Clock
} from 'lucide-react';
import { supabase } from '@/lib/superbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Tengeneza log entries kutoka loans data
function buildLogs(loans) {
  const logs = [];

  loans.forEach((loan) => {
    const profile = loan.profiles || {};
    const client  = profile.full_name || profile.username || 'Unknown User';
    const amount  = Number(loan.amount || 0);
    const paid    = Number(loan.amount_paid || 0);

    // 1. Ombi liliwasilishwa — kwa kila mkopo
    logs.push({
      id:          `REQ-${loan.id.slice(0, 8)}`,
      type:        'REQUEST',
      client,
      amount,
      description: `Loan application submitted — ${loan.purpose || 'No purpose stated'}`,
      timestamp:   loan.created_at,
      loanId:      loan.id,
    });

    // 2. Mkopo ukiidhinishwa (active au completed au rejected)
    if (['active', 'completed', 'rejected'].includes(loan.status)) {
      logs.push({
        id:          `APR-${loan.id.slice(0, 8)}`,
        type:        loan.status === 'rejected' ? 'REJECTED' : 'APPROVED',
        client,
        amount,
        description: loan.status === 'rejected'
          ? 'Loan application rejected by admin'
          : `Loan approved — disbursed to ${loan.payment_provider || '—'} ${loan.account_number || ''}`.trim(),
        timestamp:   loan.created_at, // approximation — hakuna approved_at column
        loanId:      loan.id,
      });
    }

    // 3. Malipo yaliyofanywa (kama amount_paid > 0)
    if (paid > 0) {
      logs.push({
        id:          `PAY-${loan.id.slice(0, 8)}`,
        type:        'REPAYMENT',
        client,
        amount:      paid,
        description: `Repayment received — ${fmt(paid)} out of ${fmt(amount)} total`,
        timestamp:   loan.due_date || loan.created_at,
        loanId:      loan.id,
      });
    }

    // 4. Mkopo ulikamilika
    if (loan.status === 'completed') {
      logs.push({
        id:          `CMP-${loan.id.slice(0, 8)}`,
        type:        'COMPLETED',
        client,
        amount,
        description: `Loan fully settled — all repayments received`,
        timestamp:   loan.due_date || loan.created_at,
        loanId:      loan.id,
      });
    }
  });

  // Panga kwa tarehe — hivi karibuni kwanza
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return logs;
}

// Log type config
const LOG_CONFIG = {
  REQUEST:   { label: 'REQUEST',    icon: Clock,         color: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' },
  APPROVED:  { label: 'APPROVED',   icon: CheckCircle,   color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  REJECTED:  { label: 'REJECTED',   icon: XCircle,       color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
  REPAYMENT: { label: 'REPAYMENT',  icon: ArrowDownLeft, color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  COMPLETED: { label: 'COMPLETED',  icon: ShieldCheck,   color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  DISBURSEMENT: { label: 'DISBURSEMENT', icon: ArrowUpRight, color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
};

const FILTERS = ['ALL', 'REQUEST', 'APPROVED', 'REPAYMENT', 'COMPLETED', 'REJECTED'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SystemLogsPage() {
  const [loans, setLoans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('ALL');
  const [search, setSearch]   = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('loans')
      .select(`
        id, amount, interest_rate, duration, purpose,
        payment_provider, account_number,
        amount_paid, due_date, created_at, status,
        profiles ( full_name, username, email )
      `)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setLoans(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const allLogs = buildLogs(loans);

  // Filter + search
  const filtered = allLogs.filter((log) => {
    const matchType   = filter === 'ALL' || log.type === filter;
    const matchSearch = search === '' ||
      log.client.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Count per type kwa filter badges
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? allLogs.length : allLogs.filter(l => l.type === f).length;
    return acc;
  }, {});

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#0c0f0e] min-h-screen text-white p-6 md:p-8">

      {/* HEADER */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <History className="text-emerald-400" size={20} />
            Transaction &amp; System Logs
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Read-only audit trail — all loan events from request to completion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
            <ShieldCheck size={13} className="text-emerald-400" /> Secure Read-Only Mode
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* FILTER TABS + SEARCH */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                filter === f
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {f}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                filter === f ? 'bg-zinc-600 text-zinc-200' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {counts[f] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Tafuta jina la mteja au ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-neutral-800/60 animate-pulse">
              <div className="w-24 h-5 bg-zinc-800 rounded-lg" />
              <div className="w-20 h-5 bg-zinc-800 rounded-full" />
              <div className="w-28 h-4 bg-zinc-800 rounded" />
              <div className="flex-1 h-4 bg-zinc-800 rounded" />
              <div className="w-20 h-4 bg-zinc-800 rounded" />
              <div className="w-32 h-4 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Imeshindikana kupakia logs</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button onClick={fetchLogs} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">
            Jaribu tena
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-10 text-center text-zinc-600">
          <History className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Hakuna logs zinazolingana na utafutaji wako.</p>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Log ID</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.map((log) => {
                  const cfg  = LOG_CONFIG[log.type] || LOG_CONFIG.REQUEST;
                  const Icon = cfg.icon;
                  return (
                    <tr key={`${log.id}-${log.type}`} className="hover:bg-neutral-900/30 transition-all">

                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-neutral-500 text-[11px]">
                        {log.id}
                      </td>

                      {/* Type badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {log.client}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-bold text-neutral-200 font-mono">
                        {fmt(log.amount)}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-neutral-400 max-w-xs truncate">
                        {log.description}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-right text-neutral-500 font-mono text-[10px] whitespace-nowrap">
                        {fmtDate(log.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: total count */}
          <div className="px-4 py-3 border-t border-neutral-800/60 bg-neutral-900/30 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Kuonyesha rekodi <strong className="text-neutral-300">{filtered.length}</strong> kati ya <strong className="text-neutral-300">{allLogs.length}</strong></span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-500" /> Read-Only Audit Trail
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
