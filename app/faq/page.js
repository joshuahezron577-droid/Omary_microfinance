import React from 'react';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral text-neutral-content px-6 py-12 lg:px-20">
      
      {/* Sehemu ya Juu (Hero Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
        
        {/* Upande wa Kushoto: Mpangilio Mpya */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Kichwa Kikuu Juu kabisa */}
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-none">
            Frequently asked <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-yellow-300">
              questions
            </span>
          </h1>

          {/* 2. Neno FAQ na Kistari chenye Rangi */}
          <div className="space-y-2">
            <span className="text-amber-400 font-bold tracking-wider uppercase text-sm">
              FAQ
            </span>
            <div className="w-16 h-1 bg-linear-to-r from-amber-400 to-yellow-300 rounded-full"></div>
          </div>

          <p className="text-gray-300 text-base lg:text-lg max-w-xl">
            Everything you need to know about our services, process and approach.
          </p>

          {/* 3. Got a question? na Button mbele yake */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <span className="text-gray-300 font-medium">Got a question?</span>
            <Link 
              href="/footer_help" 
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-400 text-gray-950 font-bold hover:bg-yellow-300 transition-colors shadow-lg w-fit"
            >
              Ask us directly &rarr;
            </Link>
          </div>
        </div>

        {/* Upande wa Kulia: Kadi ya Quick Facts */}
        <div className="lg:col-span-5 bg-neutral-focus border border-gray-800 p-6 rounded-2xl shadow-2xl space-y-4">
          <h3 className="text-gray-400 uppercase tracking-wider text-xs font-bold mb-4">
            QUICK FACTS
          </h3>
          
          <div className="bg-zinc-900/80 border border-gray-800 p-4 rounded-xl text-sm text-gray-200 flex items-center space-x-3">
            <span className="text-amber-400 font-bold">&#10003;</span>
            <span>We respond within 24 hours</span>
          </div>

          <div className="bg-zinc-900/80 border border-gray-800 p-4 rounded-xl text-sm text-gray-200 flex items-center space-x-3">
            <span className="text-amber-400 font-bold">&#10003;</span>
            <span>No long-term contracts required</span>
          </div>

          <div className="bg-zinc-900/80 border border-gray-800 p-4 rounded-xl text-sm text-gray-200 flex items-center space-x-3">
            <span className="text-amber-400 font-bold">&#10003;</span>
            <span>Custom pricing for every project</span>
          </div>

          <div className="bg-zinc-900/80 border border-gray-800 p-4 rounded-xl text-sm text-gray-200 flex items-center space-x-3">
            <span className="text-amber-400 font-bold">&#10003;</span>
            <span>Dedicated support for microfinance clients</span>
          </div>

          <div className="bg-zinc-900/80 border border-gray-800 p-4 rounded-xl text-sm text-gray-200 flex items-center space-x-3">
            <span className="text-amber-400 font-bold">&#10003;</span>
            <span>50+ questions answered below</span>
          </div>
        </div>

      </div>

      {/* Sehemu ya Chini: Questions and Answers (Accordion) */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl font-bold mb-6 text-center text-amber-400">
          Answers & Information (FAQ)
        </h2>

        <div className="collapse collapse-plus bg-base-100 text-base-content border border-base-300 rounded-xl shadow-md">
          <input type="radio" name="my-accordion-3" defaultChecked />
          <div className="collapse-title font-semibold text-lg">How do I create an account?</div>
          <div className="collapse-content text-sm text-gray-600">
            Click the "Sign Up" button in the top right corner and follow the registration process.
          </div>
        </div>

        <div className="collapse collapse-plus bg-base-100 text-base-content border border-base-300 rounded-xl shadow-md">
          <input type="radio" name="my-accordion-3" />
          <div className="collapse-title font-semibold text-lg">I forgot my password. What should I do?</div>
          <div className="collapse-content text-sm text-gray-600">
            Click on "Forgot Password" on the login page and follow the instructions sent to your email.
          </div>
        </div>

        <div className="collapse collapse-plus bg-base-100 text-base-content border border-base-300 rounded-xl shadow-md">
          <input type="radio" name="my-accordion-3" />
          <div className="collapse-title font-semibold text-lg">How do I update my profile information?</div>
          <div className="collapse-content text-sm text-gray-600">
            Go to "My Account" settings and select "Edit Profile" to make changes.
          </div>
        </div>

      </div>

    </div>
  );
}