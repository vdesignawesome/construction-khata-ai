import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  X,
  Trash2,
  MoreVertical,
  Edit3,
  RefreshCw,
  LogOut,
  Sparkles,
  Cloud
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { calculateSiteFinancialSummary } from '../../engine/accounting';
import { formatCurrency } from '../../utils/formatters';
import type { Site, SiteFinancialSummary } from '../../types';
import { SiteCreateModal } from './SiteCreateModal';
import { SiteEditModal } from './SiteEditModal';
import { useSaasStore } from '../../store/useSaasStore';
import { syncTenantSitesWithLocal, deleteSiteFromCloud, syncSiteToCloud } from '../../services/firebase';

interface SiteWithFinancials {
  site: Site;
  summary?: SiteFinancialSummary;
}

export const SiteSelectorModal: React.FC = () => {
  const {
    currentSiteId,
    setCurrentSiteId,
    isSiteSelectorOpen,
    setSiteSelectorOpen,
    showToast,
    refreshTrigger
  } = useAppStore();

  const {
    canCreateNewSite,
    setPaywallModalOpen,
    currentTenant,
    currentUser,
    setAuthModalOpen,
    getDaysRemaining
  } = useSaasStore();

  const [sites, setSites] = useState<SiteWithFinancials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [activeMenuSiteId, setActiveMenuSiteId] = useState<string | null>(null);

  const handleAddNewSiteClick = async () => {
    const check = await canCreateNewSite();
    if (!check.allowed) {
      setPaywallModalOpen(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      showToast('Syncing sites with cloud...', 'info');
      if (currentTenant?.id) {
        await syncTenantSitesWithLocal(currentTenant.id);
      }
      await loadSites();
      const activeId = useAppStore.getState().currentSiteId;
      if (!activeId) {
        await useAppStore.getState().loadInitialData();
      }
      showToast('Sites updated from cloud!', 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Sync error: ' + (e?.message || 'Check connection'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuickCreateSite = async () => {
    const check = await canCreateNewSite();
    if (!check.allowed) {
      setPaywallModalOpen(true);
      return;
    }
    try {
      setIsLoading(true);
      const siteId = 'site_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const defaultName = (currentTenant?.name ? currentTenant.name.replace(/Construction.*/i, '').trim() : 'Project') + ' Site 1';
      const newSite: Site = {
        id: siteId,
        name: defaultName || 'Project Site 1',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.sites.add(newSite);
      if (currentTenant?.id) {
        await syncSiteToCloud(newSite, currentTenant.id);
      }
      await loadSites();
      await setCurrentSiteId(siteId);
      showToast(`Site "${newSite.name}" created and selected!`, 'success');
    } catch (e: any) {
      showToast('Failed to create site: ' + e?.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, [refreshTrigger, isSiteSelectorOpen]);

  // Close dropdown menu when clicking anywhere else
  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuSiteId(null);
    window.addEventListener('click', handleDocumentClick);
    return () => window.removeEventListener('click', handleDocumentClick);
  }, []);

  const loadSites = async () => {
    setIsLoading(true);
    try {
      if (currentTenant?.id) {
        try {
          await syncTenantSitesWithLocal(currentTenant.id);
        } catch (e) {
          console.warn('Sync failed during loadSites:', e);
        }
      }
      const allSites = await db.sites.orderBy('createdAt').reverse().toArray();
      const realSites = allSites.filter(s => !['site_sec35', 'site_modeltown', 'site_shopmain'].includes(s.id));
      const withFinancials: SiteWithFinancials[] = [];

      for (const site of realSites) {
        try {
          const summary = await calculateSiteFinancialSummary(site.id);
          withFinancials.push({ site, summary });
        } catch {
          withFinancials.push({ site });
        }
      }

      setSites(withFinancials);
    } catch (err) {
      console.error('Error loading sites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSite = async (siteId: string) => {
    await setCurrentSiteId(siteId);
    setSiteSelectorOpen(false);
    showToast('Switched site successfully', 'success');
  };

  const handleDeleteSite = async (siteId: string, siteName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete "${siteName}" and all its records? This cannot be undone.`)) {
      try {
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

        if (currentSiteId === siteId) {
          await setCurrentSiteId(null);
        }

        if (currentTenant?.id) {
          await deleteSiteFromCloud(siteId, currentTenant.id);
        }

        showToast(`Site "${siteName}" deleted.`, 'info');
        await loadSites();
      } catch (err) {
        console.error(err);
        showToast('Error deleting site', 'error');
      }
    }
  };

  // If no site is selected, this modal is non-dismissible (mandatory site selection)
  const isDismissible = !!currentSiteId;

  if (!isSiteSelectorOpen && currentSiteId) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
        <div className="bg-charcoal-900 border border-charcoal-700/80 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-charcoal-800 bg-charcoal-950/60 flex items-start justify-between gap-2">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-construction-500/10 border border-construction-500/40 p-2 flex items-center justify-center shadow-inner shrink-0">
                <Building2 className="w-7 h-7 text-construction-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-construction-400">
                  Construction Khata AI
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">Select Your Site</h2>
                <p className="text-xs text-charcoal-400 mt-0.5 truncate hidden sm:block">
                  All transactions, materials and accounts are isolated to the selected site.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white text-xs font-bold transition border border-charcoal-700/80 active:scale-95 shadow-sm disabled:opacity-50"
                title="Sync sites from Cloud / Mobile"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-construction-400'}`} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>

              {isDismissible && (
                <button
                  onClick={() => setSiteSelectorOpen(false)}
                  className="p-1.5 text-charcoal-400 hover:text-white rounded-lg hover:bg-charcoal-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Site Cards List */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
            {isLoading ? (
              <div className="py-12 text-center text-charcoal-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-construction-400" />
                <span>Loading sites...</span>
              </div>
            ) : sites.length === 0 ? (
              <div className="py-8 sm:py-10 px-4 text-center border-2 border-dashed border-charcoal-700 rounded-2xl bg-charcoal-950/40 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-charcoal-850 border border-charcoal-700 flex items-center justify-center mx-auto text-construction-400 shadow">
                  <Building2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">No Construction Sites Found</h3>
                  <p className="text-xs text-charcoal-400 max-w-md mx-auto mt-1">
                    यदि आपने मोबाइल पर पहले साइट बनाई थी, तो <strong>Sync Cloud</strong> दबाएं। या नीचे से तुरंत अपनी पहली साइट शुरू करें।
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleAddNewSiteClick}
                    className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 shadow-lg active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add New Site (कस्टम साइट)</span>
                  </button>

                  <button
                    onClick={handleQuickCreateSite}
                    className="bg-charcoal-800 hover:bg-charcoal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-charcoal-600 shadow active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>⚡ 1-Click Quick Site</span>
                  </button>

                  <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="bg-charcoal-850 hover:bg-charcoal-800 text-charcoal-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-2 border border-charcoal-700 shadow active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-amber-400' : 'text-blue-400'}`} />
                    <span>Sync Mobile Sites</span>
                  </button>
                </div>

                {/* Account Context & Switch */}
                <div className="pt-3 border-t border-charcoal-800/80 flex items-center justify-center gap-2 text-xs text-charcoal-400">
                  {currentUser ? (
                    <span>
                      Logged in as <strong className="text-white">{currentUser.displayName || currentUser.email}</strong> ({currentTenant?.name}) •{' '}
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                        }}
                        className="text-construction-400 hover:underline font-bold"
                      >
                        Switch Account / Sign Out
                      </button>
                    </span>
                  ) : (
                    <span>
                      <button
                        onClick={() => setAuthModalOpen(true)}
                        className="text-construction-400 hover:underline font-bold"
                      >
                        Contractor Sign In to sync existing cloud data
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              sites.map(({ site, summary }) => {
                const isSelected = site.id === currentSiteId;
                return (
                  <div
                    key={site.id}
                    className={`group relative p-4 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-charcoal-800/90 border-construction-500 shadow-md ring-1 ring-construction-500/50'
                        : 'bg-charcoal-950/40 border-charcoal-800 hover:border-charcoal-700 hover:bg-charcoal-800/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-base sm:text-lg text-white group-hover:text-construction-400 transition">
                            {site.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] bg-construction-500/20 text-construction-400 px-2 py-0.5 rounded-full font-bold border border-construction-500/40">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-charcoal-400 mt-1">
                          {site.clientName && <span>Client: {site.clientName}</span>}
                          {site.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-charcoal-500" />
                              {site.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financial Quick Glance */}
                      <div className="flex items-center space-x-4 text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-charcoal-800">
                        <div>
                          <div className="text-[10px] text-charcoal-400 font-medium">Total Cost</div>
                          <div className="text-sm font-bold text-slate-200">
                            {formatCurrency(summary?.totalProjectCost || 0)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-charcoal-400 font-medium">Pending</div>
                          <div
                            className={`text-sm font-bold ${
                              (summary?.totalPending || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatCurrency(summary?.totalPending || 0)}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectSite(site.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                            isSelected
                              ? 'bg-construction-500 text-charcoal-950 hover:bg-construction-400'
                              : 'bg-charcoal-800 hover:bg-charcoal-700 text-white border border-charcoal-700'
                          }`}
                        >
                          <span>{isSelected ? 'Opened' : 'Open Site'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuSiteId(activeMenuSiteId === site.id ? null : site.id);
                            }}
                            className="p-2 rounded-xl text-xs font-bold transition border border-charcoal-700 text-charcoal-300 hover:text-white hover:bg-charcoal-700 hover:border-charcoal-600 active:scale-95"
                            title="Site Options (Edit / Delete)"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Three-dot dropdown menu */}
                          {activeMenuSiteId === site.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1.5 w-44 bg-charcoal-900 border border-charcoal-700 rounded-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuSiteId(null);
                                  setEditingSite(site);
                                  setIsEditOpen(true);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-charcoal-800 flex items-center space-x-2.5 transition"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-construction-400" />
                                <span>Edit Site Details</span>
                              </button>

                              <div className="border-t border-charcoal-800 my-1" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuSiteId(null);
                                  handleDeleteSite(site.id, site.name, e);
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/60 flex items-center space-x-2.5 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Site</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-charcoal-800 bg-charcoal-950/70 flex items-center justify-between gap-3">
            <span className="text-xs text-charcoal-400">
              Total Sites: <strong className="text-white">{sites.length}</strong>
            </span>

            <button
              onClick={handleAddNewSiteClick}
              className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2 shadow active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal for creating a new site */}
      {isCreateOpen && (
        <SiteCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={async (newSiteId) => {
            setIsCreateOpen(false);
            await loadSites();
            await setCurrentSiteId(newSiteId);
          }}
        />
      )}

      {/* Modal for editing existing site */}
      {isEditOpen && editingSite && (
        <SiteEditModal
          isOpen={isEditOpen}
          site={editingSite}
          onClose={() => {
            setIsEditOpen(false);
            setEditingSite(null);
          }}
          onSuccess={async () => {
            await loadSites();
          }}
        />
      )}
    </>
  );
};
