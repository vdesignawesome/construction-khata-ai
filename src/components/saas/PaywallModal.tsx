import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  PhoneCall,
  MessageSquare,
  CreditCard,
  Zap,
  Lock
} from 'lucide-react';
import { useSaasStore } from '../../store/useSaasStore';
import { useAppStore } from '../../store/useAppStore';
import { processRazorpaySubscriptionPayment } from '../../services/razorpay';
import type { SubscriptionInvoice, SubscriptionPlan } from '../../types/saas';
import { InvoiceViewModal } from './InvoiceViewModal';
import { formatCurrency } from '../../utils/formatters';

export const PaywallModal: React.FC = () => {
  const { isPaywallModalOpen, setPaywallModalOpen, currentTenant, currentUser, updateTenantSubscription } = useSaasStore();
  const { showToast } = useAppStore();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<SubscriptionInvoice | null>(null);

  if (!isPaywallModalOpen) return null;

  const planPrice = selectedPlan === 'monthly' ? 399 : 2999;
  const durationMonths = selectedPlan === 'monthly' ? 1 : 12;
  const planType: SubscriptionPlan = selectedPlan === 'monthly' ? 'pro_monthly' : 'pro_yearly';

  const handleRazorpayCheckout = async () => {
    if (!currentTenant || !currentUser) {
      showToast('Please sign in first to upgrade.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      await processRazorpaySubscriptionPayment({
        tenant: currentTenant,
        user: currentUser,
        plan: planType,
        amount: planPrice,
        durationMonths,
        onSuccess: async (invoice) => {
          // Upgrade tenant in store & database
          await updateTenantSubscription(currentTenant.id, {
            plan: planType,
            status: 'active',
            maxAllowedSites: 999,
            trialEndDate: invoice.validUntil
          });

          showToast('🎉 Payment Successful! Unlimited Sites & Pro Features Unlocked!', 'success');
          setIsProcessing(false);
          setGeneratedInvoice(invoice);
        },
        onFailure: (errorMsg) => {
          setIsProcessing(false);
          showToast(errorMsg || 'Payment was not completed.', 'error');
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      showToast(err.message || 'Payment initiation failed', 'error');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="bg-charcoal-900 border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-500 via-construction-500 to-amber-600 p-6 text-charcoal-950 relative">
            <button
              onClick={() => setPaywallModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-charcoal-950 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 bg-black/15 px-3 py-1 rounded-full w-fit mb-3 text-xs font-black uppercase tracking-wider">
              <Crown className="w-4 h-4 text-charcoal-950" />
              <span>Pro Contractor Upgrade</span>
            </div>

            <h3 className="text-2xl font-black leading-tight">
              Unlock Unlimited Sites &amp; Growth
            </h3>
            <p className="text-xs font-bold text-charcoal-900 mt-1.5">
              Instant activation via <strong>Razorpay</strong> (UPI, Google Pay, PhonePe, Cards, NetBanking). Tax invoice generated automatically.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="p-5 sm:p-6 space-y-4">
            <div className="bg-charcoal-800/80 border border-charcoal-700/80 rounded-2xl p-4 space-y-2.5">
              <div className="text-[11px] font-black text-construction-400 uppercase tracking-wider">
                Included in Pro Contractor Plan:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-charcoal-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited Sites</strong> &amp; Projects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Device <strong>Cloud Sync</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>GST <strong>Tax Invoices</strong> with SAC 998314</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority WhatsApp / Phone Support</span>
                </div>
              </div>
            </div>

            {/* Plan Selector (Monthly vs Yearly) */}
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setSelectedPlan('monthly')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between ${
                  selectedPlan === 'monthly'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-charcoal-800 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase text-charcoal-400">Monthly Plan</div>
                  <div className="text-xl font-black text-white mt-1">₹399</div>
                  <div className="text-[10px] text-charcoal-400">Billed monthly</div>
                </div>
                <span className="text-[10px] text-amber-400 font-bold mt-2">Flexible • Cancel anytime</span>
              </div>

              <div
                onClick={() => setSelectedPlan('yearly')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition select-none flex flex-col justify-between relative overflow-hidden ${
                  selectedPlan === 'yearly'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                    : 'bg-charcoal-800 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
                }`}
              >
                <div className="absolute top-0 right-0 bg-emerald-500 text-charcoal-950 font-black text-[9px] px-2 py-0.5 rounded-bl-lg uppercase">
                  Save 38%
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-charcoal-400">Annual Plan</div>
                  <div className="text-xl font-black text-white mt-1">₹2,999</div>
                  <div className="text-[10px] text-emerald-400 font-bold">₹250/mo (Save ₹1,789)</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold mt-2">★ Most Popular Choice</span>
              </div>
            </div>

            {/* Razorpay CTA Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-construction-500 to-amber-400 hover:from-amber-400 hover:to-construction-300 text-charcoal-950 font-black text-sm transition shadow-xl active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isProcessing
                    ? 'Opening Razorpay Gateway...'
                    : `Pay ${formatCurrency(planPrice)} via Razorpay`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-3 text-[11px] text-charcoal-400 pt-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-Bit SSL Razorpay Secured</span>
                </span>
                <span>•</span>
                <span>Instant GST Invoice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal after successful payment */}
      {generatedInvoice && (
        <InvoiceViewModal
          invoice={generatedInvoice}
          onClose={() => {
            setGeneratedInvoice(null);
            setPaywallModalOpen(false);
          }}
        />
      )}
    </>
  );
};
