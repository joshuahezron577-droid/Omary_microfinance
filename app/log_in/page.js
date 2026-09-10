'use client';

import Link from 'next/link';
import React, { useState, useEffect, Suspense } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/superbase';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maintenance, setMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  const router       = useRouter();
  const searchParams = useSearchParams();

  // Check maintenance mode on mount — onyesha screen tu
  // Admin ataingia kupitia form ya kawaida na bypass maintenance
  useEffect(() => {
    const checkMaintenance = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();
      setMaintenance(data?.value === 'true');
      setCheckingMaintenance(false);
    };
    checkMaintenance();

    if (searchParams.get('suspended') === '1') {
      setError('Your account has been suspended. Please contact admin.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Ingia kupitia Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        const msg = authError.message;
        if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
          throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
        }
        throw authError;
      }

      const user = authData.user;

      if (user) {
        // 2. Angalia role NA is_active kwenye profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData) {
          router.push('/user_dashbourd');
          return;
        }

        // 3. Kama account imesimamishwa — sign out mara moja
        if (profileData.is_active === false) {
          await supabase.auth.signOut();
          setError('Your account has been suspended. Please contact admin.');
          setLoading(false);
          return;
        }

        // 4. Kama maintenance iko ON na ni user (si admin) — mzuie
        if (maintenance && profileData.role !== 'admin') {
          await supabase.auth.signOut();
          setMaintenance(true); // Reshow maintenance screen
          setLoading(false);
          return;
        }

        // 5. Elekeza kulingana na role — hakikisha role ipo
        const role = profileData.role?.toLowerCase()?.trim();
        if (role === 'admin') {
          setFormData({ email: '', password: '' });
          router.push('/admin_dashbourd');
        } else {
          // Default — kila mtu mwingine ni user
          setFormData({ email: '', password: '' });
          router.push('/user_dashbourd');
        }
      }

    } catch (err) {
      setError(err.message || "Imeshindikana kuingia. Hakiki email au nenosiri lako.");
    } finally {
      setLoading(false);
    }
  };

  // Loading while checking maintenance
  if (checkingMaintenance) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0f0e]">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Maintenance screen — inaonyesha kwa users tu
  // Admin anaweza kubonyeza "Admin Access" kupita
  if (maintenance && !checkingMaintenance) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0f0e] text-white px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Under Maintenance</h1>
            <p className="text-zinc-400 text-sm mt-2">
              Omar Microfinance is currently undergoing scheduled maintenance.
              We will be back shortly.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 text-left space-y-1">
            <p className="text-zinc-300 font-semibold">Need urgent help?</p>
            <p>📧 joshuahezron577@gmail.com</p>
            <p>📞 0696408701</p>
            <p>💬 WhatsApp: 0773753292</p>
          </div>
          {/* Admin bypass */}
          <button
            onClick={() => setMaintenance(false)}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition cursor-pointer"
          >
            Admin Access →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#0c0f0e] text-white font-sans">
      {/* Upande wa Kushoto: Branding / Info */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between border-r border-neutral-800/60 relative overflow-hidden">
        {/* Glow ya nyuma ya kijani hafifu */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          {/* Logo ya Kampuni */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-emerald-500/20">
              O
            </div>
            <span className="text-lg font-medium tracking-wide">
              Omar <span className="text-amber-400">microfinance</span>
            </span>
          </div>
        </div>

        <div className="my-auto max-w-lg">
          <p className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-3">
            Finance that moves with you
          </p>
          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Small steps. <br />
            <span className="text-emerald-400">Big possibilities.</span>
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            Simple, fair financial tools built for people building something of their own.
          </p>
        </div>
      </div>

      {/* Upande wa Kulia: Fomu ya Kuingia (Sign In Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-6">
          
          {/* Mobile Logo (Inaonekana kwenye simu tu) */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-base">
              O
            </div>
            <span className="text-base font-medium">
              Omar <span className="text-amber-400">microfinance</span>
            </span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-400 font-medium mb-1">
              Welcome back
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Sign in to your account
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Manage your loans, repayments, and growth.
            </p>
          </div>

          {error && (
            <div className={`rounded-xl border p-3 text-xs text-center ${
              error.includes('suspended')
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : error.includes('maintenance')
                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="amina@omarfinance.co"
                  className="w-full bg-[#121614] border border-neutral-800 focus:border-emerald-500 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock size={16} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#121614] border border-neutral-800 focus:border-emerald-500 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#121614] border-neutral-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                />
                <span className="text-neutral-300 text-xs">Remember me</span>
              </label>

              <Link href="/forget_password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Inaingia...' : 'Sign in \u2192'}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/sign_up" className="text-emerald-400 font-medium hover:underline">
              Join Now
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}