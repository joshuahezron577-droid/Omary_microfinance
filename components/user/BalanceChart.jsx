'use client';

import React, { useMemo } from 'react';
import { HiArrowUp, HiArrowDown, HiClock } from 'react-icons/hi';

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

// Tengeneza "transactions" kutoka loans data
// Kwa sababu hatuna payment_logs table bado, tunaunda historia kutoka loans
function buildTransactions(loans) {
  const txs = [];

  loans.forEach((loan) => {
    const principal = Number(loan.amount || 0);

    // 1. Ombi liliwasilishwa
    txs.push({
      id: `REQ-${loan.id.slice(0, 6)}`,
      type: 'Ombi la Mkopo',
      amount: principal,
      date: loan.created_at,
      status: 'Submitted',
      direction: 'neutral',
      statusColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    });

    // 2. Mkopo ulitolewa (active/completed)
    if (loan.status === 'active' || loan.status === 'completed') {
      txs.push({
        id: `DIS-${loan.id.slice(0, 6)}`,
        type: 'Mkopo Uliotolewa',
        amount: principal,
        date: loan.created_at,
        status: 'Disbursed',
        direction: 'in',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      });
    }

    // 3. Malipo yaliyofanywa (kama amount_paid > 0)
    const paid = Number(loan.amount_paid || 0);
    if (paid > 0) {
      txs.push({
        id: `PAY-${loan.id.slice(0, 6)}`,
        type: 'Malipo ya Mkopo',
        amount: paid,
        date: loan.due_date || loan.created_at,
        status: 'Recorded',
        direction: 'out',
        statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      });
    }

    // 4. Mkopo ulikamilika
    if (loan.status === 'completed') {
      txs.push({
        id: `CMP-${loan.id.slice(0, 6)}`,
        type: 'Mkopo Umekamilika',
        amount: Number(loan.amount || 0),
        date: loan.due_date || loan.created_at,
        status: 'Completed',
        direction: 'neutral',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      });
    }
  });

  // Panga kwa tarehe — hivi karibuni kwanza
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));

  return txs.slice(0, 6); // Onyesha 6 tu za hivi karibuni
}

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// loans zinakuja tayari kutoka dashboard page — hazihitaji fetch tena
export default function RecentTransactions({ loans = [] }) {
  const transactions = useMemo(() => buildTransactions(loans), [loans]);

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 rounded-2xl shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">Recent Transactions</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Shughuli zako za hivi karibuni za mikopo
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-emerald-400 rounded-lg">
          Live Feed
        </span>
      </div>

      {/* Empty state */}
      {transactions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-600">
          <HiClock className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">Hakuna shughuli bado.</p>
          <p className="text-xs mt-1 text-zinc-700">Shughuli zitaonekana hapa ukiomba mkopo.</p>
        </div>
      )}

      {/* Transaction list */}
      {transactions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl hover:bg-zinc-900/80 transition-colors"
            >
              {/* Left: icon + info */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${
                  tx.direction === 'in'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : tx.direction === 'out'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tx.direction === 'in'
                    ? <HiArrowDown className="w-4 h-4" />
                    : tx.direction === 'out'
                    ? <HiArrowUp className="w-4 h-4" />
                    : <HiClock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{tx.type}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-zinc-500">{tx.id}</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">{formatDate(tx.date)}</span>
                  </div>
                </div>
              </div>

              {/* Right: amount + badge */}
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${
                  tx.direction === 'in'
                    ? 'text-emerald-400'
                    : tx.direction === 'out'
                    ? 'text-blue-400'
                    : 'text-zinc-300'
                }`}>
                  {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : ''}{fmt(tx.amount)}
                </p>
                <span className={`inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 border rounded-full ${tx.statusColor}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
