"use client";

import React from 'react';
import { ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';

export default function VercelHeroAuth() {
  return (
    <div className="min-h-screen w-full bg-[#0a0c0a] text-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      
      {/* Vercel-style Ambient Glow / Background Light Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 -right-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-[#121614] border border-neutral-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 flex flex-col justify-between min-h-[550px]">
        
        {/* Top Section: Logo & Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-neutral-950 font-black text-base shadow-lg shadow-emerald-500/20">
              O
            </div>
            <span className="font-bold tracking-tight text-white text-base">
              Omar <span className="text-amber-400 font-normal">microfinance</span>
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Sparkles size={12} /> Secure Platform
          </div>
        </div>

        {/* Middle Section: Tagline & Main Value Proposition (Kile ulichokizungushia nyekundu) */}
        <div className="my-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-3">
            Finance That Moves With You
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-4">
            Small steps. <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Big possibilities.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Simple, fair financial tools built for people building something of their own. Manage your loans, repayments, and financial growth seamlessly.
          </p>
        </div>

        {/* Bottom Section: Vitufe Vikuu Viwili (New Customer vs Already a Member) */}
        <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          
          {/* Button 1: New Customer Sign Up */}
          <a
            href="/sign_up"
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer group"
          >
            <UserPlus size={16} className="transition-transform group-hover:scale-110" />
            <span>New Customer? Sign Up</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </a>

          {/* Button 2: Already a Member Sign In */}
          <a
            href="/log_in"
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer group"
          >
            <LogIn size={16} className="text-emerald-400 transition-transform group-hover:scale-110" />
            <span>Already a member? Sign In</span>
          </a>

        </div>

      </div>
    </div>
  );
}