import { create } from 'zustand';
import { db } from '../db';
import type { Site, AppSettings } from '../types';

export type NavigationTab =
  | 'dashboard'
  | 'accounts'
  | 'materials'
  | 'purchases'
  | 'payments'
  | 'expenses'
  | 'labour'
  | 'reports'
  | 'ai'
  | 'backup'
  | 'settings'
  | 'search'
  | 'audit';

interface AppState {
  currentSiteId: string | null;
  currentSite: Site | null;
  activeTab: NavigationTab;
  isSiteSelectorOpen: boolean;
  isAiModalOpen: boolean;
  aiInitialPrompt: string;
  isLocked: boolean;
  isUnlockedForSession: boolean;
  settings: AppSettings | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  refreshTrigger: number;

  // Actions
  setCurrentSiteId: (id: string | null) => Promise<void>;
  setActiveTab: (tab: NavigationTab) => void;
  setSiteSelectorOpen: (open: boolean) => void;
  setAiModalOpen: (open: boolean, initialPrompt?: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  triggerRefresh: () => void;
  loadInitialData: () => Promise<void>;
  unlockApp: (pin: string) => boolean;
  lockApp: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSiteId: localStorage.getItem('khata_current_site_id') || null,
  currentSite: null,
  activeTab: 'dashboard',
  isSiteSelectorOpen: false,
  isAiModalOpen: false,
  aiInitialPrompt: '',
  isLocked: false,
  isUnlockedForSession: false,
  settings: null,
  toast: null,
  refreshTrigger: 0,

  loadInitialData: async () => {
    // Purge legacy demo seed sites so contractors start with 100% clean production state
    const demoIds = ['site_sec35', 'site_modeltown', 'site_shopmain'];
    for (const siteId of demoIds) {
      try {
        const exists = await db.sites.get(siteId);
        if (exists) {
          await db.transaction('rw', [
            db.sites,
            db.accounts,
            db.materials,
            db.purchases,
            db.purchaseItems,
            db.payments,
            db.expenses,
            db.labourWork,
            db.stockMovements,
            db.pendingAiTransactions
          ], async () => {
            await db.sites.delete(siteId);
            await db.accounts.where({ siteId }).delete();
            await db.materials.where({ siteId }).delete();
            await db.purchases.where({ siteId }).delete();
            await db.purchaseItems.where({ siteId }).delete();
            await db.payments.where({ siteId }).delete();
            await db.expenses.where({ siteId }).delete();
            await db.labourWork.where({ siteId }).delete();
            await db.stockMovements.where({ siteId }).delete();
            await db.pendingAiTransactions.where({ siteId }).delete();
          });
        }
      } catch (e) {
        console.warn('Error purging demo site:', e);
      }
    }

    // Load settings
    const settings = await db.settings.get('default');
    if (settings) {
      set({
        settings,
        isLocked: settings.isLockEnabled && !!settings.pinCode
      });
    }

    // Load active site from storage
    const savedSiteId = localStorage.getItem('khata_current_site_id');
    if (savedSiteId && !demoIds.includes(savedSiteId)) {
      const site = await db.sites.get(savedSiteId);
      if (site) {
        set({ currentSiteId: site.id, currentSite: site });
        return;
      }
    }

    // If no valid real site in local storage, check if any real sites exist
    const firstSite = await db.sites.orderBy('createdAt').first();
    if (firstSite) {
      localStorage.setItem('khata_current_site_id', firstSite.id);
      set({ currentSiteId: firstSite.id, currentSite: firstSite, isSiteSelectorOpen: false });
    } else {
      localStorage.removeItem('khata_current_site_id');
      set({ currentSiteId: null, currentSite: null, isSiteSelectorOpen: true });
    }
  },

  setCurrentSiteId: async (id: string | null) => {
    if (!id) {
      localStorage.removeItem('khata_current_site_id');
      set({ currentSiteId: null, currentSite: null, isSiteSelectorOpen: true });
      return;
    }

    const site = await db.sites.get(id);
    if (site) {
      localStorage.setItem('khata_current_site_id', id);
      set({
        currentSiteId: id,
        currentSite: site,
        isSiteSelectorOpen: false,
        refreshTrigger: get().refreshTrigger + 1
      });
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSiteSelectorOpen: (open) => set({ isSiteSelectorOpen: open }),

  setAiModalOpen: (open, initialPrompt = '') =>
    set({ isAiModalOpen: open, aiInitialPrompt: initialPrompt }),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 4000);
  },

  clearToast: () => set({ toast: null }),

  triggerRefresh: () => set(state => ({ refreshTrigger: state.refreshTrigger + 1 })),

  unlockApp: (pin: string) => {
    const { settings } = get();
    if (!settings || !settings.pinCode || settings.pinCode === pin) {
      set({ isUnlockedForSession: true });
      return true;
    }
    return false;
  },

  lockApp: () => {
    set({ isUnlockedForSession: false });
  }
}));
