import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { initializeDatabase } from './db';

// Layout
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';

// Modals
import { SiteSelectorModal } from './components/site/SiteSelectorModal';
import { AiAssistantModal } from './components/ai/AiAssistantModal';
import { PinLockModal } from './components/security/PinLockModal';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';
import { AuthModal } from './components/saas/AuthModal';
import { PaywallModal } from './components/saas/PaywallModal';
import { SuperAdminPage } from './components/saas/SuperAdminPage';
import { useSaasStore } from './store/useSaasStore';

// Views
import { SiteDashboard } from './components/dashboard/SiteDashboard';
import { AccountsView } from './components/accounts/AccountsView';
import { MaterialsView } from './components/materials/MaterialsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { PaymentsView } from './components/payments/PaymentsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { LabourWorkView } from './components/labour/LabourWorkView';
import { ReportsView } from './components/reports/ReportsView';
import { SiteSearchView } from './components/search/SiteSearchView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';
import { SettingsView } from './components/settings/SettingsView';
import { AuditLogView } from './components/audit/AuditLogView';

export const App: React.FC = () => {
  const {
    activeTab,
    currentSiteId,
    loadInitialData,
    toast,
    clearToast
  } = useAppStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(() => {
    return (
      window.location.search.includes('admin') ||
      window.location.pathname.startsWith('/admin') ||
      window.location.hash.includes('admin')
    );
  });
  const { initSaasSession } = useSaasStore();

  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminView(
        window.location.search.includes('admin') ||
        window.location.pathname.startsWith('/admin') ||
        window.location.hash.includes('admin')
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Private owner shortcut: Ctrl + Shift + A
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminView((prev) => !prev);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('keydown', handleKeyDown);

    const init = async () => {
      try {
        await initializeDatabase();
        await loadInitialData();
        await initSaasSession();
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    init();

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isAdminView) {
    return (
      <SuperAdminPage
        onBack={() => {
          window.history.pushState({}, '', '/');
          setIsAdminView(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <SiteDashboard />}
          {activeTab === 'accounts' && <AccountsView />}
          {activeTab === 'materials' && <MaterialsView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'payments' && <PaymentsView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'labour' && <LabourWorkView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'search' && <SiteSearchView />}
          {activeTab === 'audit' && <AuditLogView />}
          {activeTab === 'backup' && <BackupRestoreView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'ai' && <SiteDashboard />}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>

      {/* Site Selector Modal */}
      <SiteSelectorModal />

      {/* AI Assistant Modal (Text/Voice Entry) */}
      <AiAssistantModal />

      {/* PIN Security Modal */}
      <PinLockModal />

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* SaaS Multi-Tenant Modals */}
      <AuthModal />
      <PaywallModal />

      {/* Account Deactivated / Suspended Gate */}
      {useSaasStore.getState().currentTenant?.status === 'suspended' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-charcoal-900 border border-red-800/80 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <h3 className="text-xl font-black text-white">Account Suspended</h3>
            <p className="text-xs text-charcoal-300">
              Your contractor account has been deactivated / suspended by the Super Administrator.
            </p>
            <p className="text-[11px] text-charcoal-400">
              Please contact the platform administrator to reactivate your subscription access.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => useSaasStore.getState().logout()}
                className="w-full bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-red-200 font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Sign Out / Switch Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Message */}
      {toast && (
        <div
          onClick={clearToast}
          className={`fixed top-16 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 border cursor-pointer animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-red-950 text-red-200 border-red-700'
              : 'bg-charcoal-900 text-construction-300 border-construction-500/50'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
