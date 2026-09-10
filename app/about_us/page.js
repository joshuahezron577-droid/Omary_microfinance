'use client';
import React from 'react';
import { HiMail, HiPhone, HiLightningBolt, HiShieldCheck, HiSupport, HiCode } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

export default function AboutUs() {
  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-10 rounded-2xl shadow-xl max-w-6xl mx-auto text-white space-y-12 relative">
      
      {/* TWO COLUMN PROFESSIONAL ABOUT US SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {/* GS Codestar and Fullstack Developer info */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-sm font-bold mb-3">
              <span>GS CODESTAR</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-3">
              A Fullstack Developer
            </h2>
            <h3 className="text-sm uppercase font-bold tracking-widest text-amber-400 mb-2">
              What We Build
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
              We build reliable business systems, modern websites, dashboards, and custom applications for growing organizations. Our goal is to improve your digital operations through secure, scalable, and user-focused technology.
            </p>
            <h3 className="text-sm uppercase font-bold tracking-widest text-amber-400 mb-2">
              What We Used
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm px-3 py-1 rounded-lg font-mono font-semibold">Next.js</span>
              <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm px-3 py-1 rounded-lg font-mono font-semibold">React</span>
              <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm px-3 py-1 rounded-lg font-mono font-semibold">Node.js</span>
              <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm px-3 py-1 rounded-lg font-mono font-semibold">PostgreSQL</span>
              <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-sm px-3 py-1 rounded-lg font-mono font-semibold">Supabase</span>
            </div>
          </div>
        </div>

        {/* UPANDE WA KULIA: Why Clients Choose Us (4 Cards Style kama picha) */}
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 md:p-8 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-widest text-zinc-400 mb-6">Why Clients Choose Us</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1 */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <HiLightningBolt className="w-5 h-5"/>
              </div>
              <h4 className="text-white font-bold text-base">Fast Performance</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                We build optimized systems that load instantly and handle high traffic seamlessly.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <HiShieldCheck className="w-5 h-5"/>
              </div>
              <h4 className="text-white font-bold text-base">Secure Systems</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Top-grade data protection, secure authentication, and bulletproof database structures.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <HiCode className="w-5 h-5"/>
              </div>
              <h4 className="text-white font-bold text-base">Modern Tech Stack</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Utilizing advanced tools like Next.js, React, Node.js, and Supabase for future-proof solutions.
              </p>
            </div>

            {/* Box 4 */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <HiSupport className="w-5 h-5"/>
              </div>
              <h4 className="text-white font-bold text-base">24/7 Expert Support</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Dedicated technical assistance and maintenance whenever your business needs it.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* CONTACT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Contact Us</h3>
            <div className="w-10 h-1 bg-amber-400 rounded-full"></div>
          </div>

          <div className="space-y-4 pt-2">
            
            <a href="mailto:joshuahezron577@gmail.com" className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center space-x-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <HiMail className="w-6 h-6"/>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email us</p>
                <span className="text-xs md:text-sm font-bold text-white truncate block">
                  joshuahezron577@gmail.com
                </span>
              </div>
            </a>

            <a href="tel:0773753292" className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center space-x-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <HiPhone className="w-6 h-6"/>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Call us</p>
                <span className="text-xs md:text-sm font-bold text-white block">
                  0773753292
                </span>
              </div>
            </a>

            <a href="https://wa.me/255773753292" target="_blank" rel="noreferrer" className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center space-x-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <FaWhatsapp className="w-6 h-6"/>
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">WhatsApp</p>
                <span className="text-xs md:text-sm font-bold text-amber-400 truncate block">
                  0773753292
                </span>
              </div>
            </a>

          </div>

        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-2xl">
          <h3 className="text-2xl font-bold tracking-tight text-white mb-2">What Comes Next</h3>
          <div className="w-10 h-1 bg-amber-400 rounded-full mb-6"></div>
          <div className="space-y-4 text-sm text-zinc-300">
            <div className="border-b border-zinc-800 pb-4">
              <p className="text-white font-semibold">1. Instant project review</p>
              <p className="mt-1 text-zinc-400">We quickly review your idea, requirements, and technical goals.</p>
            </div>
            <div className="border-b border-zinc-800 pb-4">
              <p className="text-white font-semibold">2. Clear project plan</p>
              <p className="mt-1 text-zinc-400">You receive practical guidance, scope, and the best technology approach.</p>
            </div>
            <div>
              <p className="text-white font-semibold">3. Reliable delivery</p>
              <p className="mt-1 text-zinc-400">We build, test, and support your solution from start to launch.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}