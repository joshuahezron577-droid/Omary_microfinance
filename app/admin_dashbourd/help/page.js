'use client';
import React, { useState } from 'react';
import {
  HiMail, HiPhone, HiCheckCircle, HiCurrencyDollar,
  HiUsers, HiDocumentText, HiChartBar, HiCog, HiShieldCheck
} from 'react-icons/hi';
import { HiChatBubbleLeftRight } from 'react-icons/hi2';

// ─── System guide steps ──────────────────────────────────────────────────────
const WORKFLOW = [
  {
    step: '01',
    title: 'Loan Requests — Kukagua Maombi',
    icon: HiDocumentText,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    desc: 'Wateja wanawasilisha maombi ya mikopo kupitia dashboard yao. Kama admin, unaweza kuona maombi yote kwenye ukurasa wa "Loan Requests" ukagawanywa katika tabs: Pending, Active, Rejected, Completed, na Yote.',
    tips: [
      'Nenda "Loan Requests" → chagua tab "Pending" kuona maombi mapya',
      'Bonyeza "Idhinisha" — mkopo unakuwa Active na due_date inawekwa kiotomatiki kulingana na muda (e.g. "3 Months" = leo + miezi 3)',
      'Bonyeza "Kataa" — ombi linahamia tab ya Rejected',
      'Kabla ya kuidhinisha: angalia ID Document (kitufe cha "View ID") na taarifa za Guarantor',
      'Ikiwa mkopo hauna ID Document, inaonyesha "No document uploaded" kwa rangi nyekundu',
    ],
  },
  {
    step: '02',
    title: 'Active Loans & Malipo — Kufuatilia Urejeshaji',
    icon: HiCurrencyDollar,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    desc: 'Ukurasa wa "Active Loans" unaonyesha mikopo yote iliyo hai (Active) na iliyokamilika (Completed). Kwa kila mkopo unaona: kiasi kilicholipwa, kilichobaki, maendeleo ya urejeshaji (progress bar), na tarehe ya malipo inayofuata.',
    tips: [
      'Pokea malipo ya mteja → weka kiasi kwenye input ya "TZS" → bonyeza "Thibitisha"',
      'Progress bar inabadilika rangi: nyekundu (<30%), manjano (30-60%), kijani (>60%)',
      'Mkopo unapofikia 100% unabadilika kuwa "Completed" kiotomatiki',
      'Tarehe ya malipo inasogea mbele kwa mwezi mmoja baada ya kila malipo',
      'Bonyeza "Maelezo" / "Ona Maelezo" kuona taarifa kamili za Guarantor na mteja',
      'Mkopo uliopita tarehe ya malipo unaonyesha badge ya "Imechelewa" (njano)',
    ],
  },
  {
    step: '03',
    title: 'Users Management — Kusimamia Wateja',
    icon: HiUsers,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    desc: 'Ukurasa huu unaonyesha wateja wote waliojisajili pamoja na takwimu zao. Juu unaona stat cards tatu: Total Registered (wote), Active Accounts (waliowahi kutumia mfumo), na With Active Loans (wanaolipa sasa).',
    tips: [
      'Tumia search box kupata mteja kwa jina, email, au username',
      'Bonyeza "View Loans" kuona historia yote ya mikopo ya mteja huyo',
      'Kitufe cha kufuta (trash icon) kinaonekana tu kama mteja hana mikopo inayoendelea',
      'Bonyeza "Print List" kupata ripoti ya PDF ya wateja wote — inajumuisha takwimu na jedwali',
      'Loans column kwenye print inaonyesha idadi ya mikopo na badges za active/pending',
    ],
  },
  {
    step: '04',
    title: 'Payment Logs — Kumbukumbu za Malipo',
    icon: HiChartBar,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
    desc: 'Rekodi kamili ya kila tukio kwenye mfumo — maombi ya mikopo, idhini, malipo yaliyothibitishwa, na mikopo iliyokamilika. Unaweza kutumia filters na search kupata tukio lolote.',
    tips: [
      'Filter kwa hali: ALL / REQUEST / APPROVED / REPAYMENT / COMPLETED / REJECTED',
      'Tafuta kwa jina la mteja au Log ID',
      'Kila rekodi inaonyesha: tarehe, mteja, kiasi, na hatua iliyofanyika',
      'Ukurasa huu ni read-only — haiwezi kubadilishwa',
      'Muhimu kwa audit na ufuatiliaji wa fedha',
    ],
  },
  {
    step: '05',
    title: 'System Settings — Mipangilio ya Mfumo',
    icon: HiCog,
    color: 'text-zinc-400',
    bg: 'bg-zinc-400/10 border-zinc-400/20',
    desc: 'Badilisha mipangilio mikuu ya mfumo wote. Mabadiliko yanafanya kazi mara moja kwa wateja wote wanaoingia baadaye.',
    tips: [
      'Maintenance Mode ON → ukurasa wa "Mfumo Umesimama" unaonekana kwa wateja wote wanaojaribu kuingia',
      'Allow Registration OFF → wateja wapya hawawezi kusajili — wanaona ujumbe wa kuzuia',
      'Max Loan Limit → ikiwa mteja anaomba zaidi ya kiasi hiki, fomu inakataa na kuonyesha onyo',
      'Default Interest Rate → riba hii inatumika kiotomatiki kwa kila ombi jipya la mkopo',
      'Mabadiliko yote yanasalimishwa kwenye database mara moja ukibonyeza "Save Settings"',
    ],
  },
];

export default function AdminHelpPage() {
  const [openStep, setOpenStep] = useState(null);

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-10 rounded-2xl shadow-xl max-w-6xl mx-auto text-white space-y-10">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <HiShieldCheck className="w-7 h-7 text-amber-400" />
          Admin Help & System Guide
        </h2>
        <div className="w-10 h-1 bg-amber-400 rounded-full mt-2 mb-2" />
        <p className="text-sm text-zinc-400">
          Mwongozo wa jinsi ya kutumia Omar Microfinance Admin Console — hatua kwa hatua.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: System Workflow Guide */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            System Workflow — Jinsi Mfumo Unavyofanya Kazi
          </h3>

          {WORKFLOW.map((item) => {
            const Icon = item.icon;
            const isOpen = openStep === item.step;

            return (
              <div
                key={item.step}
                className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition"
              >
                {/* Header — clickable */}
                <button
                  onClick={() => setOpenStep(isOpen ? null : item.step)}
                  className="w-full flex items-center justify-between p-5 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.bg}`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${item.color}`}>
                        Step {item.step}
                      </span>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                    </div>
                  </div>
                  <span className={`text-zinc-500 text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-3 border-t border-zinc-800">
                    <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{item.desc}</p>
                    <div className="space-y-1.5 pt-1">
                      {item.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                          <HiCheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${item.color}`} />
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Contact */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Wasiliana Nasi</h3>
            <div className="w-10 h-1 bg-amber-400 rounded-full" />
          </div>

          <div className="space-y-4 pt-2">

            {/* Email */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <HiMail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Us</p>
                <a href="mailto:joshuahezron577@gmail.com" className="text-sm font-bold text-white hover:text-amber-400 transition">
                  joshuahezron577@gmail.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <HiPhone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Call Us</p>
                <a href="tel:+255696408701" className="text-sm font-bold text-white hover:text-amber-400 transition">
                  0696408701
                </a>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex items-center gap-4 hover:border-zinc-700 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                <HiChatBubbleLeftRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">WhatsApp</p>
                <a href="https://wa.me/255773753292" target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-400 hover:underline transition">
                  0773753292
                </a>
              </div>
            </div>

          </div>

          {/* Quick Reference */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-500 space-y-3">
            <p className="text-white font-bold text-sm">Mtiririko wa Haraka</p>
            <div className="w-8 h-0.5 bg-amber-400 rounded-full" />
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">1.</span>
                <span className="text-zinc-300">Mteja anasajili → anaomba mkopo → unapata arifa kwenye Pending tab</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">2.</span>
                <span className="text-zinc-300">Kagua hati za ID na Guarantor → Idhinisha au Kataa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">3.</span>
                <span className="text-zinc-300">Mkopo unakuwa Active → tarehe ya malipo inawekwa kiotomatiki</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">4.</span>
                <span className="text-zinc-300">Mteja analipa → thibitisha malipo → progress bar inasogea</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">5.</span>
                <span className="text-zinc-300">Malipo 100% → mkopo unakuwa Completed kiotomatiki</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
