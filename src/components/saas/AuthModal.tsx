import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Mail,
  Lock,
  Phone,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Crown,
  LogOut,
  Calendar,
  Layers,
  FileText,
  Printer,
  Receipt
} from 'lucide-react';
import { useSaasStore } from '../../store/useSaasStore';
import { useAppStore } from '../../store/useAppStore';
import { getTenantInvoices } from '../../services/razorpay';
import type { SubscriptionInvoice } from '../../types/saas';
import { InvoiceViewModal } from './InvoiceViewModal';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    login,
    loginWithGoogle,
    register,
    logout,
    isLoading,
    currentUser,
    currentTenant,
    getDaysRemaining,
    setPaywallModalOpen
  } = useSaasStore();
  const { showToast, setSiteSelectorOpen } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firmName, setFirmName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);

  useEffect(() => {
    if (currentTenant) {
      setInvoices(getTenantInvoices(currentTenant.id));
    }
  }, [currentTenant, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
        // store closes modal + opens site selector automatically
        showToast('Logged in successfully!', 'success');
      } else {
        if (!firmName.trim()) {
          setErrorMsg('Please enter your Construction Firm / Company Name');
          return;
        }
        await register({
          firmName,
          email,
          password,
          phone,
          displayName: displayName || firmName
        });
        // store closes modal + opens site selector automatically
        showToast('Welcome! Your 4-Month Free Plan (1 Site) is active!', 'success');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      // store closes modal + opens site selector automatically
      showToast('Logged in with Google! 4-Month Free Plan active.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      showToast('Signed out successfully', 'info');
      setMode('login');
    } catch (err: any) {
      showToast(err.message || 'Failed to sign out', 'error');
    }
  };

  const daysLeft = getDaysRemaining();
  const isPro =
    currentTenant?.plan === 'pro' ||
    currentTenant?.plan === 'pro_monthly' ||
    currentTenant?.plan === 'pro_yearly';

  // If user is already logged in, show their Contractor Profile & Account Card
  if (currentUser) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-construction-600 via-amber-500 to-construction-500 p-5 text-charcoal-950 relative">
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-charcoal-950 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 text-[11px] font-black uppercase tracking-wider bg-black/15 px-2.5 py-1 rounded-full w-fit mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Contractor Account</span>
              </div>

              <div className="flex items-center space-x-3 mt-1">
                <div className="w-12 h-12 rounded-2xl bg-charcoal-950 text-construction-400 flex items-center justify-center font-black text-xl shadow-md border border-charcoal-800">
                  {(currentUser.displayName || currentUser.email || 'C')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-tight truncate">
                    {currentUser.displayName || 'Contractor'}
                  </h3>
                  <p className="text-xs font-bold text-charcoal-900 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Details Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Firm Info Card */}
              <div className="bg-charcoal-950/70 border border-charcoal-800 rounded-2xl p-4 space-y-2.5">
                <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                  Construction Firm
                </div>
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-charcoal-800 rounded-xl text-construction-400 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {currentTenant?.name || 'Company Name'}
                    </div>
                    {currentUser.phone && (
                      <div className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{currentUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription & Quota Card */}
              <div className="bg-charcoal-950/70 border border-charcoal-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                    Subscription Status
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isPro
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {isPro ? '👑 PRO Active' : '🎉 4-Month Free Plan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-charcoal-900 border border-charcoal-800/80 rounded-xl p-2.5">
                    <div className="text-charcoal-400 text-[10px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-construction-400" />
                      <span>Days Remaining</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">
                      {isPro ? 'Active' : `${daysLeft} Days`}
                    </div>
                  </div>

                  <div className="bg-charcoal-900 border border-charcoal-800/80 rounded-xl p-2.5">
                    <div className="text-charcoal-400 text-[10px] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-construction-400" />
                      <span>Allowed Sites</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-1">
                      {isPro ? 'Unlimited Sites' : '1 Active Site'}
                    </div>
                  </div>
                </div>

                {!isPro && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(false);
                      setPaywallModalOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-construction-500 to-amber-500 hover:from-construction-400 hover:to-amber-400 text-charcoal-950 font-black py-2.5 px-3 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-1.5 active:scale-95"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Upgrade to PRO (Unlimited Sites)</span>
                  </button>
                )}
              </div>

              {/* Invoices & Billing History */}
              <div className="bg-charcoal-950/70 border border-charcoal-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-charcoal-300 uppercase tracking-wider">
                      Tax Invoices &amp; Receipts ({invoices.length})
                    </span>
                  </div>
                  {isPro && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>GST Verified</span>
                    </span>
                  )}
                </div>

                {invoices.length === 0 ? (
                  <div className="text-center py-3 px-2 bg-charcoal-900/50 rounded-xl border border-charcoal-800 text-[11px] text-charcoal-400">
                    <p>No paid invoices yet.</p>
                    <p className="text-[10px] text-charcoal-500 mt-0.5">
                      Your GST tax invoices and receipts will automatically show here when you subscribe to Pro.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-2.5 flex items-center justify-between hover:border-amber-500/50 transition text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="truncate">{inv.invoiceNumber}</span>
                            <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                              PAID
                            </span>
                          </div>
                          <div className="text-[10px] text-charcoal-400 mt-0.5 flex items-center gap-2">
                            <span>{formatDate(new Date(inv.issuedAt).toISOString().split('T')[0])}</span>
                            <span>•</span>
                            <span>{inv.planName}</span>
                          </div>
                          <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                            {formatCurrency(inv.totalAmount)} (incl. 18% GST)
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition shrink-0 flex items-center gap-1 active:scale-95"
                          title="View / Print Tax Invoice"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions: Site Selector, Sign Out & Close */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(false);
                    setSiteSelectorOpen(true);
                  }}
                  className="w-full bg-construction-500/15 hover:bg-construction-500/25 border border-construction-500/40 text-construction-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 active:scale-95 shadow-sm"
                >
                  <Building2 className="w-4 h-4 text-construction-400" />
                  <span>Select / Switch Construction Site</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-100 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out / Switch Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="w-full bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice View & Print Modal */}
        {selectedInvoice && (
          <InvoiceViewModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </>
    );
  }

  // Otherwise, user is NOT logged in: Show the Login / Register Form
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Banner with 4-Month Free Offer */}
        <div className="bg-gradient-to-r from-construction-600 via-amber-500 to-construction-500 p-5 text-charcoal-950 relative">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider bg-black/15 px-2.5 py-1 rounded-full w-fit mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Offer</span>
          </div>

          <h3 className="text-xl font-extrabold leading-tight">
            Construction Khata <span className="underline decoration-charcoal-950/40">AI</span>
          </h3>
          <p className="text-xs font-bold text-charcoal-900 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1 Site Free for 4 Months (120 Days)</span>
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-charcoal-800 bg-charcoal-950/50">
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              mode === 'register'
                ? 'border-construction-500 text-construction-400'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            Create Contractor Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-3 text-xs font-bold transition border-b-2 ${
              mode === 'login'
                ? 'border-construction-500 text-construction-400'
                : 'border-transparent text-charcoal-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-100 text-charcoal-900 font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center space-x-2.5 active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-charcoal-800" />
            <span className="px-3 text-[10px] text-charcoal-500 uppercase tracking-wider font-bold">
              Or with Email
            </span>
            <div className="flex-1 border-t border-charcoal-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Construction Firm / Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sharma Builders & Contractors"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Your Name (Owner / Contractor)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Sharma"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Mobile Number (For WhatsApp Reports)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      placeholder="e.g. 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="contractor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-construction-500 to-amber-500 hover:from-construction-400 hover:to-amber-400 text-charcoal-950 font-black py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>
                {isLoading
                  ? 'Processing...'
                  : mode === 'register'
                  ? 'Start Free 4 Months (1 Site)'
                  : 'Sign In to My Khata'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
