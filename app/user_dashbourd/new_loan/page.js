'use client';
'use client';
import React, { useState, useEffect } from 'react';
import { 
  HiCreditCard, HiUpload, HiOfficeBuilding, 
  HiCash, HiArrowRight, HiArrowLeft, HiDocumentText, 
  HiLockClosed, HiCheckCircle, HiX 
} from 'react-icons/hi';
import { supabase } from '@/lib/superbase';

export default function RequestLoan({ userId, onSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isPesapalModalOpen, setIsPesapalModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');

  // Settings kutoka DB
  const [maxLoanLimit, setMaxLoanLimit]         = useState(10000000); // default fallback
  const [interestRatePercentage, setInterestRate] = useState(30);     // default fallback
  const [settingsLoaded, setSettingsLoaded]       = useState(false);

  // Fetch system settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['max_loan_limit', 'default_interest']);

      if (data) {
        data.forEach(row => {
          if (row.key === 'max_loan_limit')  setMaxLoanLimit(Number(row.value) || 10000000);
          if (row.key === 'default_interest') setInterestRate(Number(row.value) || 30);
        });
      }
      setSettingsLoaded(true);
    };
    fetchSettings();
  }, []);

  // Form State
  const initialFormState = {
    occupation: '',
    workplace: '',
    loanAmount: '',
    repaymentPeriod: '',
    reason: '',
    idDocument: null,
    guarantorName: '',
    guarantorRelationship: '',
    guarantorPhone: '',
    guarantorEmail: '',
    guarantorNid: '',
    guarantorAddress: '',
    guarantorOccupation: '',
    guarantorWorkplace: '',
    bankName: '',
    accountNumber: '',
    branch: '',
    swiftCode: '',
    accountHolderName: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const principal = parseFloat(formData.loanAmount) || 0;
  const interestAmount = (principal * interestRatePercentage) / 100;
  const totalPayable = principal + interestAmount;

  const nextStep = (e) => {
    e.preventDefault();
    // Angalia max loan limit kwenye step 1
    if (step === 1 && principal > maxLoanLimit) {
      alert(`Loan amount exceeds the maximum limit of TZS ${maxLoanLimit.toLocaleString('en-TZ')}. Please enter a lower amount.`);
      return;
    }
    if (step === 1 && principal <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleOpenPaymentModal = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert("Please read and agree to the Terms & Conditions before proceeding.");
      return;
    }
    setIsPesapalModalOpen(true);
  };

  const handlePesapalCheckoutConfirm = async () => {
    if (!selectedMethod) {
      alert("Tafadhali chagua mtandao wa malipo kwanza (M-Pesa, Tigo Pesa, Airtel Money, au Cards).");
      return;
    }

    setLoading(true);

    try {
      // 1. Pata user — tumia userId kutoka prop au getUser() kama fallback
      let uid = userId;
      if (!uid) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        uid = authUser?.id;
      }

      if (!uid) {
        alert("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const user = { id: uid };

      // 2. Upload ID document kwenye Supabase Storage
      let id_document_url = null;
      if (formData.idDocument) {
        const fileExt  = formData.idDocument.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('Loans_document')
          .upload(filePath, formData.idDocument, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw new Error(`ID upload failed: ${uploadError.message}`);

        const { data: urlData } = await supabase.storage
          .from('Loans_document')
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);

        id_document_url = urlData?.signedUrl || filePath;
      }

      // 3. Tuma data ya mkopo kwenda Supabase
      const { data: loanData, error: insertError } = await supabase.from('loans').insert([
        {
          user_id: user.id,
          amount: parseFloat(formData.loanAmount),
          interest_rate: interestRatePercentage,
          status: 'pending',
          type: 'DISBURSEMENT',
          purpose: formData.reason,
          duration: formData.repaymentPeriod,
          payment_provider: formData.bankName || selectedMethod,
          account_number: formData.accountNumber,
          id_document_url,
          description: `Occupation: ${formData.occupation} | Workplace: ${formData.workplace} | Guarantor: ${formData.guarantorName} (${formData.guarantorPhone})`,
        }
      ]).select('id').single();

      if (insertError) throw insertError;

      // 3. Hifadhi guarantor kwenye guarantors table
      if (loanData?.id) {
        const { error: guarantorError } = await supabase.from('guarantors').insert([
          {
            loan_id:          loanData.id,
            user_id:          user.id,
            full_name:        formData.guarantorName,
            relationship:     formData.guarantorRelationship,
            phone_no:         `+255${formData.guarantorPhone}`,
            email:            formData.guarantorEmail,
            national_id:      formData.guarantorNid,
            physical_address: formData.guarantorAddress,
            occupation:       formData.guarantorOccupation,
            workplace:        formData.guarantorWorkplace,
          }
        ]);
        // Guarantor error si critical — loan imewasilishwa tayari
        if (guarantorError) console.warn('Guarantor save failed:', guarantorError.message);
      }

      // 4. Mafanikio — reset fomu
      setIsPesapalModalOpen(false);
      alert(`Loan application submitted successfully! You will be notified after admin review.`);
      setFormData(initialFormState);
      setStep(1);
      setAgreed(false);
      setSelectedMethod('');
      if (onSuccess) onSuccess();

    } catch (err) {
      alert(`Hitilafu wakati wa kuwasilisha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl max-w-4xl mx-auto text-white relative">
      
      {/* HEADER TITLE */}
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-bold tracking-wide flex items-center text-amber-400">
          <HiCreditCard className="w-6 h-6 mr-2" /> Request New Loan & Disbursement Setup
        </h2>
        <p className="text-xs text-zinc-400 mt-1">Complete all steps sequentially to process your application securely.</p>
      </div>

      {/* STEP TABS HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8 overflow-x-auto pb-2">
        {['Loan Details', 'Guarantor', 'Bank Info', 'Attachments', 'Agree & Pay'].map((title, idx) => {
          const currentStep = idx + 1;
          const isActive = step === currentStep;
          return (
            <div key={title} className={`p-3 rounded-xl border flex flex-col justify-center transition-all ${
              isActive ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
            }`}>
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                }`}>{currentStep}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM CONTENT ACCORDING TO CURRENT STEP */}
      {step === 1 && (
        <form onSubmit={nextStep} className="space-y-6">
          <div className="border border-zinc-800 p-6 rounded-2xl bg-zinc-900/30 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-3">
              1. Loan Specifications & Purpose
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Occupation *</label>
                <input 
                  type="text" 
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleChange}
                  placeholder="e.g. Teacher" 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Workplace *</label>
                <input 
                  type="text" 
                  name="workplace"
                  value={formData.workplace}
                  onChange={handleChange}
                  placeholder="e.g. ABC Company" 
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Loan Amount (TZS) *</label>
                <input 
                  type="number" 
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  placeholder="e.g. 500000" 
                  required
                  max={maxLoanLimit}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
                <p className="text-[10px] text-zinc-600 mt-1">
                  Max: TZS {maxLoanLimit.toLocaleString('en-TZ')}
                  {principal > maxLoanLimit && (
                    <span className="text-rose-400 ml-2">⚠ Exceeds limit</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Repayment Period *</label>
                <select 
                  name="repaymentPeriod"
                  value={formData.repaymentPeriod}
                  onChange={handleChange}
                  required 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-zinc-300"
                >
                  <option value="">Select Period</option>
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                </select>
              </div>
            </div>

            {principal > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Principal Amount</p>
                  <p className="text-sm font-bold text-white">TZS {principal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Interest ({interestRatePercentage}%)</p>
                  <p className="text-sm font-bold text-amber-400">TZS {interestAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Payable</p>
                  <p className="text-sm font-bold text-emerald-400">TZS {totalPayable.toLocaleString()}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Reason for Loan *</label>
              <textarea 
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="4" 
                placeholder="Briefly explain what the loan will be used for..." 
                required 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer transition"
            >
              <span>Next: Guarantor Info</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={nextStep} className="space-y-6">
          <div className="border border-zinc-800 p-6 rounded-2xl bg-zinc-900/30 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-3">
              2. Guarantor Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Guarantor Full Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Guarantor Full Name</label>
                <input
                  type="text"
                  name="guarantorName"
                  value={formData.guarantorName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, guarantorName: val }));
                  }}
                  placeholder="Full Name"
                  required
                  pattern="[A-Za-z\s]+"
                  title="Name must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Relationship</label>
                <input
                  type="text"
                  name="guarantorRelationship"
                  value={formData.guarantorRelationship}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, guarantorRelationship: val }));
                  }}
                  placeholder="e.g. Brother / Colleague"
                  required
                  pattern="[A-Za-z\s/]+"
                  title="Relationship must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              {/* Phone Number — prefix +255 */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 text-zinc-400 text-xs font-semibold select-none">
                    +255
                  </span>
                  <input
                    type="tel"
                    name="guarantorPhone"
                    value={formData.guarantorPhone}
                    onChange={(e) => {
                      // Ruhusu digits 9 tu
                      const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setFormData(prev => ({ ...prev, guarantorPhone: val }));
                    }}
                    placeholder="712345678"
                    required
                    maxLength={9}
                    minLength={9}
                    pattern="\d{9}"
                    title="Enter 9 digits after +255"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-r-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">Enter 9 digits e.g. 712345678</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  name="guarantorEmail"
                  value={formData.guarantorEmail}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              {/* National ID — exactly 20 digits */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">National ID Number</label>
                <input
                  type="text"
                  name="guarantorNid"
                  value={formData.guarantorNid}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 20);
                    setFormData(prev => ({ ...prev, guarantorNid: val }));
                  }}
                  placeholder="20-digit National ID"
                  required
                  maxLength={20}
                  minLength={20}
                  pattern="\d{20}"
                  title="National ID must be exactly 20 digits"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white font-mono tracking-widest"
                />
                <p className="text-[10px] mt-1">
                  {formData.guarantorNid.length < 20
                    ? <span className="text-amber-400/70">{formData.guarantorNid.length}/20 digits</span>
                    : <span className="text-emerald-400">✓ 20/20 digits</span>
                  }
                </p>
              </div>

              {/* Physical Address — letters only */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Physical Home Address</label>
                <input
                  type="text"
                  name="guarantorAddress"
                  value={formData.guarantorAddress}
                  onChange={(e) => {
                    // Zuia nambari
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, guarantorAddress: val }));
                  }}
                  placeholder="e.g. Masaki, Dar es Salaam"
                  required
                  pattern="[A-Za-z\s,.]+"
                  title="Address must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              {/* Occupation — letters only */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Occupation</label>
                <input
                  type="text"
                  name="guarantorOccupation"
                  value={formData.guarantorOccupation}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, guarantorOccupation: val }));
                  }}
                  placeholder="e.g. Teacher"
                  required
                  pattern="[A-Za-z\s]+"
                  title="Occupation must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              {/* Workplace — letters only */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Workplace</label>
                <input
                  type="text"
                  name="guarantorWorkplace"
                  value={formData.guarantorWorkplace}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, guarantorWorkplace: val }));
                  }}
                  placeholder="e.g. TRA"
                  required
                  pattern="[A-Za-z\s]+"
                  title="Workplace must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <HiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <span>Next: Bank Info</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={nextStep} className="space-y-6">
          <div className="border border-zinc-800 p-6 rounded-2xl bg-zinc-900/30 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center">
              <HiOfficeBuilding className="w-4 h-4 mr-2 text-amber-400" /> 3. Bank Information (For Disbursement)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, bankName: val }));
                  }}
                  placeholder="e.g. CRDB Bank / NMB"
                  required
                  pattern="[A-Za-z\s/&.]+"
                  title="Bank name must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setFormData(prev => ({ ...prev, accountNumber: val }));
                  }}
                  placeholder="11-digit account number"
                  required
                  maxLength={11}
                  minLength={11}
                  pattern="\d{11}"
                  title="Account number must be exactly 11 digits"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white font-mono tracking-widest"
                />
                <p className="text-[10px] mt-1">
                  {formData.accountNumber.length < 11
                    ? <span className="text-amber-400/70">{formData.accountNumber.length}/11 digits</span>
                    : <span className="text-emerald-400">✓ 11/11 digits</span>
                  }
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Branch</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, branch: val }));
                  }}
                  placeholder="e.g. Dunga Branch"
                  required
                  pattern="[A-Za-z\s]+"
                  title="Branch must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Swift Code</label>
                <input
                  type="text"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '').toUpperCase();
                    setFormData(prev => ({ ...prev, swiftCode: val }));
                  }}
                  placeholder="e.g. NMIBTZ"
                  required
                  pattern="[A-Za-z]+"
                  title="Swift code must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-2">Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[0-9]/g, '');
                    setFormData(prev => ({ ...prev, accountHolderName: val }));
                  }}
                  placeholder="Name as it appears on bank account"
                  required
                  pattern="[A-Za-z\s]+"
                  title="Account holder name must contain letters only"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <HiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <span>Next: Attachments</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 4 && (
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!formData.idDocument) {
            alert('Please upload your ID document before proceeding.');
            return;
          }
          setStep(prev => prev + 1);
        }} className="space-y-6">
          <div className="border border-zinc-800 p-6 rounded-2xl bg-zinc-900/30 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center">
              <HiDocumentText className="w-4 h-4 mr-2 text-amber-400" /> 4. Required Attachments
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">
                Upload National ID / NIDA, Voter ID, or Passport
              </label>
              <p className="text-[11px] text-zinc-500 mb-3">
                Upload a valid government-issued ID (NIDA, Voter ID, Driving License, or Passport).
              </p>

              {/* Allowed formats notice */}
              <div className="flex items-center gap-3 mb-4">
                {['JPG', 'PNG', 'PDF'].map(fmt => (
                  <span key={fmt} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-amber-400">
                    {fmt}
                  </span>
                ))}
                <span className="text-[10px] text-zinc-600">Max size: 2MB</span>
              </div>

              {/* Drop zone */}
              <label
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  formData.idDocument
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-center justify-center px-4 text-center">
                  {formData.idDocument ? (
                    <>
                      {/* Preview */}
                      {formData.idDocument.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(formData.idDocument)}
                          alt="ID preview"
                          className="h-16 w-auto object-contain rounded-lg mb-2 border border-zinc-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
                          <HiDocumentText className="w-6 h-6 text-amber-400" />
                        </div>
                      )}
                      <p className="text-xs text-emerald-400 font-semibold">{formData.idDocument.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {(formData.idDocument.size / 1024 / 1024).toFixed(2)} MB — Click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <HiUpload className="w-8 h-8 mb-2 text-amber-400" />
                      <p className="text-xs text-zinc-300 font-semibold">Click to upload or drag & drop</p>
                      <p className="text-[10px] text-zinc-500 mt-1">JPG, PNG or PDF — max 2MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  name="idDocument"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Validate type
                    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
                    if (!allowed.includes(file.type)) {
                      alert('Invalid file type. Please upload JPG, PNG, or PDF only.');
                      e.target.value = '';
                      return;
                    }

                    // Validate size — 2MB
                    if (file.size > 2 * 1024 * 1024) {
                      alert(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 2MB.`);
                      e.target.value = '';
                      return;
                    }

                    setFormData(prev => ({ ...prev, idDocument: file }));
                  }}
                  className="hidden"
                />
              </label>

              {/* Remove file button */}
              {formData.idDocument && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, idDocument: null }))}
                  className="mt-2 text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  ✕ Remove file
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <HiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <span>Next: Agree & Pay</span>
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {step === 5 && (
        <form onSubmit={handleOpenPaymentModal} className="space-y-6">
          <div className="border border-zinc-800 p-6 rounded-2xl bg-zinc-900/30 space-y-6">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider border-b border-zinc-800 pb-3 flex items-center">
              <HiCash className="w-4 h-4 mr-2 text-amber-400" /> 5. Terms, Conditions & Payment
            </h3>

            {/* Terms Box */}
            <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl text-zinc-400 text-xs space-y-3 max-h-48 overflow-y-auto pr-2">
              <p>1. <strong>Disbursement Accuracy:</strong> The bank details provided must match the applicant's official legal identity. MicroPrestige will not be held liable for misrouted funds due to incorrect bank numbers.</p>
              <p>2. <strong>Non-Refundable Processing Fee:</strong> A processing fee of TSH 5,000 is required via PesaPal to initiate the verification process and is strictly non-refundable.</p>
              <p>3. <strong>Guarantor Liability:</strong> The designated guarantor will be contacted and must acknowledge their legal responsibility.</p>
              <p>4. <strong>Repayment & Penalties:</strong> Failure to repay the loan within the stipulated duration will incur a 5% daily penalty on the outstanding principal.</p>
            </div>

            {/* Checkbox Agreement */}
            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-0 cursor-pointer" 
              />
              <label htmlFor="terms" className="text-xs text-zinc-300 cursor-pointer">
                I agree to the terms and conditions outlined above. *
              </label>
            </div>

            {/* Bottom Grid: Fee Info & Pay Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-800/80 gap-4">
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Processing Fee</p>
                <p className="text-lg font-bold text-white">TSH 5,000</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <HiCreditCard className="w-5 h-5 text-white" />
                <span>Pay with PesaPal (TSH 5,000)</span>
              </button>
            </div>
          </div>

          <div className="flex justify-start">
            <button type="button" onClick={() => prevStep()} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 cursor-pointer">
              <HiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </form>
      )}

      {/* PESAPAL PAYMENT MODAL */}
      {isPesapalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl max-w-lg w-full p-6 md:p-8 text-zinc-300 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsPesapalModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 p-2 rounded-full transition cursor-pointer"
            >
              <HiX className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
                P
              </div>
              <div>
                <h3 className="text-base font-bold text-white">PesaPal Secure Checkout</h3>
                <p className="text-xs text-zinc-500">Mobile Money & Cards (Tanzania)</p>
              </div>
            </div>

            {/* Payment Details Box */}
            <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Transaction Type:</span>
                <span className="text-white font-medium">Loan Verification Fee</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Gateway Provider:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  PesaPal <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                </span>
              </div>
              <div className="border-t border-zinc-800 pt-2 flex justify-between items-center text-sm font-bold text-white">
                <span>Total Amount:</span>
                <span className="text-amber-400">TSH 5,000</span>
              </div>
            </div>

            {/* Clickable Payment Methods */}
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Chagua Mtandao wa Malipo / Njia <span className="text-amber-400">*</span>:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Cards'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`py-2.5 px-3 rounded-xl border font-medium transition cursor-pointer text-center ${
                      selectedMethod === method
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* KAMA AMECHAGUA MITANDAO YA SIMU */}
            {['M-Pesa', 'Tigo Pesa', 'Airtel Money'].includes(selectedMethod) && (
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-3 animate-in fade-in">
                <label className="block text-xs font-semibold text-zinc-300 uppercase">
                  Weka Namba ya Simu ya {selectedMethod} *
                </label>
                <input
                  type="tel"
                  placeholder="Mfano: 0712345678 au 0762123456"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 text-white"
                  required
                />
                <p className="text-[11px] text-amber-400/90">
                  Ukibonyeza kulipa, utapokea ujumbe (USSD Prompt) kwenye simu yako kuweka namba ya siri (PIN).
                </p>
              </div>
            )}

            {/* KAMA AMECHAGUA KADI */}
            {selectedMethod === 'Cards' && (
              <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl space-y-3 animate-in fade-in text-xs">
                <div>
                  <label className="block font-semibold text-zinc-300 uppercase mb-1">Namba ya Kadi (Card Number) *</label>
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8932"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-300 uppercase mb-1">Tarehe ya Kuisha (MM/YY) *</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-300 uppercase mb-1">CVV (Namba za Nyuma) *</label>
                    <input
                      type="password"
                      maxLength="4"
                      placeholder="123"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white font-mono"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-400/90">
                  Malipo ya kadi yataleta dirisha dogo la uthibitisho (3D Secure OTP) kutoka bank yako.
                </p>
              </div>
            )}

            {/* Security Trust Badge */}
            <div className="flex items-center space-x-2 text-[11px] text-zinc-500 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
              <HiLockClosed className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>PCI-DSS compliant secure checkout powered by PesaPal.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => setIsPesapalModalOpen(false)}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold py-3 px-4 rounded-xl border border-zinc-800 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handlePesapalCheckoutConfirm}
                disabled={loading}
                className="flex-1 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-3 px-4 rounded-xl transition shadow-lg text-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Inachakata...</span>
                  </span>
                ) : (
                  <>
                    <HiCheckCircle className="w-4 h-4" />
                    <span>Lipa TSH 5,000 Sasa</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}