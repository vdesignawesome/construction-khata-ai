import React, { useState } from 'react';
import { X, CheckSquare, Square, Sparkles, PlusCircle, AlertCircle, Check } from 'lucide-react';
import { db, PREDEFINED_CATEGORIES } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { STANDARD_CONSTRUCTION_CATALOGUE } from '../../data/standardCatalogue';
import type { Material } from '../../types';

interface BulkAddMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCategory?: string;
  existingMaterialNames: Set<string>;
}

export const BulkAddMaterialsModal: React.FC<BulkAddMaterialsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCategory,
  existingMaterialNames
}) => {
  const { currentSiteId, showToast } = useAppStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory && initialCategory !== 'all' ? initialCategory : 'Sanitary'
  );

  // Filter catalogue items for selected category
  const categoryCatalogue = STANDARD_CONSTRUCTION_CATALOGUE.filter(
    (item) => item.category === selectedCategory
  );

  // Selected item names in checklist
  const [selectedItemNames, setSelectedItemNames] = useState<Set<string>>(() => {
    // By default, select all items in this category that are not already added
    const initial = new Set<string>();
    categoryCatalogue.forEach((item) => {
      if (!existingMaterialNames.has(item.name.toLowerCase().trim())) {
        initial.add(item.name);
      }
    });
    return initial;
  });

  // Custom text input for pasting multiple items
  const [customText, setCustomText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: string) => {
    setSelectedCategory(newCat);
    const newCatItems = STANDARD_CONSTRUCTION_CATALOGUE.filter((it) => it.category === newCat);
    const nextSelected = new Set<string>();
    newCatItems.forEach((it) => {
      if (!existingMaterialNames.has(it.name.toLowerCase().trim())) {
        nextSelected.add(it.name);
      }
    });
    setSelectedItemNames(nextSelected);
  };

  const toggleItem = (name: string) => {
    const updated = new Set(selectedItemNames);
    if (updated.has(name)) {
      updated.delete(name);
    } else {
      updated.add(name);
    }
    setSelectedItemNames(updated);
  };

  const selectAll = () => {
    const updated = new Set<string>();
    categoryCatalogue.forEach((it) => {
      if (!existingMaterialNames.has(it.name.toLowerCase().trim())) {
        updated.add(it.name);
      }
    });
    setSelectedItemNames(updated);
  };

  const deselectAll = () => {
    setSelectedItemNames(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;

    setIsSubmitting(true);
    setError('');

    try {
      const toAdd: Material[] = [];

      // 1. Add checked items from standard catalogue
      categoryCatalogue.forEach((item) => {
        if (
          selectedItemNames.has(item.name) &&
          !existingMaterialNames.has(item.name.toLowerCase().trim())
        ) {
          toAdd.push({
            id: 'mat_bulk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            siteId: currentSiteId,
            category: selectedCategory,
            name: item.name,
            unit: item.unit,
            minimumStock: item.minimumStock || 10,
            defaultRate: item.defaultRate || 0,
            status: 'active',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      });

      // 2. Add custom pasted items (comma or newline separated)
      if (customText.trim()) {
        const lines = customText
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean);

        for (const name of lines) {
          if (!existingMaterialNames.has(name.toLowerCase())) {
            toAdd.push({
              id: 'mat_cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              siteId: currentSiteId,
              category: selectedCategory,
              name,
              unit: 'pcs',
              minimumStock: 10,
              defaultRate: 0,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
        }
      }

      if (toAdd.length === 0) {
        setError('Please select or enter at least one item to add');
        setIsSubmitting(false);
        return;
      }

      await db.materials.bulkAdd(toAdd);
      showToast(`Added ${toAdd.length} items to ${selectedCategory}!`, 'success');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to bulk add materials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-construction-500/20 text-construction-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Bulk Add Materials by Category
              </h3>
              <p className="text-xs text-charcoal-400">
                Select category and check all common construction items to add them in 1-click
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Picker Tabs / Select */}
          <div>
            <label className="block text-xs font-bold text-charcoal-300 mb-1.5">
              Select Category:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-charcoal-950/60 rounded-xl border border-charcoal-800">
              {PREDEFINED_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedCategory === cat
                      ? 'bg-construction-500 text-charcoal-950 shadow'
                      : 'bg-charcoal-800 text-charcoal-300 hover:text-white hover:bg-charcoal-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Standard Items Checklist for this Category */}
          <div className="border border-charcoal-800 rounded-xl p-3 bg-charcoal-950/50 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-charcoal-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Standard {selectedCategory} Items ({categoryCatalogue.length})
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-construction-400 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span className="text-charcoal-600">|</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-charcoal-400 hover:underline font-semibold"
                >
                  Deselect
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {categoryCatalogue.length === 0 ? (
                <div className="text-center py-6 text-xs text-charcoal-500">
                  No standard predefined items for {selectedCategory}. You can type items below.
                </div>
              ) : (
                categoryCatalogue.map((item) => {
                  const isAlreadyAdded = existingMaterialNames.has(item.name.toLowerCase().trim());
                  const isChecked = selectedItemNames.has(item.name);

                  return (
                    <div
                      key={item.name}
                      onClick={() => !isAlreadyAdded && toggleItem(item.name)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition cursor-pointer select-none ${
                        isAlreadyAdded
                          ? 'bg-charcoal-950/40 text-charcoal-500 cursor-not-allowed opacity-60'
                          : isChecked
                          ? 'bg-construction-500/10 border border-construction-500/30 text-white'
                          : 'bg-charcoal-800/60 hover:bg-charcoal-800 text-charcoal-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {isAlreadyAdded ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : isChecked ? (
                          <CheckSquare className="w-4 h-4 text-construction-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-charcoal-500 shrink-0" />
                        )}
                        <span className="font-semibold truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 text-[11px] text-charcoal-400">
                        <span>({item.unit})</span>
                        {isAlreadyAdded && (
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            Added
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Custom text box for custom items */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Or paste custom items for <span className="text-construction-400 font-bold">{selectedCategory}</span> (comma or new-line separated):
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Astral CPVC Pipe 1'', Jaquar Continental Tap, Supreme 4'' Elbow"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-charcoal-800">
            <div className="text-xs text-charcoal-400">
              Selected: <strong className="text-construction-400">{selectedItemNames.size}</strong> standard items
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-charcoal-400 hover:text-white rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (selectedItemNames.size === 0 && !customText.trim())}
                className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow flex items-center space-x-1.5 disabled:opacity-50 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Adding Items...'
                    : `Add ${selectedItemNames.size} Items to ${selectedCategory}`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
