'use client';
import React from 'react';
import Link from 'next/link';
import { HiCode } from 'react-icons/hi';

export default function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-zinc-800 text-zinc-400 text-xs py-12 px-6 md:px-12 mt-16">
      {/* Tumeondoa column ya kwanza na kubaki na columns 3 */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        
        {/* Safu ya 1: Quick Links */}
        <div className="space-y-3 md:pl-4">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Quick Links</h4>
          <ul className="space-y-2 text-sm font-bold">
            <li>
              <Link href="/about_us" className="font-bold text-zinc-300 hover:text-amber-400 transition-colors">About Us</Link>
            </li>
            <li>
              <Link href="/faq" className="font-bold text-zinc-300 hover:text-amber-400 transition-colors">FAQ</Link>
            </li>
            <li>
              <Link href="/footer_help" className="font-bold text-zinc-300 hover:text-amber-400 transition-colors">Support & Contact</Link>
            </li>
          </ul>
        </div>

        {/* Safu ya 2: Contact Us */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Contact Us</h4>
          <ul className="space-y-2.5 text-sm font-bold">
            <li>
              <span className="text-zinc-300">Phone: <a href="tel:+255696408701" className="hover:text-amber-400 transition-colors">0696408701</a></span>
            </li>
            <li>
              <span className="text-zinc-300">WhatsApp: <a href="https://wa.me/255773753292" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">0773753292</a></span>
            </li>
            <li>
              <span className="text-zinc-300">Email: <a href="mailto:joshuahezron577@gmail.com" className="hover:text-amber-400 transition-colors">joshuahezron577@gmail.com</a></span>
            </li>
          </ul>
        </div>

        {/* Safu ya 3: System & Developer */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">System & Developer</h4>
          <div className="space-y-2 text-sm font-bold text-zinc-300">
            <p className="flex items-center space-x-1.5 text-zinc-400">
              <HiCode className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Created by <strong className="text-white">GS Codestar</strong></span>
            </p>
            <p className="text-sm text-zinc-300 italic">
              "We maintain transparency, accountability and accuracy."
            </p>
          </div>
        </div>

      </div>

      {/* Mstari wa Chini Kabisa: Copyright Imehamia Katikati na Link za pembeni zimeondolewa */}
      <div className="max-w-6xl mx-auto pt-6 border-t border-zinc-800/60 flex items-center justify-center text-sm font-bold text-zinc-300 text-center w-full">
        <p>&copy; {new Date().getFullYear()} Omar microfinance. All rights reserved.</p>
      </div>
    </footer>
  );
}