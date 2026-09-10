'use client';

import { useState, useEffect } from 'react';
import UserSidebar from '@/components/user/UserSidebar';
import TopNav from '@/components/user/TopNav';
import StatsCard from '@/components/user/StatsCard';
import Footer from '@/components/user/Footer';
import RecentTransactions from '@/components/user/BalanceChart';
import RequestLoan from '@/components/user/RequestLoan';
import LoanSummary from '@/components/user/LoanSummary';
import { HiCurrencyDollar, HiCheckCircle, HiClock, HiCreditCard } from 'react-icons/hi';
import { supabase } from '@/lib/superbase';

// ── Loan Calculator Component ─────────────────────────────────────────────
function LoanCalculator() {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('3 Months');
  const [interestRate, setInterestRate] = useState(null); // kutoka system settings
  const [maxLimit, setMaxLimit] = useState(null);

  // Pata interest rate na max limit kutoka system settings
  useEffect(() => {
    supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['default_interest', 'max_loan_limit'])
      .then(({ data }) => {
        if (data) {
          data.forEach(row => {
            if (row.key === 'default_interest') setInterestRate(Number(row.value) || 30);
            if (row.key === 'max_loan_limit')   setMaxLimit(Number(row.value) || 10000000);
          });
        }
      });
  }, []);

  const principal = parseFloat(amount) || 0;
  const rate = interestRate ?? 30;

  // Hesabu monthly installment kulingana na muda
  const getMonths = (dur) => {
    const n = parseInt(dur) || 1;
    if (dur?.toLowerCase().includes('year')) return n * 12;
    return n;
  };

  const months       = getMonths(duration);
  const interestAmt  = (principal * rate) / 100;
  const totalPayable = principal + interestAmt;
  const monthly      = months > 0 ? totalPayable / months : 0;

  const fmt = (n) => `TZS ${Number(n).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;
  const isOverLimit = maxLimit && principal > maxLimit;
  const hasResult   = principal > 0 && !isOverLimit;

  return (
    <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <HiCurrencyDollar className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Loan Calculator</h3>
          <p className="text-[11px] text-zinc-500">
            Hesabu mkopo wako kabla ya kuomba — bila kuathiri akaunti yako
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kiasi */}
        <div>
          <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">
            Kiasi (TZS)
          </label>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 500,000"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition"
          />
          {maxLimit && (
            <p className={`text-[10px] mt-1 ${isOverLimit ? 'text-rose-400' : 'text-zinc-600'}`}>
              {isOverLimit ? `⚠ Imezidi kikomo cha ${fmt(maxLimit)}` : `Kikomo: ${fmt(maxLimit)}`}
            </p>
          )}
        </div>

        {/* Muda */}
        <div>
          <label className="block text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">
            Muda wa Kulipa
          </label>
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="12 Months">12 Months</option>
          </select>
        </div>
      </div>

      {/* Interest rate display */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Riba ya sasa:
        <span className="text-emerald-400 font-bold">
          {interestRate !== null ? `${interestRate}%` : '...'}
        </span>
        <span className="text-zinc-600">(inawekwa na mfumo — haibadiliki)</span>
      </div>

      {/* Results */}
      {hasResult ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Principal</p>
            <p className="text-sm font-bold text-white">{fmt(principal)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Riba ({rate}%)</p>
            <p className="text-sm font-bold text-amber-400">{fmt(interestAmt)}</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Jumla ya Kulipa</p>
            <p className="text-sm font-bold text-emerald-400">{fmt(totalPayable)}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Kila Mwezi</p>
            <p className="text-sm font-bold text-blue-400">{fmt(monthly)}</p>
          </div>
        </div>
      ) : principal > 0 && isOverLimit ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center text-rose-400 text-xs font-semibold">
          Kiasi kimezidi kikomo kinachoruhusiwa. Punguza kiasi.
        </div>
      ) : (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 text-center text-zinc-600 text-xs">
          Weka kiasi ili uone matokeo ya hesabu
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);         // Supabase auth user
  const [profile, setProfile] = useState(null);   // profiles table row
  const [loans, setLoans] = useState([]);          // user's loans
  const [loadingUser, setLoadingUser] = useState(true);

  // ── Fetch logged-in user + profile + loans ─────────────────────────────
  useEffect(() => {
    const init = async () => {
      // 1. Pata mtumiaji wa sasa kutoka Supabase Auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        // Hakuna session — redirect kwenda login
        window.location.href = '/log_in';
        return;
      }
      setUser(authUser);

      // 2. Pata profile yake
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, email, role, is_active')
        .eq('id', authUser.id)
        .single();
      setProfile(profileData);

      // Kama ni admin — mrudishe admin dashboard
      if (profileData?.role === 'admin') {
        window.location.href = '/admin_dashbourd';
        return;
      }

      // Kama account imesimamishwa — sign out na redirect
      if (profileData?.is_active === false) {
        await supabase.auth.signOut();
        window.location.href = '/log_in?suspended=1';
        return;
      }

      // 3. Pata mikopo yake yote
      const { data: loansData } = await supabase
        .from('loans')
        .select('id, amount, interest_rate, duration, status, purpose, amount_paid, due_date, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });
      setLoans(loansData || []);

      setLoadingUser(false);
    };

    init();
  }, []);

  // ── Hesabu metrics kutoka loans ────────────────────────────────────────
  const totalBorrowed = loans
    .filter(l => ['active', 'completed'].includes(l.status))
    .reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const activeLoan = loans.find(l => l.status === 'active');
  const activeLoanAmount = activeLoan ? Number(activeLoan.amount || 0) : 0;

  const remainingBalance = loans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => {
      const principal = Number(l.amount || 0);
      const interest = principal * (Number(l.interest_rate || 0) / 100);
      const total = principal + interest;
      const paid = Number(l.amount_paid || 0);
      return sum + Math.max(0, total - paid);
    }, 0);

  const totalTransactions = loans.filter(l => l.status !== 'pending').length;

  const fmt = (n) => `TZS ${Number(n).toLocaleString('en-TZ', { maximumFractionDigits: 0 })}`;

  const displayName = profile?.full_name || profile?.username || user?.email || 'Mtumiaji';
  const displayRole = profile?.role?.toUpperCase() || 'USER';

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#0a0a0a] min-h-screen text-white">
      <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex min-h-screen flex-1 flex-col overflow-y-auto">
        <TopNav userName={displayName} userRole={displayRole} />

        <main className="p-6 md:p-8 space-y-6">

          {/* ── DASHBOARD TAB ─────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <>
              {/* Salamu */}
              <div>
                <h2 className="text-xl font-bold text-white">
                  Karibu, <span className="text-emerald-400">{displayName}</span> 👋
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Here is a summary of your loans and recent activities.
                </p>
              </div>

              {/* Stats Cards — data halisi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Jumla Iliyokopwa"
                  value={fmt(totalBorrowed)}
                  change={loans.filter(l => l.status !== 'pending').length > 0 ? `${loans.filter(l => ['active','completed'].includes(l.status)).length} mikopo` : 'Bado hakuna'}
                  isPositive={true}
                  icon={HiCurrencyDollar}
                />
                <StatsCard
                  title="Mkopo Unaoendelea"
                  value={activeLoan ? fmt(activeLoanAmount) : 'Hakuna'}
                  change={activeLoan ? `Due: ${activeLoan.due_date ? new Date(activeLoan.due_date).toLocaleDateString('en-TZ', {day:'numeric',month:'short'}) : '—'}` : 'Hakuna mkopo hai'}
                  isPositive={!!activeLoan}
                  icon={HiCheckCircle}
                />
                <StatsCard
                  title="Salio Lililobaki"
                  value={remainingBalance > 0 ? fmt(remainingBalance) : 'TZS 0'}
                  change={remainingBalance > 0 ? 'Lipia hivi karibuni' : 'Hakuna deni'}
                  isPositive={remainingBalance === 0}
                  icon={HiClock}
                />
                <StatsCard
                  title="Jumla ya Mikopo"
                  value={String(loans.length)}
                  change={`${loans.filter(l => l.status === 'pending').length} inasubiri idhini`}
                  isPositive={true}
                  icon={HiCreditCard}
                />
              </div>

              {/* Loan Overview + Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LoanSummary userId={user?.id} loans={loans} />
                <RecentTransactions userId={user?.id} loans={loans} />
              </div>

              {/* ── LOAN CALCULATOR ──────────────────────────────────── */}
              <LoanCalculator />
            </>
          )}

          {/* ── REQUEST LOAN TAB ──────────────────────────────────────── */}
          {activeTab === 'request-loan' && (
            <RequestLoan userId={user?.id} onSuccess={() => {
              // Refresh loans baada ya ombi jipya
              supabase
                .from('loans')
                .select('id, amount, interest_rate, duration, status, purpose, amount_paid, due_date, created_at')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .then(({ data }) => setLoans(data || []));
            }} />
          )}

          {/* ── ACTIVE LOANS TAB ──────────────────────────────────────── */}
          {activeTab === 'active-loans' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">My Loans</h2>
              {loans.filter(l => ['active', 'completed'].includes(l.status)).length === 0 ? (
                <div className="bg-[#121212] border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500">
                  <HiCheckCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No active or completed loans yet.</p>
                </div>
              ) : (
                loans.filter(l => ['active', 'completed'].includes(l.status)).map(loan => {
                  const principal  = Number(loan.amount || 0);
                  const interest   = principal * (Number(loan.interest_rate || 0) / 100);
                  const total      = principal + interest;
                  const paid       = Number(loan.amount_paid || 0);
                  const remaining  = Math.max(0, total - paid);
                  const progress   = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  const isComplete = loan.status === 'completed' || progress >= 100;

                  return (
                    <div key={loan.id} className={`border p-5 rounded-2xl space-y-3 ${
                      isComplete
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-[#121212] border-zinc-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-zinc-500 font-mono">{loan.id.slice(0, 8)}...</p>
                          <p className="text-sm font-bold text-white">{loan.purpose || 'Loan'}</p>
                        </div>
                        {isComplete ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                            <HiCheckCircle className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Active</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-500">Total</p>
                          <p className="text-white font-bold">{fmt(total)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Paid</p>
                          <p className="text-emerald-400 font-bold">{fmt(paid)}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Remaining</p>
                          <p className={`font-bold ${isComplete ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isComplete ? 'TZS 0' : fmt(remaining)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-zinc-500 mb-1">
                          <span>Repayment Progress</span>
                          <span className="text-white font-semibold">{progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {isComplete && (
                        <p className="text-xs text-emerald-400/70 text-center pt-1">
                          ✓ Loan fully settled — Read Only
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ──────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="bg-[#121212] border border-zinc-800 p-8 rounded-2xl text-zinc-400">
              <p className="text-sm">Mipangilio ya akaunti — inakuja hivi karibuni.</p>
            </div>
          )}

        </main>
        <Footer />
      </div>
    </div>
  );
}
