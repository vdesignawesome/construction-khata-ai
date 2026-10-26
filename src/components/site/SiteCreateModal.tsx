import React, { useState } from 'react';
import { X, Building2, MapPin, User, IndianRupee } from 'lucide-react';
import { db, logAudit, PREDEFINED_CATEGORIES, STANDARD_UNITS } from '../../db';
import { loadStandardCatalogueForSite } from '../../data/standardCatalogue';
import type { Site, Material } from '../../types';
import { syncSiteToCloud } from '../../services/firebase';
import { useSaasStore } from '../../store/useSaasStore';

interface SiteCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSiteId: string) => void;
}

export const SiteCreateModal: React.FC<SiteCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [seedStarterMaterials, setSeedStarterMaterials] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Site Name is mandatory (e.g. House - Sector 35)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const siteId = 'site_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newSite: Site = {
        id: siteId,
        name: name.trim(),
        clientName: clientName.trim() || undefined,
        location: location.trim() || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await db.sites.add(newSite);
      await logAudit(siteId, 'site', siteId, 'create', null, newSite);

      // Sync site to cloud for multi-device sync
      const currentTenant = useSaasStore.getState().currentTenant;
      if (currentTenant?.id) {
        await syncSiteToCloud(newSite, currentTenant.id);
      }

      // Pre-seed standard construction catalogue (Sanitary, Electrical, Cement, Steel, etc.)
      if (seedStarterMaterials) {
        await loadStandardCatalogueForSite(siteId);
      }

      onSuccess(siteId);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create site');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-construction-500/20 text-construction-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Create Construction Site</h3>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-300 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-300 mb-1.5">
              Site / Project Name <span className="text-construction-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. House - Sector 35, Shop - Main Road"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-construction-500 focus:ring-1 focus:ring-construction-500 transition"
              />
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              Give a clear identifier that matches how your site team names this project.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Client / Owner Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Er. Rajesh Verma"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Location / Sector
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 35, Chandigarh"
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Estimated Project Budget (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2.5 text-xs text-charcoal-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={seedStarterMaterials}
                onChange={(e) => setSeedStarterMaterials(e.target.checked)}
                className="w-4 h-4 rounded text-construction-500 focus:ring-construction-400 bg-charcoal-800 border-charcoal-600"
              />
              <span>Pre-populate starter site materials (Cement, Sand, Brick, Steel, CPVC Pipe)</span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-charcoal-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-charcoal-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Site...' : 'Create & Open Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
