'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Shield, Sliders, ToggleLeft, ToggleRight,
  AlertTriangle, RefreshCw, CheckCircle2, Loader2, Save
} from 'lucide-react';
import { supabase } from '@/lib/superbase';

const DEFAULTS = {
  maintenance_mode:   'false',
  allow_registration: 'true',
  default_interest:   '30',
  max_loan_limit:     '10000000',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', Object.keys(DEFAULTS));

    if (!error && data) {
      const mapped = { ...DEFAULTS };
      data.forEach(row => { mapped[row.key] = row.value; });
      setSettings(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // Save settings
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      showToast('error', `Failed to save: ${error.message}`);
    } else {
      showToast('success', 'System settings saved successfully.');
    }
    setSaving(false);
  };

  const toggle = (key) =>
    setSettings(prev => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  const bool = (key) => settings[key] === 'true';
  const set  = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#0c0f0e] min-h-screen text-white p-6 md:p-8">

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={20} className="text-emerald-400" />
            System Settings
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Control core system behaviour — maintenance, registration, interest rate and loan limits.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8">
          <Loader2 size={16} className="animate-spin" /> Loading settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-2xl space-y-5">

          {/* ── 1. MASTER CONTROLS ──────────────────────────────── */}
          <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-800 text-emerald-400 font-semibold text-sm">
              <Shield size={15} /> Master Controls
            </div>
            <div className="space-y-3">

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                <div>
                  <p className="font-bold text-white text-sm flex items-center gap-2">
                    <AlertTriangle size={13} className="text-amber-400" /> Maintenance Mode
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Block all user access — only admin can sign in.
                  </p>
                </div>
                <button type="button" onClick={() => toggle('maintenance_mode')} className="cursor-pointer">
                  {bool('maintenance_mode')
                    ? <ToggleRight size={36} className="text-amber-400" />
                    : <ToggleLeft  size={36} className="text-neutral-600" />}
                </button>
              </div>

              {/* Allow Registration */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
                <div>
                  <p className="font-bold text-white text-sm">New User Registrations</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Allow new borrowers to sign up on the platform.
                  </p>
                </div>
                <button type="button" onClick={() => toggle('allow_registration')} className="cursor-pointer">
                  {bool('allow_registration')
                    ? <ToggleRight size={36} className="text-emerald-400" />
                    : <ToggleLeft  size={36} className="text-neutral-600" />}
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. LOAN PARAMETERS ──────────────────────────────── */}
          <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-neutral-800 text-emerald-400 font-semibold text-sm">
              <Sliders size={15} /> Loan Parameters
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

              {/* Default Interest */}
              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                  Default Interest Rate (%)
                </label>
                <input
                  type="number"
                  min="0" max="100"
                  value={settings.default_interest}
                  onChange={e => set('default_interest', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition"
                />
                <p className="text-neutral-600 mt-1 text-[10px]">Applied to all new loan requests</p>
              </div>

              {/* Max Loan Limit */}
              <div>
                <label className="block text-neutral-400 mb-1.5 font-medium uppercase tracking-wider text-[10px]">
                  Max Loan Limit (TZS)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.max_loan_limit}
                  onChange={e => set('max_loan_limit', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition"
                />
                <p className="text-neutral-600 mt-1 text-[10px]">
                  = TZS {Number(settings.max_loan_limit || 0).toLocaleString('en-TZ')}
                </p>
              </div>
            </div>
          </div>

          {/* SAVE */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition cursor-pointer disabled:opacity-60 shadow-lg"
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : <><Save size={14} /> Save Changes</>}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
