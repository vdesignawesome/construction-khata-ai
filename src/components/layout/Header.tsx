import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ChevronDown,
  Mic,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Menu,
  Sparkles,
  Crown,
  User
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useSaasStore } from '../../store/useSaasStore';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentSite,
    setSiteSelectorOpen,
    setAiModalOpen,
    isLocked,
    lockApp,
    settings,
    activeTab,
    setActiveTab
  } = useAppStore();

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

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-charcoal-900/95 backdrop-blur border-b border-charcoal-800 px-4 py-3 flex items-center justify-between shadow-md">
      {/* Left: Mobile menu & Current Site Display */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-charcoal-300 hover:text-white hover:bg-charcoal-800 rounded-lg transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Current Site Badge */}
        <button
          onClick={() => setSiteSelectorOpen(true)}
          className="flex items-center space-x-2.5 text-left group bg-charcoal-800/80 hover:bg-charcoal-800 border border-charcoal-700/60 px-3 py-1.5 rounded-xl transition max-w-[calc(100vw-5rem)] md:max-w-md"
          title="Click to change site"
        >
          <div className="w-7 h-7 rounded-full bg-construction-500/20 text-construction-400 flex items-center justify-center font-bold shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-charcoal-400 font-medium leading-none">Current Site</div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-construction-400 transition flex items-center gap-1.5 mt-0.5 truncate">
              <span className="truncate">{currentSite ? currentSite.name : 'No Site Selected'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-construction-400 shrink-0" />
            </div>
          </div>
        </button>
      </div>

      {/* Right: Controls hidden on mobile, visible on desktop (md:flex) */}
      <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
        {/* Offline indicator */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
              : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
          }`}
          title={isOnline ? 'Online (Local-First IndexedDB Active)' : 'Offline mode active (Local-First IndexedDB)'}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="hidden sm:inline">{isOnline ? 'Offline-Ready' : 'Offline'}</span>
        </div>


        {/* SaaS Plan Pill (1 Site Free for 4 Months) */}
        <button
          onClick={() => setPaywallModalOpen(true)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold border transition ${
            isPro
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/50'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/50'
          }`}
          title={isPro ? 'Pro Contractor Plan (Unlimited Sites)' : `1 Site Free for 4 Months (${daysLeft} days remaining)`}
        >
          {isPro ? <Crown className="w-3 h-3 text-emerald-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
          <span className="hidden sm:inline">{isPro ? 'PRO Plan' : `Free 4M (${daysLeft}d)`}</span>
        </button>

        {/* Contractor Profile / Login Trigger */}
        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center space-x-1.5 p-1 sm:px-2 sm:py-1 text-charcoal-300 hover:text-white hover:bg-charcoal-800 rounded-lg transition border border-transparent hover:border-charcoal-700"
          title={currentUser ? `Logged in: ${currentUser.displayName || currentUser.email} (${currentTenant?.name})` : 'Contractor Sign In / Register'}
        >
          {currentUser ? (
            <div className="flex items-center space-x-1.5">
              <div className="w-6 h-6 rounded-full bg-construction-500/20 text-construction-400 border border-construction-500/40 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                {(currentUser.displayName || currentUser.email || 'C')[0]}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden md:inline max-w-[110px] truncate">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-charcoal-300" />
              <span className="text-xs font-semibold text-charcoal-400 hidden sm:inline">Sign In</span>
            </div>
          )}
        </button>


        {/* Floating / Header Voice AI Trigger */}
        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-construction-500 to-amber-500 text-charcoal-950 hover:from-construction-400 hover:to-amber-400 font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
          title="AI Assistant Voice/Text Entry"
        >
          <Mic className="w-4 h-4" />
          <span className="text-xs font-extrabold hidden sm:inline">AI ENTRY</span>
          <Sparkles className="w-3 h-3 text-charcoal-950/70 hidden sm:inline" />
        </button>

        {/* Security Lock Toggle if configured */}
        {settings?.isLockEnabled && (
          <button
            onClick={lockApp}
            className="p-1.5 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-lg transition"
            title="Lock Application"
          >
            {isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
};
