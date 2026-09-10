'use client';
import React, { useEffect, useState } from 'react';
import { HiMail, HiPhone, HiCheckCircle } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';

export default function HelpSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'tawk-to-footer-help';
    script.async = true;
    script.src = 'https://embed.tawk.to/693347b229e54f197c444fba/1jbo504ou';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    document.body.appendChild(script);

    return () => {
      window.Tawk_API?.hideWidget?.();
      document.querySelectorAll(
        '#tawkchat-container, .tawk-min-container, iframe[src*="tawk.to"], script[src*="embed.tawk.to"]'
      ).forEach((element) => element.remove());
      delete window.Tawk_API;
      delete window.Tawk_LoadStart;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', service: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    }, 1500);
  };

  return (
    <>
      <div className="bg-[#121212] border border-zinc-800 p-6 pt-10 md:p-10 md:pt-14 rounded-2xl shadow-xl max-w-6xl mx-auto text-white space-y-10 relative">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl flex items-center space-x-3 text-xs">
          <HiCheckCircle className="w-5 h-5 shrink-0"/>
          <span>Your message has been sent successfully! We will get back to you within 24 hours.</span>
        </div>
      )}

      {/* GRID CONTAINER FOR FORM AND CONTACT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT & CENTER: FORM SECTION (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800 p-6 md:p-8 rounded-2xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Send us a message</h2>
            <div className="w-10 h-1 bg-amber-400 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            
            {/* Name & Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Your name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Kamau" 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white placeholder-zinc-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Email address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com" 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white placeholder-zinc-600 transition"
                />
              </div>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Service you&apos;re interested in</label>
              <select 
                name="service"
                value={formData.service}
                onChange={handleChange}
                required 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-zinc-300 transition"
              >
                <option value="">Select a service...</option>
                <option value="Loan Application & Funding">Loan Application & Funding</option>
                <option value="Guarantor Verification">Guarantor Verification</option>
                <option value="Repayment & Billing Support">Repayment & Billing Support</option>
                <option value="Technical System Issue">Technical System Issue</option>
              </select>
            </div>

            {/* Tell us about your goals / Message */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">Tell us about your goals</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5" 
                placeholder="What are you trying to achieve? What challenges are you facing? Any details about your budget or timeline are helpful too..." 
                required 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 text-white placeholder-zinc-600 transition resize-none"
              ></textarea>
            </div>

            {/* Submit Button & Subtext */}
            <div className="pt-2 space-y-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <span>Sending message...</span>
                ) : (
                  <>
                    <span>Send message</span>
                    <span>→</span>
                  </>
                )}
              </button>

              <div className="flex items-center space-x-4 text-[11px] text-zinc-500 pt-1">
                <span>✓ We respond within 24 hours</span>
                <span>•</span>
                <span>✓ No obligation</span>
              </div>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: OTHER WAYS TO REACH US */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">Other ways to reach us</h3>
            <div className="w-10 h-1 bg-amber-400 rounded-full"></div>
          </div>

          <div className="space-y-4 pt-2">
            
            {/* Email Card */}
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

            {/* Call Card */}
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

            {/* WhatsApp Card */}
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

          <div className="border-t border-zinc-800 pt-5">
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">What Next?</h3>
            <div className="w-10 h-1 bg-amber-400 rounded-full mb-4"></div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p>1. <span className="text-white font-semibold">Instant Review</span></p>
              <p>2. <span className="text-white font-semibold">Fast Feedback</span></p>
              <p>3. <span className="text-white font-semibold">Loan Processing</span></p>
            </div>
          </div>
        </div>

      </div>

      </div>
    </>
  );
}