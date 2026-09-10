'use client';

import React, { useState, useEffect } from 'react';
import { HiUser, HiLockClosed, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/superbase';

export default function SettingsPage() {
  // ── Profile state ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    fullName: '',
    username: '',
    email: '',
  });

  // ── Password state ────────────────────────────────────────────────────────
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [profileMsg, setProfileMsg]   = useState(null); // { type, text }
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [profileLoading, setProfileLoading]   = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── Fetch profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, username, email')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          fullName: data.full_name || '',
          username: data.username || '',
          email:    data.email    || user.email || '',
        });
      }
      setFetching(false);
    };
    fetchProfile();
  }, []);

  // ── Save Profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfileLoading(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.fullName,
        username:  profile.username,
      })
      .eq('id', user.id);

    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMsg(null), 4000);
    }

    setProfileLoading(false);
  };

  // ── Change Password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMsg(null), 4000);
    }

    setPasswordLoading(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-10 rounded-2xl shadow-xl max-w-4xl mx-auto text-white space-y-8">

      {/* HEADER */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Account Settings</h2>
        <p className="text-xs text-zinc-400">Manage your profile details and account security.</p>
      </div>

      {/* ── SECTION 1: PERSONAL INFORMATION ────────────────────────────── */}
      <form onSubmit={handleSaveProfile} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-3">
          <HiUser className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Personal Information</h3>
        </div>

        {profileMsg && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${
            profileMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {profileMsg.type === 'success'
              ? <HiCheckCircle className="w-4 h-4 shrink-0" />
              : <HiExclamationCircle className="w-4 h-4 shrink-0" />}
            {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={profile.fullName}
              onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={profile.username}
              onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white transition"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Email cannot be changed here.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={profileLoading}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 px-6 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* ── SECTION 2: CHANGE PASSWORD ──────────────────────────────────── */}
      <form onSubmit={handleChangePassword} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-zinc-800/80 pb-3">
          <HiLockClosed className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Change Password</h3>
        </div>

        {passwordMsg && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${
            passwordMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {passwordMsg.type === 'success'
              ? <HiCheckCircle className="w-4 h-4 shrink-0" />
              : <HiExclamationCircle className="w-4 h-4 shrink-0" />}
            {passwordMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-amber-400 text-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white transition"
              />
            </div>
            {passwordData.confirmPassword && (
              <p className={`text-[10px] mt-1 ${
                passwordData.newPassword === passwordData.confirmPassword
                  ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {passwordData.newPassword === passwordData.confirmPassword
                  ? '✓ Passwords match'
                  : 'Passwords do not match'}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={passwordLoading}
            className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 px-6 rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
          >
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
