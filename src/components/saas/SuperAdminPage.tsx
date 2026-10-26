import React, { useState, useEffect } from 'react';
import {
  Crown,
  Users,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  Settings,
  Database,
  Save,
  Check,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  Trash2,
  Lock,
  LogOut,
  Edit,
  DollarSign,
  TrendingUp,
  X,
  CreditCard,
  FileText,
  Printer,
  Receipt
} from 'lucide-react';
import { useSaasStore } from '../../store/useSaasStore';
import { useAppStore } from '../../store/useAppStore';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  initFirebaseService,
  subscribeToSaaSTenants
} from '../../services/firebase';
import {
  getAllInvoices,
  getRazorpayConfig,
  saveRazorpayConfig
} from '../../services/razorpay';
import type {
  FirebaseConfig,
  SaasTenant,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionInvoice,
  RazorpayConfig
} from '../../types/saas';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { InvoiceViewModal } from './InvoiceViewModal';

interface SuperAdminPageProps {
  onBack: () => void;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ onBack }) => {
  const {
    allTenants,
    refreshTenants,
    grantProPlan,
    extendTrialDays,
    toggleTenantStatus,
    deleteTenant,
    updateTenantSubscription
  } = useSaasStore();
  const { showToast } = useAppStore();

  // Authentication gate for Super Admin
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('saas_super_admin_auth') === 'true';
  });
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Admin View State
  const [activeTab, setActiveTab] = useState<'customers' | 'plans' | 'transactions' | 'firebase'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free_trial' | 'pro' | 'enterprise'>('all');

  // Transactions & Invoices State
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<SubscriptionInvoice | null>(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Razorpay Config State
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig>(getRazorpayConfig());

  // Edit Subscription Modal
  const [editingTenant, setEditingTenant] = useState<SaasTenant | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>('free_trial');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('active');
  const [editAllowedSites, setEditAllowedSites] = useState<number>(1);
  const [editTrialDaysAdd, setEditTrialDaysAdd] = useState<number>(0);
  const [isSavingSubscription, setIsSavingSubscription] = useState(false);

  // Firebase Config State
  const [fbConfig, setFbConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });
  const [isFirebaseLive, setIsFirebaseLive] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      refreshTenants();
      const unsub = subscribeToSaaSTenants((liveTenants) => {
        useSaasStore.setState({ allTenants: liveTenants });
      });
      setInvoices(getAllInvoices());
      setRazorpayConfig(getRazorpayConfig());
      const cfg = getSavedFirebaseConfig();
      if (cfg) setFbConfig(cfg);
      const { isLive } = initFirebaseService();
      setIsFirebaseLive(isLive);
      return () => unsub();
    }
  }, [isAuthenticated, activeTab]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master admin passcodes
    if (adminPasscode.trim() === 'admin' || adminPasscode.trim() === 'admin123' || adminPasscode.trim() === 'superadmin') {
      sessionStorage.setItem('saas_super_admin_auth', 'true');
      setIsAuthenticated(true);
      setPasscodeError('');
      showToast('Welcome to Super Admin Control Panel!', 'success');
    } else {
      setPasscodeError('Invalid Admin Passcode. Default passcode is "admin" or "admin123".');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('saas_super_admin_auth');
    setIsAuthenticated(false);
    setAdminPasscode('');
  };

  const openEditModal = (t: SaasTenant) => {
    setEditingTenant(t);
    setEditPlan(t.plan);
    setEditStatus(t.status);
    setEditAllowedSites(t.maxAllowedSites);
    setEditTrialDaysAdd(0);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSavingSubscription(true);

    try {
      let newTrialEnd = editingTenant.trialEndDate;
      if (editTrialDaysAdd > 0) {
        const base = Math.max(Date.now(), editingTenant.trialEndDate);
        newTrialEnd = base + editTrialDaysAdd * 24 * 60 * 60 * 1000;
      }

      await updateTenantSubscription(editingTenant.id, {
        plan: editPlan,
        status: editStatus,
        maxAllowedSites: editPlan === 'free_trial' ? editAllowedSites : Math.max(editAllowedSites, 999),
        trialEndDate: newTrialEnd
      });

      showToast(`Updated subscription for "${editingTenant.name}"!`, 'success');
      setEditingTenant(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update subscription', 'error');
    } finally {
      setIsSavingSubscription(false);
    }
  };

  const handleDeleteCompany = async (tenantId: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to permanently delete company "${companyName}"? This action cannot be undone.`)) {
      await deleteTenant(tenantId);
      showToast(`Company "${companyName}" has been deleted.`, 'info');
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    const { isLive } = initFirebaseService();
    setIsFirebaseLive(isLive);
    showToast('Firebase configuration saved successfully!', 'success');
  };

  const handleSaveRazorpayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveRazorpayConfig(razorpayConfig);
    showToast('Razorpay credentials updated successfully!', 'success');
  };

  // Transaction & Revenue Metrics
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalBaseRevenue = invoices.reduce((acc, inv) => acc + (inv.baseAmount || 0), 0);
  const totalGstCollected = invoices.reduce((acc, inv) => acc + (inv.gstAmount || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const q = invoiceSearch.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.tenantName.toLowerCase().includes(q) ||
      inv.userEmail.toLowerCase().includes(q) ||
      (inv.razorpayPaymentId && inv.razorpayPaymentId.toLowerCase().includes(q))
    );
  });

  // Filtered Clients
  const filteredTenants = allTenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.ownerPhone && t.ownerPhone.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPlan =
      planFilter === 'all' ||
      (planFilter === 'pro'
        ? t.plan === 'pro' || t.plan === 'pro_monthly' || t.plan === 'pro_yearly'
        : t.plan === planFilter);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Analytics Metrics
  const totalTenants = allTenants.length;
  const activeTenants = allTenants.filter((t) => t.status === 'active').length;
  const suspendedTenants = allTenants.filter((t) => t.status === 'suspended').length;
  const proTenants = allTenants.filter((t) => t.plan === 'pro' || t.plan === 'pro_monthly' || t.plan === 'pro_yearly').length;
  const trialTenants = allTenants.filter((t) => t.plan === 'free_trial').length;
  const estimatedMRR = proTenants * 250;

  // Last Login Activity Formatter
  const formatLastLogin = (timestamp?: number) => {
    if (!timestamp) return { text: 'Never logged in', timeAgo: '', badgeColor: 'text-charcoal-500', isOnline: false };
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    const dateObj = new Date(timestamp);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffMins < 2) {
      return { text: 'Active Just Now', timeAgo: '🟢 Currently Active', badgeColor: 'text-emerald-400 font-black', isOnline: true };
    } else if (diffMins < 60) {
      return { text: `${diffMins}m ago`, timeAgo: `Today at ${timeStr}`, badgeColor: 'text-emerald-400', isOnline: true };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h ago`, timeAgo: `Today at ${timeStr}`, badgeColor: 'text-emerald-300', isOnline: true };
    } else if (diffDays === 1) {
      return { text: 'Yesterday', timeAgo: timeStr, badgeColor: 'text-amber-400', isOnline: false };
    } else if (diffDays < 7) {
      return { text: `${diffDays}d ago`, timeAgo: formatDate(dateObj.toISOString().split('T')[0]), badgeColor: 'text-charcoal-300', isOnline: false };
    } else {
      return { text: formatDate(dateObj.toISOString().split('T')[0]), timeAgo: timeStr, badgeColor: 'text-charcoal-400', isOnline: false };
    }
  };

  // 1. Passcode Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-construction-400 text-charcoal-950 flex items-center justify-center shadow-lg font-black mx-auto">
              <Crown className="w-7 h-7" />
            </div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Construction Khata AI
            </h2>
            <p className="text-xs text-charcoal-400 max-w-xs mx-auto">
              Private platform owner control panel. Please enter your administrator passcode to proceed.
            </p>
          </div>

          {passcodeError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passcodeError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1">
                Admin Passcode / Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter passcode (default: admin)"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[11px] text-charcoal-500 mt-1">
                Hint: Default master passcode is <code className="text-amber-400 font-bold">admin</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-construction-400 hover:from-amber-400 hover:to-construction-300 text-charcoal-950 font-black py-3 rounded-xl text-xs sm:text-sm shadow-lg transition active:scale-95"
            >
              Access Admin Panel
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onBack}
              className="text-xs text-charcoal-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Contractor App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full Super Admin Dashboard
  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Header Bar */}
      <header className="bg-charcoal-900 border-b border-charcoal-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-xs text-charcoal-300 hover:text-white border border-charcoal-700 transition font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-construction-400 text-charcoal-950 flex items-center justify-center shadow-lg font-black shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Super Admin Portal</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                SaaS Client &amp; Subscription Control Center
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => refreshTenants()}
            className="p-2 text-charcoal-400 hover:text-white rounded-xl hover:bg-charcoal-800 transition border border-charcoal-700"
            title="Refresh Clients"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleAdminLogout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-bold transition"
            title="Lock & Exit Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Admin</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-charcoal-800 bg-charcoal-900/60 rounded-xl p-1 w-fit text-xs font-bold">
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-4 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-charcoal-950 shadow font-black'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Clients ({totalTenants})</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-4 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'plans'
                ? 'bg-amber-500 text-charcoal-950 shadow font-black'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Subscription Models &amp; Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 px-4 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-charcoal-950 shadow font-black'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoices &amp; Payments ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-2 px-4 rounded-lg transition flex items-center space-x-2 ${
              activeTab === 'firebase'
                ? 'bg-amber-500 text-charcoal-950 shadow font-black'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Gateway &amp; Cloud Sync</span>
            {isFirebaseLive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: CLIENTS & CONTRACTORS */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* SaaS Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-charcoal-400 font-semibold uppercase tracking-wider">
                  Total Clients
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">{totalTenants}</div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Contractor companies</div>
              </div>

              <div className="bg-charcoal-900 border border-emerald-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Active Clients
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{activeTenants}</div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Allowed app access</div>
              </div>

              <div className="bg-charcoal-900 border border-red-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-red-400 font-semibold uppercase tracking-wider">
                  Suspended Clients
                </div>
                <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1">{suspendedTenants}</div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Deactivated by admin</div>
              </div>

              <div className="bg-charcoal-900 border border-amber-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                  Pro Subscribers
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{proTenants}</div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Est. MRR: {formatCurrency(estimatedMRR)}</div>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search contractor by firm name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>

                <select
                  value={planFilter}
                  onChange={(e: any) => setPlanFilter(e.target.value)}
                  className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="all">All Plans</option>
                  <option value="free_trial">Free Trial</option>
                  <option value="pro">Pro Plan</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="border border-charcoal-800 rounded-2xl overflow-hidden bg-charcoal-900 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-charcoal-300">
                  <thead className="bg-charcoal-950 border-b border-charcoal-800 text-[11px] font-bold uppercase text-charcoal-400 tracking-wider">
                    <tr>
                      <th className="p-4">Firm / Company</th>
                      <th className="p-4">Last Login / Activity</th>
                      <th className="p-4">Subscription Plan</th>
                      <th className="p-4">Sites Allowed</th>
                      <th className="p-4">Validity / Days Left</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-800">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-charcoal-400">
                          No contractors found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => {
                        const daysLeft = Math.max(
                          0,
                          Math.ceil((t.trialEndDate - Date.now()) / (1000 * 60 * 60 * 24))
                        );
                        const loginInfo = formatLastLogin(t.lastLoginAt);

                        return (
                          <tr key={t.id} className="hover:bg-charcoal-850/60 transition">
                            <td className="p-4">
                              <div className="font-extrabold text-white text-sm">{t.name}</div>
                              <div className="text-xs text-charcoal-400 mt-0.5">{t.ownerEmail}</div>
                              {t.ownerPhone && (
                                <div className="text-[11px] text-charcoal-500 mt-0.5">
                                  📞 {t.ownerPhone}
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    !t.lastLoginAt
                                      ? 'bg-charcoal-600'
                                      : loginInfo.isOnline
                                      ? 'bg-emerald-400 animate-pulse'
                                      : 'bg-amber-400/80'
                                  }`}
                                />
                                <span className={`text-xs ${loginInfo.badgeColor}`}>
                                  {loginInfo.text}
                                </span>
                              </div>
                              {loginInfo.timeAgo && (
                                <div className="text-[10px] text-charcoal-400 pl-3.5 mt-0.5">
                                  {loginInfo.timeAgo}
                                </div>
                              )}
                            </td>

                            <td className="p-4">
                              {t.plan === 'pro' || t.plan === 'pro_monthly' || t.plan === 'pro_yearly' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  <Crown className="w-3.5 h-3.5" />
                                  <span>{t.plan === 'pro_yearly' ? 'PRO ANNUAL' : 'PRO PLAN'}</span>
                                </span>
                              ) : t.plan === 'enterprise' ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-purple-950 text-purple-400 border border-purple-800">
                                  <span>ENTERPRISE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800">
                                  <span>4-Month Free Trial</span>
                                </span>
                              )}
                            </td>

                            <td className="p-4 font-bold text-white text-sm">
                              {t.maxAllowedSites >= 999 ? 'Unlimited' : `${t.maxAllowedSites} Site${t.maxAllowedSites > 1 ? 's' : ''}`}
                            </td>

                            <td className="p-4">
                              {t.plan === 'pro' || t.plan === 'enterprise' ? (
                                <span className="text-emerald-400 font-bold">Lifetime Active</span>
                              ) : (
                                <span
                                  className={`font-bold ${
                                    daysLeft > 15 ? 'text-charcoal-200' : 'text-amber-400'
                                  }`}
                                >
                                  {daysLeft} days remaining
                                </span>
                              )}
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                  t.status === 'active'
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                    : 'bg-red-950/60 text-red-400 border border-red-800/40'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    t.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                                  }`}
                                />
                                <span>{t.status === 'active' ? 'Active' : 'Deactivated'}</span>
                              </span>
                            </td>

                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              {/* Quick Toggle Status Button (Activate / Deactivate) */}
                              <button
                                type="button"
                                onClick={() => toggleTenantStatus(t.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition border shadow-sm ${
                                  t.status === 'active'
                                    ? 'border-red-800/60 bg-red-950/40 text-red-400 hover:bg-red-900/60'
                                    : 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60'
                                }`}
                                title={t.status === 'active' ? 'Deactivate / Suspend Client' : 'Activate Client Access'}
                              >
                                {t.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>

                              {/* Manage Subscription Modal Button */}
                              <button
                                type="button"
                                onClick={() => openEditModal(t)}
                                className="px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-white border border-charcoal-700 text-xs font-bold transition shadow-sm inline-flex items-center gap-1"
                                title="Edit Plan & Subscription"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-400" />
                                <span>Manage Plan</span>
                              </button>

                              {/* Delete Client */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCompany(t.id, t.name)}
                                className="p-1.5 rounded-xl text-xs font-bold transition border border-red-900/60 text-red-400 hover:bg-red-950/70 hover:text-red-300 ml-1 inline-flex items-center"
                                title="Delete Company"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTION MODELS & PRICING */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">SaaS Subscription Models &amp; Tiers</h2>
              <p className="text-xs text-charcoal-400 mt-1">
                Configure plan offerings for contractors. Changes here govern client access and limits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Model 1: Free Trial */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/40">
                    Launch Offer
                  </span>
                  <h3 className="text-lg font-black text-white">4-Month Free Trial</h3>
                  <div className="text-2xl font-black text-white">
                    ₹0 <span className="text-xs text-charcoal-400 font-normal">/ 120 Days</span>
                  </div>
                  <ul className="text-xs text-charcoal-300 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>1 Active Site</strong> included</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>120 Days full access</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Complete accounting &amp; stock</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-charcoal-800 text-xs text-charcoal-400">
                  Subscribed Clients: <strong className="text-white">{trialTenants}</strong>
                </div>
              </div>

              {/* Model 2: Pro Monthly */}
              <div className="bg-charcoal-900 border border-amber-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/40">
                    Flexible Monthly
                  </span>
                  <h3 className="text-lg font-black text-white">Pro Monthly</h3>
                  <div className="text-2xl font-black text-white">
                    ₹399 <span className="text-xs text-charcoal-400 font-normal">/ month</span>
                  </div>
                  <ul className="text-xs text-charcoal-300 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Unlimited Sites</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cloud Sync &amp; Backup</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-charcoal-800 text-xs text-charcoal-400">
                  Subscribed Clients: <strong className="text-white">{proTenants}</strong>
                </div>
              </div>

              {/* Model 3: Pro Annual */}
              <div className="bg-charcoal-900 border border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    Save 38% (★ Most Popular)
                  </span>
                  <h3 className="text-lg font-black text-white">Pro Annual</h3>
                  <div className="text-2xl font-black text-white">
                    ₹2,999 <span className="text-xs text-charcoal-400 font-normal">/ year (~₹250/mo)</span>
                  </div>
                  <ul className="text-xs text-charcoal-300 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Unlimited Sites</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Save ₹1,789 vs Monthly</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Priority Phone Support</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-charcoal-800 text-xs text-charcoal-400">
                  Est. Annual Revenue: <strong className="text-white">{formatCurrency(proTenants * 2999)}</strong>
                </div>
              </div>

              {/* Model 4: Enterprise */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/40">
                    Builders &amp; Corporates
                  </span>
                  <h3 className="text-lg font-black text-white">Enterprise Custom</h3>
                  <div className="text-2xl font-black text-white">
                    Custom <span className="text-xs text-charcoal-400 font-normal">Pricing</span>
                  </div>
                  <ul className="text-xs text-charcoal-300 space-y-1.5 pt-2">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Domain &amp; Logo</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dedicated Firestore Database</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dedicated Account Manager</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-charcoal-800 text-xs text-charcoal-400">
                  Super Admin Configured
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVOICES & PAYMENTS */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Revenue & Billing Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-charcoal-400 font-semibold uppercase tracking-wider">
                  Total Invoices
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {invoices.length}
                </div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Paid Subscriptions</div>
              </div>

              <div className="bg-charcoal-900 border border-emerald-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">
                  Gross Platform Revenue
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {formatCurrency(totalRevenue)}
                </div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Total collected (incl. GST)</div>
              </div>

              <div className="bg-charcoal-900 border border-amber-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                  GST Collected (18%)
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                  {formatCurrency(totalGstCollected)}
                </div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">9% CGST + 9% SGST</div>
              </div>

              <div className="bg-charcoal-900 border border-construction-900/40 p-4 rounded-2xl shadow">
                <div className="text-[11px] text-construction-400 font-semibold uppercase tracking-wider">
                  Net SaaS Earnings
                </div>
                <div className="text-2xl sm:text-3xl font-black text-construction-400 mt-1">
                  {formatCurrency(totalBaseRevenue)}
                </div>
                <div className="text-[11px] text-charcoal-400 mt-0.5">Net Taxable Revenue</div>
              </div>
            </div>

            {/* Invoices Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Search invoices by number, client firm, email, or Razorpay payment ID..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full bg-charcoal-900 border border-charcoal-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-amber-400 shadow-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => setInvoices(getAllInvoices())}
                className="px-4 py-3 bg-charcoal-900 hover:bg-charcoal-800 border border-charcoal-800 rounded-2xl text-xs font-bold text-charcoal-300 hover:text-white flex items-center space-x-1.5 transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Invoices</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-charcoal-950/70 text-charcoal-400 font-bold uppercase tracking-wider text-[10px] border-b border-charcoal-800">
                    <tr>
                      <th className="p-3.5">Invoice # &amp; Date</th>
                      <th className="p-3.5">Contractor Client</th>
                      <th className="p-3.5">Plan &amp; Validity</th>
                      <th className="p-3.5">Payment Details</th>
                      <th className="p-3.5 text-right">Amount (₹)</th>
                      <th className="p-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-800/80">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-charcoal-400">
                          <Receipt className="w-8 h-8 text-charcoal-600 mx-auto mb-2" />
                          <p className="font-bold text-white text-sm">No subscription invoices found</p>
                          <p className="text-[11px] text-charcoal-500 mt-1">
                            When clients subscribe to Pro Monthly or Pro Annual via Razorpay, their GST invoices will appear here automatically.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-charcoal-850/50 transition">
                          <td className="p-3.5">
                            <div className="font-mono font-bold text-amber-400">{inv.invoiceNumber}</div>
                            <div className="text-[11px] text-charcoal-400 mt-0.5">
                              {formatDate(new Date(inv.issuedAt).toISOString().split('T')[0])}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white">{inv.tenantName}</div>
                            <div className="text-[11px] text-charcoal-400">{inv.userEmail}</div>
                            {inv.userPhone && (
                              <div className="text-[10px] text-charcoal-500">{inv.userPhone}</div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="inline-block bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                              {inv.planName}
                            </span>
                            <div className="text-[10px] text-charcoal-400 mt-1">
                              Valid to: {formatDate(new Date(inv.validUntil).toISOString().split('T')[0])}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-mono text-[11px] text-charcoal-300">
                              {inv.razorpayPaymentId || 'N/A'}
                            </div>
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{inv.paymentMethod || 'Razorpay Gateway'}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="font-black text-white text-sm">
                              {formatCurrency(inv.totalAmount)}
                            </div>
                            <div className="text-[10px] text-charcoal-400">
                              Base: {formatCurrency(inv.baseAmount)} + GST {formatCurrency(inv.gstAmount)}
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedInvoice(inv)}
                              className="bg-charcoal-800 hover:bg-amber-500 hover:text-charcoal-950 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs transition border border-charcoal-700 hover:border-amber-400 flex items-center space-x-1.5 mx-auto active:scale-95"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Tax Bill</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GATEWAY & CLOUD DATABASE SETTINGS */}
        {activeTab === 'firebase' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Razorpay Payment Gateway Card */}
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <span>Razorpay Payment Gateway</span>
                  </h3>
                  <p className="text-xs text-charcoal-400 mt-1">
                    Accept UPI, Cards, Netbanking &amp; auto-generate GST Tax Invoices.
                  </p>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                    razorpayConfig.isLiveMode
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      razorpayConfig.isLiveMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{razorpayConfig.isLiveMode ? 'Live Mode' : 'Test Mode'}</span>
                </div>
              </div>

              <form onSubmit={handleSaveRazorpayConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    placeholder="rzp_test_... or rzp_live_..."
                    value={razorpayConfig.keyId}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, keyId: e.target.value })
                    }
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    Found in Razorpay Dashboard &rarr; Settings &rarr; API Keys.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Razorpay Key Secret (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Your Razorpay Key Secret"
                    value={razorpayConfig.keySecret || ''}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, keySecret: e.target.value })
                    }
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Brand / Business Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Construction Khata AI"
                    value={razorpayConfig.businessName || ''}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, businessName: e.target.value })
                    }
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    Displayed on the payment window and tax invoices.
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="isLiveModeCheckbox"
                    checked={razorpayConfig.isLiveMode}
                    onChange={(e) =>
                      setRazorpayConfig({ ...razorpayConfig, isLiveMode: e.target.checked })
                    }
                    className="rounded border-charcoal-700 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-charcoal-800"
                  />
                  <label htmlFor="isLiveModeCheckbox" className="text-xs text-charcoal-300 font-semibold cursor-pointer">
                    Enable Live Payments (Uncheck to use Test Sandbox)
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Razorpay Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Firebase Cloud Firestore Connection Card */}
            <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <span>Firebase Cloud Connection</span>
                  </h3>
                  <p className="text-xs text-charcoal-400 mt-1">
                    Sync contractor databases across web &amp; mobile devices.
                  </p>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${
                    isFirebaseLive
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFirebaseLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>{isFirebaseLive ? 'Live Cloud Connected' : 'Local Storage Mode'}</span>
                </div>
              </div>

              <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    API Key (apiKey)
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={fbConfig.apiKey}
                    onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-300 mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      placeholder="my-project.firebaseapp.com"
                      value={fbConfig.authDomain}
                      onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-charcoal-300 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      placeholder="my-construction-saas"
                      value={fbConfig.projectId}
                      onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-300 mb-1">
                      Storage Bucket
                    </label>
                    <input
                      type="text"
                      placeholder="my-project.appspot.com"
                      value={fbConfig.storageBucket}
                      onChange={(e) => setFbConfig({ ...fbConfig, storageBucket: e.target.value })}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-charcoal-300 mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      placeholder="1:123456789:web:abcdef"
                      value={fbConfig.appId}
                      onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Connect Cloud</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* EDIT SUBSCRIPTION & PLAN MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-charcoal-900 border border-charcoal-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Client Subscription Control
                </span>
                <h3 className="text-base font-black text-white">{editingTenant.name}</h3>
                <p className="text-xs text-charcoal-400">{editingTenant.ownerEmail}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="p-1 text-charcoal-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">
                  Subscription Plan:
                </label>
                <select
                  value={editPlan}
                  onChange={(e: any) => setEditPlan(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="free_trial">4-Month Free Trial (Launch Offer)</option>
                  <option value="pro">Pro Plan (Unlimited Sites)</option>
                  <option value="pro_monthly">Pro Monthly (₹399/mo)</option>
                  <option value="pro_yearly">Pro Annual (₹2,999/yr)</option>
                  <option value="enterprise">Enterprise Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">
                  Account Status:
                </label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="active">🟢 Active (Access Allowed)</option>
                  <option value="suspended">🔴 Suspended / Deactivated</option>
                </select>
              </div>

              {editPlan === 'free_trial' && (
                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1">
                    Allowed Sites Limit:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={editAllowedSites}
                    onChange={(e) => setEditAllowedSites(parseInt(e.target.value) || 1)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    Free plan default is 1 site. You can grant extra sites for testing.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-charcoal-300 mb-1">
                  Extend Validity / Trial:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 30, 60, 120].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => setEditTrialDaysAdd(days)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition border ${
                        editTrialDaysAdd === days
                          ? 'bg-amber-500 text-charcoal-950 border-amber-400'
                          : 'bg-charcoal-800 text-charcoal-300 border-charcoal-700 hover:text-white'
                      }`}
                    >
                      {days === 0 ? 'No change' : `+${days}d`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 text-xs text-charcoal-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubscription}
                  className="bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black px-5 py-2 rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
                >
                  {isSavingSubscription ? 'Saving...' : 'Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tax Invoice View & Print Modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
