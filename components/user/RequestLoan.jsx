'use client';

import { useState } from 'react';

export default function RequestLoan() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="max-w-2xl rounded-2xl border border-zinc-800 bg-[#121212] p-6">
      <h2 className="text-xl font-bold text-white">Request New Loan</h2>
      <p className="mt-1 text-sm text-zinc-400">Submit a new loan request for review.</p>
      {submitted ? <p className="mt-6 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-400">Request submitted successfully.</p> : <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><label className="block text-sm text-zinc-300">Loan amount<input required type="number" min="1" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" placeholder="e.g. 500000" /></label><label className="block text-sm text-zinc-300">Purpose<textarea required rows="4" className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" placeholder="What will the loan support?" /></label><button type="submit" className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-bold text-zinc-950">Submit request</button></form>}
    </section>
  );
}
