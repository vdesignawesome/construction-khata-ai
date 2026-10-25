import React from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingBag,
  CreditCard,
  Receipt,
  HardHat,
  FileBarChart,
  Bot,
  Search,
  Database,
  Settings,
  History,
  ShieldCheck,
  Crown,
  Building2,
  Sparkles,
  X
} from 'lucide-react';
import { useAppStore, type NavigationTab } from '../../store/useAppStore';
import { useSaasStore } from '../../store/useSaasStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab } = useAppStore();
  const {
    currentUser,
    currentTenant,
    getDaysRemaining,
    setAuthModalOpen,
    setPaywallModalOpen,
    setSuperAdminModalOpen
  } = useSaasStore();

  const daysLeft = getDaysRemaining();
  const isPro = currentTenant?.plan === 'pro';

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts (Suppliers/Labour)', icon: Users },
    { id: 'materials', label: 'Materials & Stock', icon: Boxes },
    { id: 'purchases', label: 'Purchases (Bills)', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Site Expenses', icon: Receipt },
    { id: 'labour', label: 'Labour Work (Financial)', icon: HardHat },
    { id: 'reports', label: 'Reports & Export', icon: FileBarChart },
    { id: 'search', label: 'Search Site', icon: Search },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'backup', label: 'Backup & Restore', icon: Database },
    { id: 'settings', label: 'Settings & Tests', icon: Settings },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-charcoal-950 border-r border-charcoal-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-construction-500/40 p-1 flex items-center justify-center shadow">
              <img src="/logo.svg" alt="Khata AI" className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide text-white flex items-center gap-1.5">
                CONSTRUCTION
                <span className="text-xs bg-construction-500 text-charcoal-950 px-1.5 py-0.5 rounded font-black">
                  AI
                </span>
              </div>
              <div className="text-xs text-charcoal-400 font-medium">Site Khata & Inventory</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-charcoal-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition text-left ${
                  isActive
                    ? 'bg-construction-500 text-charcoal-950 font-bold shadow-md shadow-construction-500/10'
                    : 'text-charcoal-300 hover:text-white hover:bg-charcoal-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-charcoal-950' : 'text-charcoal-400 group-hover:text-white'
                  }`}
                />
                <span className="truncate flex-1">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isActive
                      ? 'bg-charcoal-950 text-construction-400'
                      : 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* SaaS Contractor Profile & Plan Info */}
        <div className="p-3.5 border-t border-charcoal-800/80 bg-charcoal-900/40 space-y-2">
          <div
            onClick={() => setPaywallModalOpen(true)}
            className="cursor-pointer bg-charcoal-850 hover:bg-charcoal-800 p-2.5 rounded-xl border border-charcoal-700/80 transition"
          >
            <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
              <span className="truncate">{currentTenant?.name || 'My Firm'}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                isPro ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-300'
              }`}>
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </div>
            <div className="text-[11px] text-charcoal-400 flex items-center justify-between">
              <span>{isPro ? 'Unlimited Sites' : `1 Site Free: ${daysLeft}d left`}</span>
              {!isPro && <span className="text-amber-400 font-bold hover:underline">Upgrade</span>}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-charcoal-400 px-1 pt-1">
            <button
              onClick={() => { onClose(); setAuthModalOpen(true); }}
              className="hover:text-construction-400 transition underline underline-offset-2"
            >
              {currentUser ? `Sign out / Switch` : 'Contractor Sign In'}
            </button>
            <div className="flex items-center space-x-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local Offline</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
