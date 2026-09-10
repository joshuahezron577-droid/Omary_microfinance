'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HiCheck, HiX, HiEye, HiClock, HiCash, HiRefresh, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { supabase } from '@/lib/superbase';

const TABS = [
  { label: 'Pending', value: 'pending', color: 'text-amber-400 border-amber-500' },
  { label: 'Active', value: 'active', color: 'text-blue-400 border-blue-500' },
  { label: 'Rejected', value: 'rejected', color: 'text-rose-400 border-rose-500' },
  { label: 'Completed', value: 'completed', color: 'text-zinc-400 border-zinc-500' },
  { label: 'Yote', value: 'all', color: 'text-white border-zinc-300' },
];

export default function LoanRequestsPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch loans kulingana na tab iliyochaguliwa
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('loans')
      .select(`
        id,
        amount,
        interest_rate,
        status,
        purpose,
        duration,
        payment_provider,
        account_number,
        description,
        created_at,
        id_document_url,
        profiles (
          full_name,
          email,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLoans(data || []);
    }

    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Hesabu due_date kutoka duration string (e.g. "1 Month", "3 Months", "6 Months")
  const calcDueDate = (duration) => {
    const now = new Date();
    if (!duration) {
      // Default: mwezi 1 kama duration haijajulikana
      now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    }
    const lower = duration.toLowerCase();
    const num = parseInt(lower) || 1;
    if (lower.includes('year')) {
      now.setFullYear(now.getFullYear() + num);
    } else if (lower.includes('week')) {
      now.setDate(now.getDate() + num * 7);
    } else {
      // Default: months
      now.setMonth(now.getMonth() + num);
    }
    return now.toISOString().split('T')[0];
  };

  // Approve au Reject — update status kwenye DB
  const handleStatusUpdate = async (loanId, newStatus) => {
    setActionLoading(loanId);

    let updateData;
    if (newStatus === 'active') {
      const loan = loans.find(l => l.id === loanId);
      const dueDate = calcDueDate(loan?.duration);
      updateData = {
        status: newStatus,
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString(),
        due_date: dueDate,
      };
    } else {
      updateData = { status: newStatus };
    }

    const { error: updateError } = await supabase
      .from('loans')
      .update(updateData)
      .eq('id', loanId);

    if (updateError) {
      showToast('error', `Imeshindikana: ${updateError.message}`);
    } else {
      // Ikiwa tunaonyesha pending tab — toa mkopo mara moja (haitakiwi kuonekana tena)
      // Ikiwa tunaonyesha "all" — sasisha status locally
      if (activeTab === 'pending' || activeTab === 'rejected') {
        setLoans(prev => prev.filter(loan => loan.id !== loanId));
      } else {
        setLoans(prev =>
          prev.map(loan => loan.id === loanId ? { ...loan, status: newStatus } : loan)
        );
      }
      const label = newStatus === 'active' ? 'Imeidhinishwa ✓' : 'Imekataliwa';
      showToast('success', `Ombi ${label} kwa mafanikio.`);
    }

    setActionLoading(null);
  };

  // Format nambari za pesa
  const formatAmount = (amount) =>
    `TZS ${Number(amount).toLocaleString('en-TZ')}`;

  // Rangi ya badge kulingana na status
  const statusBadge = (status) => {
    const map = {
      pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
      approved:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rejected:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
      active:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };
    return map[status] || map.pending;
  };

  // Initials za avatar kutoka jina
  const getInitials = (name) =>
    (name || '??').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Format tarehe
  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto text-white relative">

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.type === 'success'
            ? <HiCheckCircle className="w-5 h-5 shrink-0" />
            : <HiExclamationCircle className="w-5 h-5 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 border-b border-zinc-800 pb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center text-amber-400">
            <HiCash className="w-6 h-6 mr-2" /> Maombi ya Mikopo (Loan Requests)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Kagua maombi ya mikopo ya wateja na uidhinishe au ukatae.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
        >
          <HiRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* STATUS TABS */}
      <div className="flex gap-1 mb-5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800 w-fit flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === tab.value
                ? `bg-zinc-800 ${tab.color} border-b-2`
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-zinc-800 rounded w-32" />
                  <div className="h-2 bg-zinc-800 rounded w-48" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(j => <div key={j} className="h-8 bg-zinc-800 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center">
          <HiExclamationCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Imeshindikana kupakia data</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button
            onClick={fetchLoans}
            className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Jaribu tena
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && loans.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <HiClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Hakuna maombi ya mikopo bado.</p>
          <p className="text-xs mt-1">Maombi mapya yataonekana hapa mara yatakapowasilishwa.</p>
        </div>
      )}

      {/* LOAN LIST */}
      {!loading && !error && loans.length > 0 && (
        <div className="space-y-4">
          {loans.map((loan) => {
            const profile = loan.profiles || {};
            const name = profile.full_name || profile.username || 'Mtumiaji Asiyejulikana';
            const isActioning = actionLoading === loan.id;

            return (
              <div
                key={loan.id}
                className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl space-y-4 hover:border-zinc-700 transition"
              >
                {/* TOP ROW: Avatar + Name + Status badge */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                      {getInitials(name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {name}
                        <span className="text-xs text-zinc-500 font-mono ml-2">
                          ({loan.id.slice(0, 8)}...)
                        </span>
                      </h3>
                      <p className="text-xs text-zinc-400">{profile.email || '—'}</p>
                      {loan.purpose && (
                        <p className="text-xs text-zinc-500 mt-0.5">Sababu: {loan.purpose}</p>
                      )}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 border capitalize ${statusBadge(loan.status)}`}>
                    <HiClock className="w-3 h-3" />
                    {loan.status}
                  </span>
                </div>

                {/* LOAN INFO GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/50">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Kiasi</p>
                    <p className="font-bold text-amber-400 text-sm">{formatAmount(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Muda</p>
                    <p className="font-bold text-white">{loan.duration || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Njia ya Malipo</p>
                    <p className="font-bold text-emerald-400">{loan.payment_provider || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">Namba ya Akaunti</p>
                    <p className="font-mono text-zinc-300">{loan.account_number || '—'}</p>
                  </div>
                </div>

                {/* DESCRIPTION (Guarantor + Occupation) */}
                {loan.description && (
                  <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-zinc-500 uppercase mb-0.5">Additional Details</p>
                    <p className="text-xs text-zinc-400">{loan.description}</p>
                  </div>
                )}

                {/* ID DOCUMENT — view only */}
                <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase mb-0.5">ID Document</p>
                    {loan.id_document_url ? (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <HiCheckCircle className="w-3 h-3" /> Document uploaded
                      </p>
                    ) : (
                      <p className="text-xs text-rose-400 flex items-center gap-1">
                        <HiX className="w-3 h-3" /> No document uploaded
                      </p>
                    )}
                  </div>
                  {loan.id_document_url && (
                    <a
                      href={loan.id_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition text-xs font-semibold"
                    >
                      <HiEye className="w-3.5 h-3.5" /> View ID
                    </a>
                  )}
                </div>

                {/* DATE + INTEREST */}
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                  <span>Date: <span className="text-zinc-400">{formatDate(loan.created_at)}</span></span>
                  <span>Interest: <span className="text-amber-400 font-semibold">{loan.interest_rate}%</span></span>
                </div>

                {/* ACTION BUTTONS — onyesha tu kama status ni 'pending' */}
                {loan.status === 'pending' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleStatusUpdate(loan.id, 'rejected')}
                      disabled={isActioning}
                      className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-rose-500/30 transition cursor-pointer flex items-center space-x-1 disabled:opacity-40"
                    >
                      {isActioning ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : <HiX className="w-4 h-4" />}
                      <span>Kataa</span>
                    </button>

                    <button
                      onClick={() => handleStatusUpdate(loan.id, 'active')}
                      disabled={isActioning}
                      className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold border border-emerald-500/30 transition cursor-pointer flex items-center space-x-1 disabled:opacity-40"
                    >
                      {isActioning ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : <HiCheck className="w-4 h-4" />}
                      <span>Idhinisha</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
