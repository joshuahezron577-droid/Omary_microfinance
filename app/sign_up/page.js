'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { User, AtSign, Mail, Lock, Eye, EyeOff, ShieldOff, Check, X } from 'lucide-react';
import { supabase } from '@/lib/superbase';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [checkingSettings, setCheckingSettings] = useState(true);

  const router = useRouter();

  // Password validation checks
  const password = formData.password;
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase;

  // ── Check allow_registration on mount ──────────────────────────────────
  useEffect(() => {
    const checkRegistration = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'allow_registration')
        .single();

      if (data?.value === 'false') {
        setRegistrationClosed(true);
      }
      setCheckingSettings(false);
    };
    checkRegistration();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isPasswordValid) {
      setError("Tafadhali kamilisha masharti yote ya nenosiri.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Manenosiri hayafanani!");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            username: formData.username,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              full_name: formData.fullName,
              username: formData.username,
              email: formData.email,
              role: 'user', // Daima 'user' — admin haiwezi kuwekwa hapa
              is_active: true,
            },
            { onConflict: 'id' }
          );

        if (profileError && profileError.code !== '42501') {
          throw profileError;
        }
      }

      setSuccessMessage("Account created successfully!");
      
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        router.push('/log_in');
      }, 2000);

    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError("Barua pepe hii imeshasajiliwa. Jaribu kuingia au tumia barua pepe nyingine.");
      } else if (msg.includes('Password should be')) {
        setError("Nenosiri linapaswa kuwa na angalau herufi 8, herufi kubwa na ndogo.");
      } else if (msg.includes('Unable to validate email')) {
        setError("Barua pepe si sahihi. Tafadhali angalia tena.");
      } else if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        setError("Username au barua pepe hii tayari inatumika. Chagua nyingine.");
      } else {
        setError(msg || "Kumetokea hitilafu wakati wa kujisajili. Jaribu tena.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0c0f0e] p-4 sm:p-6 font-sans relative overflow-hidden">
      
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#121614]/90 border border-neutral-800/80 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">

        {checkingSettings && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!checkingSettings && registrationClosed && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
              <ShieldOff className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registration Closed</h2>
              <p className="text-xs text-zinc-400 mt-2">
                New account registrations are currently disabled.<br />
                Please contact the admin for assistance.
              </p>
            </div>
            <Link
              href="/log_in"
              className="inline-block mt-2 text-xs text-emerald-400 hover:underline font-medium"
            >
              Already have an account? Sign in →
            </Link>
          </div>
        )}

        {!checkingSettings && !registrationClosed && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                Omar <span className="text-amber-400">microfinance</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400">
                Create your account to start managing your micro-loans.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 text-center">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><User size={16} /></span>
                  <input type="text" name="fullName" required value={formData.fullName} onChange={handleChange} placeholder="John Doe"
                    className="w-full bg-[#181d1a] border border-neutral-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><AtSign size={16} /></span>
                  <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="Khamis"
                    className="w-full bg-[#181d1a] border border-neutral-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Mail size={16} /></span>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com"
                    className="w-full bg-[#181d1a] border border-neutral-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Lock size={16} /></span>
                  <input type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" autoComplete="new-password"
                    className="w-full bg-[#181d1a] border border-neutral-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Real-time Checklist zikitumia rangi nyekundu/kijivu zikigeuka kijani zikiwa valid */}
                <div className="mt-2 space-y-1 text-[11px]">
                  <p className={`flex items-center gap-1.5 transition-colors ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-red-400'}`}>
                    {hasMinLength ? <Check size={12} /> : <X size={12} />} Angalau herufi 8 (8+ characters)
                  </p>
                  <p className={`flex items-center gap-1.5 transition-colors ${hasUpperCase ? 'text-emerald-400 font-medium' : 'text-red-400'}`}>
                    {hasUpperCase ? <Check size={12} /> : <X size={12} />} Herufi kubwa moja (Uppercase)
                  </p>
                  <p className={`flex items-center gap-1.5 transition-colors ${hasLowerCase ? 'text-emerald-400 font-medium' : 'text-red-400'}`}>
                    {hasLowerCase ? <Check size={12} /> : <X size={12} />} Herufi ndogo moja (Lowercase)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Lock size={16} /></span>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" autoComplete="new-password"
                    className="w-full bg-[#181d1a] border border-neutral-800 focus:border-emerald-500 text-white text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-neutral-600" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Kitufe kimefungwa (disabled) endapo password haijatimiza masharti */}
              <button type="submit" disabled={loading || !isPasswordValid}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? 'Signing up...' : 'Join Now'}
              </button>
            </form>

            <p className="text-center text-xs text-neutral-400 mt-6">
              Already have an account?{' '}
              <Link href="/log_in" className="text-emerald-400 font-medium hover:underline">Log In</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
}