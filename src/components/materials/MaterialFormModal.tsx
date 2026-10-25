import React, { useState, useEffect } from 'react';
import { X, Boxes, AlertCircle } from 'lucide-react';
import { db, logAudit, PREDEFINED_CATEGORIES, STANDARD_UNITS } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import type { Material, StockMovement } from '../../types';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materialToEdit?: Material | null;
  defaultCategory?: string;
}

const CATEGORY_DEFAULT_UNITS: Record<string, string> = {
  Cement: 'bags',
  Steel: 'kg',
  Brick: 'pcs',
  Sand: 'cft',
  Bajri: 'cft',
  Plumbing: 'pcs',
  Sanitary: 'pcs',
  Electrical: 'pcs',
  Tiles: 'sq ft',
  Hardware: 'pcs',
  Paint: 'liter',
  Wood: 'cft',
  Glass: 'sq ft',
  Other: 'pcs'
};

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  Cement: "e.g. PPC, OPC 43, OPC 53, UltraTech",
  Sanitary: "e.g. Wash Basin, Western Toilet, CPVC Pipe 1'', Bib Cock",
  Steel: "e.g. 10mm TMT, 12mm TMT, Binding Wire",
  Brick: "e.g. Red Clay Brick, Fly Ash Brick, AAC Block",
  Sand: "e.g. River Sand, M-Sand, Plaster Sand",
  Bajri: "e.g. 10mm Grit, 20mm Aggregate",
  Tiles: "e.g. Floor 2x2 Vitrified, Wall 12x18, Parking Tiles",
  Electrical: "e.g. 1.5 sq mm Wire, 16A Switch, Modular Box",
  Plumbing: "e.g. UPVC 1'' Elbow, PVC 4'' Pipe, Water Tank 1000L",
  Paint: "e.g. Exterior Primer, Weatherproof Emulsion",
  Hardware: "e.g. 3'' Screws, Tower Bolt, Hinges"
};

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  materialToEdit,
  defaultCategory
}) => {
  const { currentSiteId, showToast } = useAppStore();

  const initialCat = defaultCategory || PREDEFINED_CATEGORIES[0];
  const [category, setCategory] = useState(initialCat);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(CATEGORY_DEFAULT_UNITS[initialCat] || STANDARD_UNITS[0]);
  const [minimumStock, setMinimumStock] = useState<number>(10);
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (materialToEdit) {
      setCategory(materialToEdit.category);
      setName(materialToEdit.name);
      setUnit(materialToEdit.unit);
      setMinimumStock(materialToEdit.minimumStock || 0);
      setDefaultRate(materialToEdit.defaultRate || 0);
      setNotes(materialToEdit.notes || '');
      setOpeningStock(0);
    } else {
      const cat = defaultCategory || PREDEFINED_CATEGORIES[0];
      setCategory(cat);
      setName('');
      setUnit(CATEGORY_DEFAULT_UNITS[cat] || STANDARD_UNITS[0]);
      setMinimumStock(10);
      setDefaultRate(0);
      setOpeningStock(0);
      setNotes('');
    }
  }, [materialToEdit, isOpen, defaultCategory]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (!materialToEdit) {
      setUnit(CATEGORY_DEFAULT_UNITS[newCat] || STANDARD_UNITS[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!name.trim()) {
      setError('Material Name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (materialToEdit) {
        await db.materials.update(materialToEdit.id, {
          category,
          name: name.trim(),
          unit,
          minimumStock: Number(minimumStock) || 0,
          defaultRate: Number(defaultRate) || 0,
          notes: notes.trim() || undefined,
          updatedAt: Date.now()
        });
        await logAudit(currentSiteId, 'material', materialToEdit.id, 'update', materialToEdit, { name, category, unit });
        showToast('Material updated successfully', 'success');
      } else {
        const matId = 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newMat: Material = {
          id: matId,
          siteId: currentSiteId,
          category,
          name: name.trim(),
          unit,
          minimumStock: Number(minimumStock) || 0,
          defaultRate: Number(defaultRate) || 0,
          notes: notes.trim() || undefined,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await db.materials.add(newMat);

        // If opening stock specified, add an 'opening' stock movement
        if (openingStock > 0) {
          const movement: StockMovement = {
            id: 'sm_op_' + Date.now(),
            siteId: currentSiteId,
            materialId: matId,
            type: 'opening',
            quantity: Number(openingStock),
            unit,
            rate: Number(defaultRate) || 0,
            referenceType: 'manual',
            date: new Date().toISOString().split('T')[0],
            notes: 'Initial Opening Stock on Master Creation',
            createdAt: Date.now()
          };
          await db.stockMovements.add(movement);
        }

        await logAudit(currentSiteId, 'material', matId, 'create', null, newMat);
        showToast('Material Master created!', 'success');
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save material');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-construction-500/20 text-construction-400 rounded-xl">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {materialToEdit ? 'Edit Material' : 'Add Material Master'}
              </h3>
              <p className="text-xs text-charcoal-400">Inventory item for this construction site</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              >
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Unit of Measurement *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-charcoal-300">
                Item Name *
              </label>
              <span className="text-[11px] font-bold text-construction-400 bg-construction-500/10 px-2 py-0.5 rounded-md border border-construction-500/20">
                Under Category: {category}
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="bg-charcoal-950 text-charcoal-400 text-xs px-3 py-2.5 rounded-l-xl border border-r-0 border-charcoal-700 font-bold select-none shrink-0">
                {category} &gt;
              </span>
              <input
                type="text"
                required
                placeholder={CATEGORY_PLACEHOLDERS[category] || "e.g. PPC, Grade 53, 10mm TMT"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-r-xl p-2.5 text-sm text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
              />
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              Note: Simply write the item name (e.g. <strong className="text-white">PPC</strong>). It will automatically be listed under <strong className="text-construction-400">{category}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Min. Alert Stock
              </label>
              <input
                type="number"
                placeholder="10"
                value={minimumStock}
                onChange={(e) => setMinimumStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2 text-xs sm:text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Default Rate (₹)
              </label>
              <input
                type="number"
                placeholder="0"
                value={defaultRate}
                onChange={(e) => setDefaultRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2 text-xs sm:text-sm text-white"
              />
            </div>

            {!materialToEdit && (
              <div>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                  Opening Stock
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={openingStock}
                  onChange={(e) => setOpeningStock(parseFloat(e.target.value) || 0)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2 text-xs sm:text-sm text-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Astral Heavy Duty SDR 11"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white"
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
              {isSubmitting ? 'Saving...' : materialToEdit ? 'Update Material' : 'Save Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
