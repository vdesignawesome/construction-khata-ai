import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, User, IndianRupee, Calendar, CheckCircle2 } from 'lucide-react';
import { db, logAudit } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import type { Site, SiteStatus } from '../../types';

interface SiteEditModalProps {
  isOpen: boolean;
  site: Site | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SiteEditModal: React.FC<SiteEditModalProps> = ({
  isOpen,
  site,
  onClose,
  onSuccess
}) => {
  const { showToast, currentSiteId, setCurrentSiteId } = useAppStore();

  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState<SiteStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (site) {
      setName(site.name || '');
      setClientName(site.clientName || '');
      setLocation(site.location || '');
      setBudget(site.budget ? String(site.budget) : '');
      setStartDate(site.startDate || '');
      setStatus(site.status || 'active');
      setError('');
    }
  }, [site, isOpen]);

  if (!isOpen || !site) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Site Name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedFields: Partial<Site> = {
        name: name.trim(),
        clientName: clientName.trim() || undefined,
        location: location.trim() || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        startDate: startDate || undefined,
        status,
        updatedAt: Date.now()
      };

      await db.sites.update(site.id, updatedFields);
      await logAudit(site.id, 'site', site.id, 'update', site, updatedFields);

      // If this site is currently active, refresh currentSite in store
      if (currentSiteId === site.id) {
        await setCurrentSiteId(site.id);
      }

      showToast(`Site "${name.trim()}" updated successfully!`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to update site details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-construction-500/20 text-construction-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Edit Site Details</h3>
              <p className="text-xs text-charcoal-400">Update project name, client, location or budget</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-charcoal-400 hover:text-white rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                placeholder="e.g. House - Sector 35"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-construction-500 focus:ring-1 focus:ring-construction-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Client / Owner Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Er. Rajesh Verma"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Location / Sector
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Sector 35, Chandigarh"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Estimated Budget (₹)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Project Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['active', 'on-hold', 'completed'] as SiteStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border capitalize transition ${
                    status === st
                      ? 'bg-construction-500 text-charcoal-950 border-construction-400 shadow-sm'
                      : 'bg-charcoal-800 border-charcoal-700 text-charcoal-300 hover:text-white'
                  }`}
                >
                  {st.replace('-', ' ')}
                </button>
              ))}
            </div>
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
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
