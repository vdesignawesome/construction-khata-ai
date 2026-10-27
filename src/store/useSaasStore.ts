import { create } from 'zustand';
import type { SaasTenant, SaasUser } from '../types/saas';
import { TRIAL_DURATION_DAYS } from '../types/saas';
import {
  getCurrentSession,
  saveCurrentSession,
  saasLoginUser,
  saasLoginWithGoogle,
  saasRegisterContractor,
  saasSignOut,
  fetchAllSaaSTenants,
  updateTenantPlanByAdmin,
  deleteTenantByAdmin,
  syncTenantSitesWithLocal,
  subscribeTenantSites
} from '../services/firebase';
import { db } from '../db';
import { useAppStore } from './useAppStore';

interface SaasState {
  currentUser: SaasUser | null;
  currentTenant: SaasTenant | null;
  isAuthModalOpen: boolean;
  isPaywallModalOpen: boolean;
  isSuperAdminModalOpen: boolean;
  isFirebaseConfigModalOpen: boolean;
  allTenants: SaasTenant[];
  isLoading: boolean;

  // Actions
  initSaasSession: () => Promise<void>;
  setAuthModalOpen: (open: boolean) => void;
  setPaywallModalOpen: (open: boolean) => void;
  setSuperAdminModalOpen: (open: boolean) => void;
  setFirebaseConfigModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (params: {
    firmName: string;
    email: string;
    password?: string;
    phone?: string;
    displayName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshTenants: () => Promise<void>;
  grantProPlan: (tenantId: string) => Promise<void>;
  extendTrialDays: (tenantId: string, days?: number) => Promise<void>;
  toggleTenantStatus: (tenantId: string) => Promise<void>;
  deleteTenant: (tenantId: string) => Promise<void>;
  updateTenantSubscription: (tenantId: string, updates: Partial<SaasTenant>) => Promise<void>;

  // Getters / Checks
  getDaysRemaining: () => number;
  canCreateNewSite: () => Promise<{ allowed: boolean; reason?: string }>;
}

export const useSaasStore = create<SaasState>((set, get) => ({
  currentUser: null,
  currentTenant: null,
  isAuthModalOpen: !getCurrentSession(),
  isPaywallModalOpen: false,
  isSuperAdminModalOpen: false,
  isFirebaseConfigModalOpen: false,
  allTenants: [],
  isLoading: false,

  initSaasSession: async () => {
    const session = getCurrentSession();
    if (session) {
      set({ currentUser: session.user, currentTenant: session.tenant, isAuthModalOpen: false });
      try {
        await syncTenantSitesWithLocal(session.tenant.id);
        await useAppStore.getState().loadInitialData();
        subscribeTenantSites(session.tenant.id, async () => {
          await useAppStore.getState().loadInitialData();
          useAppStore.getState().triggerRefresh();
        });
      } catch (e) {
        console.warn('Initial site sync error:', e);
      }
    } else {
      set({ currentUser: null, currentTenant: null, isAuthModalOpen: true });
    }
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setPaywallModalOpen: (open) => set({ isPaywallModalOpen: open }),
  setSuperAdminModalOpen: (open) => set({ isSuperAdminModalOpen: open }),
  setFirebaseConfigModalOpen: (open) => set({ isFirebaseConfigModalOpen: open }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { user, tenant } = await saasLoginUser(email, password);
      set({ currentUser: user, currentTenant: tenant, isAuthModalOpen: false });
      try {
        await syncTenantSitesWithLocal(tenant.id);
        await useAppStore.getState().loadInitialData();
        subscribeTenantSites(tenant.id, async () => {
          await useAppStore.getState().loadInitialData();
          useAppStore.getState().triggerRefresh();
        });
      } catch (e) {
        console.warn('Login site sync error:', e);
      }
      const activeSiteId = useAppStore.getState().currentSiteId;
      useAppStore.getState().setSiteSelectorOpen(!activeSiteId);
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const { user, tenant } = await saasLoginWithGoogle();
      set({ currentUser: user, currentTenant: tenant, isAuthModalOpen: false });
      try {
        await syncTenantSitesWithLocal(tenant.id);
        await useAppStore.getState().loadInitialData();
        subscribeTenantSites(tenant.id, async () => {
          await useAppStore.getState().loadInitialData();
          useAppStore.getState().triggerRefresh();
        });
      } catch (e) {
        console.warn('Google login site sync error:', e);
      }
      const activeSiteId = useAppStore.getState().currentSiteId;
      useAppStore.getState().setSiteSelectorOpen(!activeSiteId);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (params) => {
    set({ isLoading: true });
    try {
      const { user, tenant } = await saasRegisterContractor(params);
      set({ currentUser: user, currentTenant: tenant, isAuthModalOpen: false });
      try {
        await syncTenantSitesWithLocal(tenant.id);
        await useAppStore.getState().loadInitialData();
        subscribeTenantSites(tenant.id, async () => {
          await useAppStore.getState().loadInitialData();
          useAppStore.getState().triggerRefresh();
        });
      } catch (e) {
        console.warn('Register site sync error:', e);
      }
      const activeSiteId = useAppStore.getState().currentSiteId;
      useAppStore.getState().setSiteSelectorOpen(!activeSiteId);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await saasSignOut();
    set({ currentUser: null, currentTenant: null, isAuthModalOpen: true });
  },

  refreshTenants: async () => {
    const tenants = await fetchAllSaaSTenants();
    set({ allTenants: tenants });
  },

  grantProPlan: async (tenantId) => {
    await updateTenantPlanByAdmin(tenantId, {
      plan: 'pro',
      status: 'active',
      maxAllowedSites: 999
    });
    await get().refreshTenants();
    const curr = get().currentTenant;
    if (curr && curr.id === tenantId) {
      set({
        currentTenant: { ...curr, plan: 'pro', status: 'active', maxAllowedSites: 999 }
      });
    }
  },

  extendTrialDays: async (tenantId, days = 30) => {
    const tenants = await fetchAllSaaSTenants();
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;

    const baseTime = Math.max(Date.now(), target.trialEndDate);
    const newEnd = baseTime + days * 24 * 60 * 60 * 1000;

    await updateTenantPlanByAdmin(tenantId, {
      trialEndDate: newEnd,
      status: 'active'
    });
    await get().refreshTenants();
    const curr = get().currentTenant;
    if (curr && curr.id === tenantId) {
      set({
        currentTenant: { ...curr, trialEndDate: newEnd, status: 'active' }
      });
    }
  },

  toggleTenantStatus: async (tenantId) => {
    const tenants = await fetchAllSaaSTenants();
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;

    const newStatus = target.status === 'active' ? 'suspended' : 'active';
    await updateTenantPlanByAdmin(tenantId, { status: newStatus });
    await get().refreshTenants();
    const curr = get().currentTenant;
    if (curr && curr.id === tenantId) {
      set({ currentTenant: { ...curr, status: newStatus } });
    }
  },

  deleteTenant: async (tenantId) => {
    await deleteTenantByAdmin(tenantId);
    await get().refreshTenants();
    const curr = get().currentTenant;
    if (curr && curr.id === tenantId) {
      const remaining = get().allTenants;
      if (remaining.length > 0) {
        set({ currentTenant: remaining[0] });
      } else {
        set({ currentTenant: null, currentUser: null });
      }
    }
  },

  updateTenantSubscription: async (tenantId, updates) => {
    await updateTenantPlanByAdmin(tenantId, updates);
    await get().refreshTenants();
    const curr = get().currentTenant;
    if (curr && curr.id === tenantId) {
      set({ currentTenant: { ...curr, ...updates } });
    }
  },

  getDaysRemaining: () => {
    const tenant = get().currentTenant;
    if (!tenant) return 0;
    if (
      tenant.plan === 'pro' ||
      tenant.plan === 'pro_monthly' ||
      tenant.plan === 'pro_yearly' ||
      tenant.plan === 'enterprise'
    ) {
      return 999;
    }
    const diff = tenant.trialEndDate - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  canCreateNewSite: async () => {
    const tenant = get().currentTenant;
    const user = get().currentUser;

    // Super Admin has no restrictions
    if (user?.isSuperAdmin) {
      return { allowed: true };
    }

    if (!tenant) {
      return { allowed: false, reason: 'Please log in to manage sites.' };
    }

    if (tenant.status === 'suspended') {
      return { allowed: false, reason: 'Your account is suspended. Please contact the administrator.' };
    }

    // Check trial expiration (120 days = 4 months free)
    const now = Date.now();
    if (tenant.plan === 'free_trial' && now > tenant.trialEndDate) {
      return {
        allowed: false,
        reason: 'Your 4-month free trial has completed. Upgrade to Pro to continue adding sites!'
      };
    }

    // Check Site limits (1 Site Free on Trial - custom user sites)
    const allSites = await db.sites.where({ status: 'active' }).toArray();
    const demoSiteIds = new Set(['site_sec35', 'site_modeltown', 'site_shopmain']);
    const customSitesCount = allSites.filter((s) => !demoSiteIds.has(s.id)).length;

    if (customSitesCount >= tenant.maxAllowedSites) {
      return {
        allowed: false,
        reason: `Your Free Plan includes 1 Site for 4 months. Upgrade to Pro for Unlimited Sites!`
      };
    }

    return { allowed: true };
  }
}));
