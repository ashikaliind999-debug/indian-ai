
import React, { useState } from 'react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'plan' | 'payment' | 'processing' | 'success';
type Method = 'gpay' | 'phonepe' | 'card';
type PlanType = 'monthly' | 'quarterly';

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<Step>('plan');
  const [method, setMethod] = useState<Method | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  if (!isOpen) return null;

  const handlePayment = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    setStep('plan');
  };

  const planPrice = selectedPlan === 'monthly' ? '$99' : '$249';
  const planName = selectedPlan === 'monthly' ? 'Monthly Vision' : '3-Month Vision Gold';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-orange-50 bg-gradient-to-b from-orange-50/50 to-transparent">
          {step !== 'success' && (
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-orange-100 rounded-full transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20 rotate-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L12 12l-7.714-2.143L11 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bharat Premium</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Unlock Unlimited Vision</p>
        </div>

        <div className="p-8">
          {step === 'plan' && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Choose Your Plan</label>
              
              {/* Monthly Plan */}
              <button 
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative ${selectedPlan === 'monthly' ? 'border-orange-500 bg-orange-50/30 shadow-md' : 'border-slate-100 hover:border-orange-200'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-black text-slate-800 text-sm">Monthly Plan</h3>
                  <span className="text-xl font-black text-slate-800">$99</span>
                </div>
                <p className="text-slate-500 text-[10px] font-bold">Billed every month</p>
                {selectedPlan === 'monthly' && (
                  <div className="absolute -right-2 -top-2 bg-orange-500 text-white p-1 rounded-full shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>

              {/* Quarterly Plan */}
              <button 
                onClick={() => setSelectedPlan('quarterly')}
                className={`w-full p-5 rounded-2xl border-2 transition-all text-left relative ${selectedPlan === 'quarterly' ? 'border-orange-500 bg-orange-50/30 shadow-md' : 'border-slate-100 hover:border-orange-200'}`}
              >
                <div className="absolute -top-3 right-4 bg-green-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-md">BEST VALUE SAVES $48</div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-black text-slate-800 text-sm">3-Month Vision Gold</h3>
                  <span className="text-xl font-black text-slate-800">$249</span>
                </div>
                <p className="text-slate-500 text-[10px] font-bold">Unlimited access for 90 days</p>
                {selectedPlan === 'quarterly' && (
                  <div className="absolute -right-2 -top-2 bg-orange-500 text-white p-1 rounded-full shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </button>

              <div className="pt-4 space-y-3">
                <ul className="space-y-2">
                  {['Unlimited 10s 3D Videos', 'Unlimited AI Art Generations', 'No Daily Quota Limits'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                      <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all active:scale-[0.98]"
                >
                  PROCEED TO PAYMENT
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Plan</p>
                  <p className="text-sm font-black text-slate-800">{planName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</p>
                  <p className="text-lg font-black text-orange-600">{planPrice}</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Select Payment Method</label>
                
                {/* GPay */}
                <button 
                  onClick={() => setMethod('gpay')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${method === 'gpay' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-orange-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-blue-600">G</div>
                    <span className="text-sm font-black text-slate-800">Google Pay</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'gpay' ? 'border-blue-500' : 'border-slate-200'}`}>
                    {method === 'gpay' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                  </div>
                </button>

                {/* PhonePe */}
                <button 
                  onClick={() => setMethod('phonepe')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${method === 'phonepe' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-100 hover:border-orange-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center font-black text-purple-600">P</div>
                    <span className="text-sm font-black text-slate-800">PhonePe / UPI</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'phonepe' ? 'border-purple-500' : 'border-slate-200'}`}>
                    {method === 'phonepe' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                  </div>
                </button>

                {/* Card */}
                <button 
                  onClick={() => setMethod('card')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${method === 'card' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 hover:border-orange-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                       <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    </div>
                    <span className="text-sm font-black text-slate-800">Credit / Debit Card</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === 'card' ? 'border-indigo-500' : 'border-slate-200'}`}>
                    {method === 'card' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep('plan')}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                >
                  BACK
                </button>
                <button 
                  disabled={!method}
                  onClick={handlePayment}
                  className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  PAY {planPrice} NOW
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Securing Payment...</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">Please do not close the app. We are communicating with your bank securely.</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-8 animate-in zoom-in-90 duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 mb-2">Jai Hind!</h3>
                <p className="text-slate-500 text-sm font-bold">Your {selectedPlan === 'monthly' ? 'Monthly' : '3-Month'} Bharat Premium is now ACTIVE.</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</span>
                  <span className="text-xs font-mono font-bold text-slate-700">BHARAT-{Math.floor(Math.random() * 999999)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="text-xs font-black text-green-600">PAID & ACTIVE</span>
                </div>
              </div>
              <button 
                onClick={handleFinish}
                className="w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-orange-500/30 hover:scale-[1.02] transition-all active:scale-[0.98]"
              >
                START CREATING UNLIMITED
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
