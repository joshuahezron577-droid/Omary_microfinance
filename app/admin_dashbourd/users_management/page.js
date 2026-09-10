'use client';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, Mail, Trash2,
  RefreshCw, AlertTriangle, Users, Search, Printer
} from 'lucide-react';
import { supabase } from '@/lib/superbase';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `TZS ${Number(n || 0).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-TZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getUserLoanSummary = (user) => {
  const loans = user.loans || [];

  return {
    loanCount: loans.length,
    totalBorrowed: loans
      .filter(loan => ['active', 'completed'].includes(loan.status))
      .reduce((total, loan) => total + Number(loan.amount || 0), 0),
  };
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function UsersManagementPage() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // userId wa kuthibitisha

  const handlePrint = () => {
    window.print();
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteUser = async (userId, name) => {
    setDeleteLoading(userId);
    setConfirmDelete(null);

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      showToast('error', `Failed: ${result.error}`);
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('success', `${name} — account deleted successfully.`);
    }

    setDeleteLoading(null);
  };

  // ── Fetch profiles + their loans ─────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        username,
        email,
        role,
        is_active,
        created_at,
        loans (
          id,
          amount,
          status
        )
      `)
      .eq('role', 'user')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Toggle is_active ──────────────────────────────────────────────────────
  // ── Filtered users ────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  });

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
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-wide flex items-center gap-2">
            <Users size={20} className="text-amber-400" />
            Users Management
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Manage all registered borrowers, view their profiles, and control account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition w-52"
            />
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || !!error || users.length === 0}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Printer size={12} />
            Print List
          </button>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 print:hidden">
          {/* Total Registered */}
          <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-amber-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 shrink-0">
              <Users size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Total Registered</p>
              <p className="text-2xl font-extrabold text-amber-400 leading-tight">{users.length}</p>
              <p className="text-[10px] text-neutral-600 mt-0.5">Wateja wote waliojisajili</p>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-emerald-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Active Accounts</p>
              <p className="text-2xl font-extrabold text-emerald-400 leading-tight">
                {users.filter(u => (u.loans || []).some(l => ['active','pending','completed'].includes(l.status))).length}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">Waliowahi kutumia mfumo</p>
            </div>
          </div>

          {/* With Active Loans */}
          <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-all">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">With Active Loans</p>
              <p className="text-2xl font-extrabold text-blue-400 leading-tight">
                {users.filter(u => (u.loans || []).some(l => l.status === 'active')).length}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">Wanaolipia mikopo sasa</p>
            </div>
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl overflow-hidden print:hidden">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-neutral-800/60 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-zinc-800 rounded" />
                <div className="h-2 w-40 bg-zinc-800/60 rounded" />
              </div>
              <div className="w-20 h-5 bg-zinc-800 rounded-full" />
              <div className="w-24 h-4 bg-zinc-800 rounded" />
              <div className="w-16 h-6 bg-zinc-800 rounded-full" />
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-xl" />
                <div className="w-8 h-8 bg-zinc-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-8 text-center print:hidden">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
          <p className="text-rose-400 font-semibold text-sm">Failed to load users</p>
          <p className="text-zinc-500 text-xs mt-1">{error}</p>
          <button onClick={fetchUsers} className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">
            Try again
          </button>
        </div>
      )}

      {/* TABLE */}
      {!loading && !error && (
        <div className="bg-[#121614] border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">User Details</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Active Loans</th>
                  <th className="py-3 px-4 font-semibold">Total Borrowed</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-neutral-500 text-sm">
                      {search ? `No users found matching "${search}"` : 'No users registered yet.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const name         = user.full_name || user.username || 'Unknown User';
                    const loans        = user.loans || [];
                    const { totalBorrowed } = getUserLoanSummary(user);
                    const activeLoans  = loans.filter(l => l.status === 'active').length;
                    const isExpanded   = expandedUser === user.id;
                    const canDelete    = loans.length === 0 ||
                      loans.every(l => l.status === 'completed' || l.status === 'rejected');
                    const isDeleting   = deleteLoading === user.id;

                    return (
                      <React.Fragment key={user.id}>
                        <tr className={`hover:bg-neutral-900/30 transition-all ${isExpanded ? 'bg-neutral-900/20' : ''}`}>

                          {/* User details */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {getInitials(name)}
                              </div>
                              <div>
                                <p className="font-bold text-white">{name}</p>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  {user.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-4 px-4 text-neutral-300">
                            <div className="space-y-0.5">
                              <p className="flex items-center gap-1.5">
                                <Mail size={11} className="text-neutral-500" />
                                {user.email || '—'}
                              </p>
                              {user.username && (
                                <p className="text-neutral-500 text-[10px]">@{user.username}</p>
                              )}
                            </div>
                          </td>

                          {/* Active loans */}
                          <td className="py-4 px-4">
                            <span className={`font-semibold ${activeLoans > 0 ? 'text-blue-400' : 'text-neutral-500'}`}>
                              {activeLoans} Active
                            </span>
                            {loans.filter(l => l.status === 'pending').length > 0 && (
                              <span className="ml-2 text-[10px] text-amber-400">
                                +{loans.filter(l => l.status === 'pending').length} pending
                              </span>
                            )}
                          </td>

                          {/* Total borrowed */}
                          <td className="py-4 px-4">
                            <span className={`font-semibold ${totalBorrowed > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                              {totalBorrowed > 0 ? fmt(totalBorrowed) : '—'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium ${
                              user.is_active === false
                                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            }`}>
                              {user.is_active === false ? 'Suspended' : 'Active'}
                            </span>
                          </td>

                          {/* Actions — View Loans + Delete (if eligible) */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                                title="View Loan History"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all cursor-pointer text-xs font-semibold"
                              >
                                <Eye size={13} />
                                View Loans
                              </button>

                              {/* Delete — inaonekana tu kama loans zote completed/rejected */}
                              {canDelete && (
                                confirmDelete === user.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-rose-400">Confirm?</span>
                                    <button
                                      onClick={() => handleDeleteUser(user.id, name)}
                                      disabled={isDeleting}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold cursor-pointer hover:bg-rose-500/30 transition disabled:opacity-50"
                                    >
                                      {isDeleting ? '...' : 'Yes, Delete'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDelete(null)}
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold cursor-pointer hover:bg-zinc-700 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDelete(user.id)}
                                    title="Delete User"
                                    className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row — loan history */}
                        {isExpanded && (
                          <tr className="bg-neutral-900/40">
                            <td colSpan="6" className="px-4 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-4 text-[11px] text-zinc-400 mb-3">
                                  <span>Joined: <strong className="text-zinc-300">{fmtDate(user.created_at)}</strong></span>
                                  <span>Role: <strong className="text-amber-400 capitalize">{user.role || 'user'}</strong></span>
                                  <span>Total Loans: <strong className="text-zinc-300">{loans.length}</strong></span>
                                </div>

                                {loans.length === 0 ? (
                                  <p className="text-xs text-zinc-600">No loan history for this user.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {loans.map(loan => (
                                      <div key={loan.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                                        <span className="font-mono text-zinc-500">{loan.id.slice(0, 8)}...</span>
                                        <span className="text-white font-semibold">{fmt(loan.amount)}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                          loan.status === 'active'    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                          loan.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                          loan.status === 'pending'   ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                          {loan.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-800/60 bg-neutral-900/30 text-[11px] text-neutral-500">
            Showing <strong className="text-neutral-300">{filtered.length}</strong> of <strong className="text-neutral-300">{users.length}</strong> users
          </div>
        </div>
      )}

      {/* PRINT REPORT: intentionally separate from the interactive table */}
      {!loading && !error && (
        <section className="hidden print:block print-report">
          <div className="mb-5 border-b-2 border-black pb-3">
            <h1 className="text-2xl font-bold text-black">Omar Microfinance - Users Report</h1>
            <p className="mt-1 text-sm text-black">All registered users | Printed {fmtDate(new Date().toISOString())}</p>
          </div>
          <div className="mb-4 grid grid-cols-3 border border-black text-center text-sm text-black">
            <div className="border-r border-black px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide">Total Users</span>
              <strong className="text-lg">{users.length}</strong>
            </div>
            <div className="border-r border-black px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide">Active Accounts</span>
              <strong className="text-lg">{users.filter(u => (u.loans || []).some(l => ['active','pending','completed'].includes(l.status))).length}</strong>
            </div>
            <div className="px-3 py-2">
              <span className="block text-[10px] uppercase tracking-wide">With Active Loans</span>
              <strong className="text-lg">{users.filter(user => (user.loans || []).some(loan => loan.status === 'active')).length}</strong>
            </div>
          </div>
          <table className="w-full border-collapse text-left text-xs text-black">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="px-2 py-2 font-bold">Name</th>
                <th className="px-2 py-2 font-bold">User ID</th>
                <th className="px-2 py-2 font-bold">Email</th>
                <th className="px-2 py-2 font-bold">Username</th>
                <th className="px-2 py-2 font-bold">Loans</th>
                <th className="px-2 py-2 font-bold">Total Borrowed</th>
                <th className="px-2 py-2 font-bold">Account Status</th>
                <th className="px-2 py-2 font-bold">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const loans = user.loans || [];
                const { loanCount, totalBorrowed } = getUserLoanSummary(user);
                const activeLoanCount = loans.filter(loan => loan.status === 'active').length;
                const pendingLoanCount = loans.filter(loan => loan.status === 'pending').length;

                return (
                  <tr key={user.id} className="border-b border-gray-300">
                    <td className="px-2 py-2">{user.full_name || user.username || 'Unknown User'}</td>
                    <td className="px-2 py-2 font-mono text-[10px]">{user.id.slice(0, 8)}...</td>
                    <td className="px-2 py-2">{user.email || '—'}</td>
                    <td className="px-2 py-2">{user.username ? `@${user.username}` : '—'}</td>
                    <td className="px-2 py-2">
                      {loanCount === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span>
                          <strong>{loanCount}</strong>
                          {activeLoanCount > 0 && (
                            <span className="ml-1 text-[10px] border border-blue-400 text-blue-600 rounded px-1">{activeLoanCount} active</span>
                          )}
                          {pendingLoanCount > 0 && (
                            <span className="ml-1 text-[10px] border border-amber-500 text-amber-600 rounded px-1">{pendingLoanCount} pending</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">{loanCount > 0 ? fmt(totalBorrowed) : '—'}</td>
                    <td className="px-2 py-2">{user.is_active === false ? 'Suspended' : 'Active'}</td>
                    <td className="px-2 py-2">{fmtDate(user.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <footer className="print-report-footer text-xs text-black">
            <span>Generated by Omar Microfinance System</span>
            <span className="print-page-number" />
            <span>This document is confidential</span>
          </footer>
        </section>
      )}
    </div>
  );
}
