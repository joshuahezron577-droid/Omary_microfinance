'use client'

import { useState } from 'react'
import { supabase } from '@/lib/superbase'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [message, setMessage]           = useState(null)
  const [error, setError]               = useState(null)

  const router = useRouter()

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Password updated successfully! Redirecting to sign in...')
      setPassword('')
      setConfirm('')
      setTimeout(() => router.push('/log_in'), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f0e] px-4">
      <div className="w-full max-w-md rounded-2xl bg-[#121614] border border-neutral-800 p-8 shadow-xl">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Set New Password</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Enter your new password for your Omar Microfinance account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 pl-10 pr-10 py-2.5 text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none text-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 pl-10 pr-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none text-sm transition"
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
              <p className="text-xs text-emerald-400 mt-1">✓ Passwords match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 font-bold text-black transition disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? 'Updating password...' : 'Update Password →'}
          </button>
        </form>

      </div>
    </div>
  )
}
