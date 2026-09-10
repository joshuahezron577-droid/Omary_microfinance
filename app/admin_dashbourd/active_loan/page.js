'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, CheckCircle2, AlertCircle, CreditCard, CheckCheck,
  Calendar, RefreshCw, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/superbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) => `TZS ${Number(n || 0).toLocaleString('en-TZ')}`;

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const calcProgress = (paid, total) =>
  total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

const repaymentStatus = (progress, dueDate) => {
  if (progress >= 100) return 'Fully Paid';
  if (dueDate && new Date(dueDate) < new Date()) return 'Delayed';
  return 'On Track';
};

// ─── Parse guarantor info from description field (old loans fallback) ────────
const parseGuarantorFromDescription = (description) => {
  if (!description) return null;
  // Format: "Occupation: X | Workplace: Y | Guarantor: Name (Phone)"
  const guarantorMatch = description.match(/Guarantor:\s*([^(]+)\(([^)]+)\)/i);
  const occupationMatch = description.match(/Occupation:\s*([^|]+)/i);
  const workplaceMatch = description.match(/Workplace:\s*([^|]+)/i);

  if (!guarantorMatch) return null;

  return {
    full_name: guarantorMatch[1].trim(),
    phone_no: guarantorMatch[2].trim(),
    occupation: occupationMatch ? occupationMatch[1].trim() : null,
    workplace: workplaceMatch ? workplaceMatch[1].trim() : null,
    _fromDescription: true, // flag kuonyesha chanzo
  };
};


export default function ActiveLoansPage() {
  const [loans, setLoans] = useState([]);
  const [guarantors, setGuarantors] = useState({}); // { [loan_id]: guarantor }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [paymentInputs, setPaymentInputs] = useState({});

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch active + completed loans + profile join ─────────────────────────
  const fetchActiveLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('loans')
      .select(`
        id,
        amount,
        interest_rate,
        duration,
        purpose,
        payment_provider,
        account_number,
        amount_paid,
        due_date,
        created_at,
        status,
        description,
        profiles (
          full_name,
          username,
          email
        )
      `)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const loansData = data || [];
    setLoans(loansData);

    // Fetch guarantors kwa loans hizi
    if (loansData.length > 0) {
      const loanIds = loansData.map(l => l.id);
      const { data: gData } = await supabase
        .from('guarantors')
        .select('loan_id, full_name, relationship, phone_no, email, occupation, workplace, physical_address, national_id')
        .in('loan_id', loanIds);

      const gMap = {};
      (gData || []).forEach(g => { gMap[g.loan_id] = g; });
      setGuarantors(gMap);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActiveLoans();
  }, [fetchActiveLoans]);

  // ── Confirm a manual payment installment ──────────────────────────────────
  const handleConfirmPayment = async (loan) => {
    const inputAmount = Number(paymentInputs[loan.id] || 0);
    if (!inputAmount || inputAmount <= 0) {
      showToast('error', 'Tafadhali weka kiasi halisi cha malipo.');
      return;
    }

    setActionLoading(loan.id);

    const principal = Number(loan.amount);
    const interest = principal * (Number(loan.interest_rate) / 100);
    const total = principal + interest;

    const currentPaid = Number(loan.amount_paid || 0);
    const newPaid = Math.min(total, currentPaid + inputAmount);
    const isComplete = newPaid >= total;

    // Next due date — ongeza mwezi mmoja
    const nextDue = loan.due_date
      ? new Date(new Date(loan.due_date).setMonth(new Date(loan.due_date).getMonth() + 1))
          .toISOString().split('T')[0]
      : null;

    const updates = {
      amount_paid: newPaid,
      ...(nextDue && !isComplete ? { due_date: nextDue } : {}),
      ...(isComplete ? { status: 'completed' } : {}),
    };

    const { error: updateErr } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loan.id);

    if (updateErr) {
      showToast('error', `Imeshindikana: ${updateErr.message}`);
    } else {
      showToast('success', `Malipo ya ${fmt(inputAmount)} yamethibitishwa na kurekodi!`);
      // Futa input baada ya mafanikio
      setPaymentInputs(prev => { const n = { ...prev }; delete n[loan.id]; return n; });
      await fetchActiveLoans();
    }

    setActionLoading(null);
  };

  // ── Mark loan as completed manually ───────────────────────────────────────
  const handleMarkComplete = async (loanId) => {
    setActionLoading(loanId);

    const { error: updateErr } = await supabase
      .from('loans')
      .update({ status: 'completed', amount_paid: loans.find(l => l.id === loanId)?.amount })
      .eq('id', loanId);

    if (updateErr) {
      showToast('error', `Imeshindikana: ${updateErr.message}`);
    } else {
      showToast('success', 'Mkopo umekamilika na kuondolewa kutoka kwenye orodha.');
      setLoans(prev => prev.filter(l => l.id !== loanId));
    }

    setActionLoading(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#0c0f0e] min-h-screen text-white p-6 md:p-8">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={16} />
            : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-white">
            Active Loans &amp; Repayments
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Fuatilia mikopo iliyoidhinishwa, maendeleo ya urejeshaji, na uthibitisho wa malipo.
          </p>
        </div>
        <button
          onClick={fetchActiveLoans}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-4 max-w-4xl">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#161b18] border border-neutral-800/80 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-zinc-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-zinc-800 rounded w-36" />
                  <div className="h-2 bg-zinc-800 rounded w-52" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => <div key={j} className="h-10 bg-zinc-800 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="max-w-4xl bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Imeshindikana kupakia data</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button
            onClick={fetchActiveLoans}
            className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Jaribu tena
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && loans.length === 0 && (
        <div className="max-w-4xl text-center py-20 text-zinc-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Hakuna mikopo hai au iliyokamilika kwa sasa.</p>
          <p className="text-xs mt-1">Mikopo itaonekana hapa baada ya admin kuiidhinisha.</p>
        </div>
      )}

      {/* LOAN CARDS */}
      {!loading && !error && loans.length > 0 && (
        <div className="max-w-4xl space-y-4">
          {loans.map((loan) => {
            const profile    = loan.profiles || {};
            const name       = profile.full_name || profile.username || 'Mtumiaji';
            const principal  = Number(loan.amount || 0);
            const interest   = principal * (Number(loan.interest_rate || 0) / 100);
            const totalOwed  = principal + interest;
            const paid       = Number(loan.amount_paid || 0);
            const remaining  = Math.max(0, totalOwed - paid);
            const progress   = calcProgress(paid, totalOwed);
            const status     = repaymentStatus(progress, loan.due_date);
            const isActioning = actionLoading === loan.id;
            const isExpanded  = expandedId === loan.id;
            const guarantor   = guarantors[loan.id] || parseGuarantorFromDescription(loan.description); // guarantor data (table au description fallback)

            return (
              <div
                key={loan.id}
                className="bg-[#161b18] border border-neutral-800/80 rounded-2xl p-5 shadow-xl hover:border-neutral-700 transition-all"
              >
                {/* TOP: Name + ID + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/60">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {getInitials(name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-sm">{name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                          {loan.id.slice(0, 8)}...
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {loan.purpose && <span>Lengo: <span className="text-neutral-200">{loan.purpose}</span> · </span>}
                        Muda: <span className="text-neutral-300">{loan.duration || '—'}</span>
                        {loan.interest_rate && (
                          <span> · Riba: <span className="text-amber-400 font-semibold">{loan.interest_rate}%</span></span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  {status === 'Fully Paid' || loan.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium shrink-0">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : status === 'Delayed' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium shrink-0">
                      <AlertCircle size={12} /> Imechelewa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium shrink-0">
                      On Track
                    </span>
                  )}
                </div>

                {/* ACCOUNT INFO */}
                <div className="py-3 my-3 bg-neutral-900/50 border border-neutral-800/60 rounded-xl px-4 flex items-center gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-neutral-800/80 text-amber-400 shrink-0">
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider">Akaunti ya Mteja</p>
                    <p className="font-medium text-white mt-0.5">
                      <span className="text-emerald-400 font-semibold">{loan.payment_provider || '—'}</span>
                      {' — '}
                      <span className="font-mono">{loan.account_number || '—'}</span>
                      {profile.email && (
                        <span className="text-neutral-500 ml-1">({profile.email})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Jumla (+ Riba)</p>
                    <p className="font-bold text-white mt-1">{fmt(totalOwed)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Kilicholipwa</p>
                    <p className="font-bold text-emerald-400 mt-1">{fmt(paid)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Kilichobaki</p>
                    <p className="font-bold text-rose-400 mt-1">{fmt(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium flex items-center gap-1">
                      <Calendar size={11} /> Tarehe ya Malipo
                    </p>
                    <p className="font-semibold text-amber-400 mt-1">
                      {loan.due_date
                        ? new Date(loan.due_date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* PROGRESS BAR + ACTIONS */}
                <div className="pt-3 border-t border-neutral-800/60 space-y-3">
                  <div className="w-full">
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5">
                      <span>Maendeleo ya Urejeshaji</span>
                      <span className="font-semibold text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-900 rounded-full h-2 border border-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          progress >= 100
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

                  {/* Payment input + confirm button */}
                  {loan.status === 'completed' ? (
                    /* ── READ-ONLY: Completed ─────────────────────────── */
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                      >
                        <Eye size={14} />
                        {isExpanded ? 'Ficha Maelezo' : 'Ona Maelezo'}
                      </button>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 size={13} /> Loan Fully Settled — Read Only
                      </span>
                    </div>
                  ) : progress < 100 ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-semibold cursor-pointer shrink-0"
                      >
                        <Eye size={14} />
                        {isExpanded ? 'Ficha' : 'Maelezo'}
                      </button>

                      <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-semibold pointer-events-none">TZS</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Weka kiasi kilicholipwa..."
                            value={paymentInputs[loan.id] || ''}
                            onChange={(e) =>
                              setPaymentInputs(prev => ({ ...prev, [loan.id]: e.target.value }))
                            }
                            className="w-full pl-10 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                        <button
                          onClick={() => handleConfirmPayment(loan)}
                          disabled={isActioning || !paymentInputs[loan.id]}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-semibold cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          {isActioning
                            ? <Loader2 size={14} className="animate-spin" />
                            : <CheckCheck size={14} />}
                          Thibitisha
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : loan.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                      >
                        <Eye size={14} />
                        {isExpanded ? 'Ficha Maelezo' : 'Ona Maelezo'}
                      </button>
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 size={14} /> Mkopo Umelipwa Kamili
                      </span>
                    </div>
                  )}

                  {/* Expandable detail panel */}
                  {isExpanded && (
                    <div className="mt-3 bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-4 text-xs space-y-4 text-neutral-400">

                      {/* Loan details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase text-neutral-500">Principal</p>
                          <p className="text-white font-semibold">{fmt(principal)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-neutral-500">Interest ({loan.interest_rate}%)</p>
                          <p className="text-amber-400 font-semibold">{fmt(interest)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-neutral-500">Date Applied</p>
                          <p className="text-white">{new Date(loan.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-neutral-500">Client Email</p>
                          <p className="text-white">{profile.email || '—'}</p>
                        </div>
                      </div>

                      {/* Guarantor section */}
                      <div className="pt-3 border-t border-neutral-800/60">
                        <p className="text-[10px] uppercase text-neutral-500 font-semibold mb-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                          Guarantor Information
                          {guarantor?._fromDescription && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-semibold tracking-wider">
                              Partial (from old application)
                            </span>
                          )}
                        </p>
                        {guarantor ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <p className="text-[10px] uppercase text-neutral-600">Full Name</p>
                              <p className="text-white font-semibold">{guarantor.full_name || '—'}</p>
                            </div>
                            {guarantor.relationship && (
                              <div>
                                <p className="text-[10px] uppercase text-neutral-600">Relationship</p>
                                <p className="text-zinc-300">{guarantor.relationship}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] uppercase text-neutral-600">Phone</p>
                              <p className="text-emerald-400 font-semibold">{guarantor.phone_no || '—'}</p>
                            </div>
                            {guarantor.email && (
                              <div>
                                <p className="text-[10px] uppercase text-neutral-600">Email</p>
                                <p className="text-zinc-300">{guarantor.email}</p>
                              </div>
                            )}
                            {guarantor.occupation && (
                              <div>
                                <p className="text-[10px] uppercase text-neutral-600">Occupation</p>
                                <p className="text-zinc-300">{guarantor.occupation}</p>
                              </div>
                            )}
                            {guarantor.workplace && (
                              <div>
                                <p className="text-[10px] uppercase text-neutral-600">Workplace</p>
                                <p className="text-zinc-300">{guarantor.workplace}</p>
                              </div>
                            )}
                            {guarantor.national_id && (
                              <div>
                                <p className="text-[10px] uppercase text-neutral-600">National ID</p>
                                <p className="text-zinc-300 font-mono">{guarantor.national_id}</p>
                              </div>
                            )}
                            {guarantor.physical_address && (
                              <div className="sm:col-span-2">
                                <p className="text-[10px] uppercase text-neutral-600">Physical Address</p>
                                <p className="text-zinc-300">{guarantor.physical_address}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-neutral-600 italic">
                            No guarantor data found. (Application submitted before guarantor system was enabled)
                          </p>
                        )}
                      </div>

                      {progress < 100 && loan.status !== 'completed' && (
                        <div className="pt-2 border-t border-neutral-800/60">
                          <button
                            onClick={() => handleMarkComplete(loan.id)}
                            disabled={isActioning}
                            className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer disabled:opacity-50"
                          >
                            Mark as fully settled (override)
                          </button>
                        </div>
                      )}
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
