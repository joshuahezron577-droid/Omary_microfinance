'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Eye, RefreshCw, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '@/lib/superbase';

export default function PendingRequestsTable() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fmt = (n) =>
    `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

  // ── Fetch pending loans ───────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('loans')
      .select(`
        id,
        amount,
        purpose,
        duration,
        created_at,
        profiles (
          full_name,
          username,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (err) {
      setError(err.message);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Hesabu due_date kutoka duration string (e.g. "1 Month", "3 Months", "6 Months")
  const calcDueDate = (duration) => {
    const now = new Date();
    if (!duration) {
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
      now.setMonth(now.getMonth() + num);
    }
    return now.toISOString().split('T')[0];
  };

  // ── Approve au Reject ─────────────────────────────────────────────────────
  const handleAction = async (loanId, newStatus) => {
    setActionLoading(`${loanId}-${newStatus}`);

    let updateData;
    if (newStatus === 'active') {
      const item = requests.find(r => r.id === loanId);
      const dueDate = calcDueDate(item?.duration);
      updateData = {
        status: newStatus,
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString(),
        due_date: dueDate,
      };
    } else {
      updateData = { status: newStatus };
    }

    const { error: updateErr } = await supabase
      .from('loans')
      .update(updateData)
      .eq('id', loanId);

    if (updateErr) {
      showToast('error', `Imeshindikana: ${updateErr.message}`);
    } else {
      // Toa kutoka kwenye orodha mara moja
      setRequests((prev) => prev.filter((r) => r.id !== loanId));
      showToast(
        'success',
        newStatus === 'active'
          ? 'Mkopo umeidhinishwa na kuwa hai ✓'
          : 'Ombi limekataliwa.'
      );
    }

    setActionLoading(null);
  };

  const getInitials = (name = '') =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-TZ', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-6 shadow-xl relative">

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle2 size={15} />
            : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock size={14} className="text-amber-400" />
            Maombi Yanayosubiri
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Maombi 10 ya hivi karibuni yenye hali ya pending
          </p>
        </div>
        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* LOADING SKELETON */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/60 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-zinc-800 rounded" />
                  <div className="h-2 w-40 bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-zinc-800 rounded-lg" />
                <div className="h-8 w-20 bg-zinc-800 rounded-lg" />
                <div className="h-8 w-16 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 text-sm font-semibold">Imeshindikana kupakia</p>
          <p className="text-xs text-zinc-500 mt-1">{error}</p>
          <button
            onClick={fetchPending}
            className="mt-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Jaribu tena
          </button>
        </div>
      )}

      {/* EMPTY */}
      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-10 text-neutral-500">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Hakuna maombi yanayosubiri kwa sasa.</p>
        </div>
      )}

      {/* LIST */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((item) => {
            const profile = item.profiles || {};
            const name = profile.full_name || profile.username || 'Mtumiaji';
            const isApprovingThis = actionLoading === `${item.id}-active`;
            const isRejectingThis = actionLoading === `${item.id}-rejected`;
            const isActioning = isApprovingThis || isRejectingThis;

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/60 hover:border-neutral-700 transition-all gap-4"
              >
                {/* LEFT: Avatar + Info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {getInitials(name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{name}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      <span className="font-mono text-neutral-500 text-[10px]">
                        {item.id.slice(0, 8)}...
                      </span>
                      {' · '}
                      <span className="text-amber-400 font-semibold">{fmt(item.amount)}</span>
                      {item.duration && (
                        <span className="text-neutral-500"> · {item.duration}</span>
                      )}
                      {' · '}
                      <span className="text-neutral-500">{formatDate(item.created_at)}</span>
                    </p>
                    {item.purpose && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-xs">
                        {item.purpose}
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT: Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Approve */}
                  <button
                    onClick={() => handleAction(item.id, 'active')}
                    disabled={isActioning}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {isApprovingThis
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCircle2 size={12} />}
                    Idhinisha
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => handleAction(item.id, 'rejected')}
                    disabled={isActioning}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {isRejectingThis
                      ? <Loader2 size={12} className="animate-spin" />
                      : <XCircle size={12} />}
                    Kataa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
