'use client'

import { useState } from 'react'
import { supabase } from '@/lib/superbase'
import { Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError]     = useState(null)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update_password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Reset link sent! Please check your email and follow the instructions to reset your password.')
      setEmail('')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f0e] px-4">
      <div className="w-full max-w-md rounded-2xl bg-[#121614] border border-neutral-800 p-8 shadow-xl">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Enter the email address linked to your Omar Microfinance account. We will send you a reset link.
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

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 pl-10 pr-3 py-2.5 text-white placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 font-bold text-black transition disabled:opacity-50 cursor-pointer text-sm"
          >
            {loading ? 'Sending reset link...' : 'Send Reset Link →'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <a href="/log_in" className="text-sm font-medium text-amber-400 hover:underline">
            ← Back to Sign In
          </a>
        </div>
      </div>
    </div>
  )
}
