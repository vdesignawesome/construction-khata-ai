import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertTriangle, AlertCircle } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { recordMaterialUsage, calculateMaterialStock } from '../../engine/accounting';
import type { Material, MaterialStockSummary } from '../../types';

interface MaterialUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMaterialId?: string;
}

export const MaterialUsageModal: React.FC<MaterialUsageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMaterialId
}) => {
  const { currentSiteId, showToast } = useAppStore();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState(initialMaterialId || '');
  const [currentStockInfo, setCurrentStockInfo] = useState<MaterialStockSummary | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadMaterials();
    }
  }, [isOpen, currentSiteId]);

  useEffect(() => {
    if (selectedMaterialId && currentSiteId) {
      calculateMaterialStock(currentSiteId, selectedMaterialId).then(setCurrentStockInfo);
    } else {
      setCurrentStockInfo(null);
    }
  }, [selectedMaterialId, currentSiteId]);

  const loadMaterials = async () => {
    if (!currentSiteId) return;
    const list = await db.materials
      .where({ siteId: currentSiteId, status: 'active' })
      .toArray();
    setMaterials(list);
    if (!selectedMaterialId && list.length > 0) {
      setSelectedMaterialId(list[0].id);
    }
  };

  const isExceedingStock = currentStockInfo ? quantity > currentStockInfo.currentStock : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!selectedMaterialId) {
      setError('Please select a material');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity used must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await recordMaterialUsage({
        siteId: currentSiteId,
        materialId: selectedMaterialId,
        quantity: Number(quantity),
        date,
        notes: notes.trim() || undefined
      });

      showToast(`Material usage recorded! Stock decreased by ${quantity}`, 'success');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to record usage');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record Material Usage</h3>
              <p className="text-xs text-charcoal-400">Consumption on site reduces stock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Select Material *
            </label>
            <select
              required
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
            >
              <option value="">-- Choose Material --</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Indicator */}
          {currentStockInfo && (
            <div className="p-3 bg-charcoal-800/70 border border-charcoal-700 rounded-xl flex items-center justify-between text-xs">
              <span className="text-charcoal-400">Available Stock on Site:</span>
              <span className="font-extrabold text-white text-sm">
                {currentStockInfo.currentStock} {currentStockInfo.unit}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Quantity Used *
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="any"
                placeholder="e.g. 20"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-sm text-white font-bold focus:outline-none focus:border-construction-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          {/* Stock warning - Requirement 43 */}
          {isExceedingStock && (
            <div className="p-3 bg-amber-950/60 border border-amber-800/70 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Warning: Usage quantity ({quantity}) exceeds current recorded stock ({currentStockInfo?.currentStock}). Stock will become negative until pending purchase bills are entered.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Purpose / Floor / Room Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Ground floor bathroom plumbing"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-charcoal-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-charcoal-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Usage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
