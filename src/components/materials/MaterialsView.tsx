import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  History,
  CornerUpLeft,
  ArrowDownRight,
  TrendingUp,
  Tag,
  Edit2,
  Trash2,
  Sparkles,
  Layers
} from 'lucide-react';
import { db, PREDEFINED_CATEGORIES } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { getAllMaterialStocksForSite, deleteMaterial } from '../../engine/accounting';
import { loadStandardCatalogueForSite } from '../../data/standardCatalogue';
import type { Material, MaterialStockSummary } from '../../types';

import { MaterialFormModal } from './MaterialFormModal';
import { BulkAddMaterialsModal } from './BulkAddMaterialsModal';
import { MaterialUsageModal } from './MaterialUsageModal';
import { MaterialReturnModal } from './MaterialReturnModal';
import { MaterialRateHistoryModal } from './MaterialRateHistoryModal';
import { StockMovementHistoryModal } from './StockMovementHistoryModal';

export const MaterialsView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [stocks, setStocks] = useState<MaterialStockSummary[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoSeeding, setIsAutoSeeding] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkAddCategory, setBulkAddCategory] = useState<string>('Sanitary');
  const [addModalCategory, setAddModalCategory] = useState<string | undefined>(undefined);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);
  const [usageMaterialId, setUsageMaterialId] = useState<string | null>(null);
  const [returnMaterialId, setReturnMaterialId] = useState<string | null>(null);
  const [selectedMaterialForRate, setSelectedMaterialForRate] = useState<Material | null>(null);
  const [selectedMaterialForLog, setSelectedMaterialForLog] = useState<Material | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadData();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadData = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const stockSummaries = await getAllMaterialStocksForSite(currentSiteId);
      setStocks(stockSummaries);

      const matList = await db.materials.where({ siteId: currentSiteId, status: 'active' }).toArray();
      setMaterials(matList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSeedAll = async () => {
    if (!currentSiteId) return;
    setIsAutoSeeding(true);
    try {
      const res = await loadStandardCatalogueForSite(currentSiteId);
      if (res.addedCount > 0) {
        showToast(`Loaded ${res.addedCount} standard construction items!`, 'success');
        loadData();
      } else {
        showToast('All standard construction items are already in your inventory!', 'info');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to auto-load catalogue', 'error');
    } finally {
      setIsAutoSeeding(false);
    }
  };

  const filtered = stocks.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesLow = !showOnlyLowStock || s.isLowStock;
    return matchesSearch && matchesCat && matchesLow;
  });

  const lowStockCount = stocks.filter(s => s.isLowStock).length;

  const handleDeleteMaterial = async (mat: Material) => {
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to archive / delete material "${mat.name}"? Past purchase and consumption history will remain preserved in audit logs.`
      )
    ) {
      return;
    }

    try {
      await deleteMaterial(currentSiteId, mat.id);
      showToast('Material archived from active stock list', 'info');
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to archive material', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-construction-400" />
            <span>Material Inventory & Stock</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Stock strictly derived from movements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoSeedAll}
            disabled={isAutoSeeding}
            className="bg-gradient-to-r from-amber-500 to-construction-400 hover:from-amber-400 hover:to-construction-300 text-charcoal-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95 disabled:opacity-50"
            title="Automatically load standard items for Cement, Steel, Sanitary, Electrical, Bricks, etc."
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAutoSeeding ? 'Loading...' : '⚡ Auto-Add Standard Items'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBulkAddCategory(selectedCategory === 'all' ? 'Sanitary' : selectedCategory);
              setIsBulkAddOpen(true);
            }}
            className="bg-charcoal-800 hover:bg-charcoal-700 text-construction-400 border border-charcoal-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Bulk add multiple items by category"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bulk Add Items</span>
          </button>

          <button
            onClick={() => setUsageMaterialId(stocks[0]?.materialId || '')}
            className="bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 border border-charcoal-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-construction-400" />
            <span>Use</span>
          </button>

          <button
            onClick={() => {
              setMaterialToEdit(null);
              setAddModalCategory(selectedCategory === 'all' ? undefined : selectedCategory);
              setIsAddModalOpen(true);
            }}
            className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{selectedCategory === 'all' ? 'Add Material' : `Add ${selectedCategory} Item`}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-charcoal-900 border border-charcoal-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-charcoal-400 font-semibold">Total Materials</div>
          <div className="text-xl font-black text-white mt-0.5">{stocks.length}</div>
          <div className="text-[10px] text-charcoal-500">Tracked items</div>
        </div>

        <div className="bg-charcoal-900 border border-amber-900/40 p-3.5 rounded-xl">
          <div className="text-[11px] text-amber-400 font-semibold">Low Stock Alerts</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{lowStockCount}</div>
          <div className="text-[10px] text-charcoal-500">Below threshold</div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-charcoal-400 font-semibold">Total Usage Logged</div>
          <div className="text-xl font-black text-slate-100 mt-0.5">
            {stocks.reduce((sum, s) => sum + s.totalUsed, 0)}
          </div>
          <div className="text-[10px] text-charcoal-500">Units consumed</div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-800 p-3.5 rounded-xl">
          <div className="text-[11px] text-charcoal-400 font-semibold">Total Returns</div>
          <div className="text-xl font-black text-sky-400 mt-0.5">
            {stocks.reduce((sum, s) => sum + s.totalReturned, 0)}
          </div>
          <div className="text-[10px] text-charcoal-500">Units returned</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search material by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">All Categories</option>
            {PREDEFINED_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              showOnlyLowStock
                ? 'bg-amber-500 text-charcoal-950 shadow'
                : 'bg-charcoal-900 text-charcoal-400 hover:text-white border border-charcoal-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Materials Stock Cards / Table - Grouped by Category */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-charcoal-400">
          Calculating site stock...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 px-4 text-center bg-charcoal-900/50 border border-dashed border-charcoal-800 rounded-2xl max-w-xl mx-auto space-y-3">
          <Boxes className="w-12 h-12 text-construction-400 mx-auto" />
          <div className="text-base font-bold text-white">No materials found</div>
          <p className="text-xs text-charcoal-400 max-w-md mx-auto">
            Load all standard construction materials (Sanitary, Electrical, Cement, Steel, Bricks, etc.) automatically in 1-click!
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleAutoSeedAll}
              disabled={isAutoSeeding}
              className="bg-gradient-to-r from-amber-500 to-construction-400 hover:from-amber-400 hover:to-construction-300 text-charcoal-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
            >
              ⚡ Auto-Add All Standard Materials
            </button>
            <button
              type="button"
              onClick={() => {
                setBulkAddCategory('Sanitary');
                setIsBulkAddOpen(true);
              }}
              className="bg-charcoal-800 hover:bg-charcoal-700 text-white font-bold px-4 py-2 rounded-xl text-xs border border-charcoal-700"
            >
              Bulk Add by Category
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(
            filtered.reduce<Record<string, MaterialStockSummary[]>>((acc, s) => {
              const cat = s.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(s);
              return acc;
            }, {})
          ).map(([catName, catItems]) => (
            <div key={catName} className="space-y-3">
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-charcoal-900/70 border border-charcoal-800 px-4 py-2.5 rounded-xl">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-construction-400 inline-block shadow-sm" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{catName}</h3>
                  <span className="text-[11px] font-bold text-charcoal-400 bg-charcoal-800 px-2.5 py-0.5 rounded-full">
                    {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkAddCategory(catName);
                      setIsBulkAddOpen(true);
                    }}
                    className="text-xs bg-charcoal-800 hover:bg-charcoal-750 text-construction-400 font-bold px-2.5 py-1 rounded-lg border border-charcoal-700/80 flex items-center gap-1 transition active:scale-95"
                    title={`Bulk add multiple items to ${catName}`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Bulk Add {catName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMaterialToEdit(null);
                      setAddModalCategory(catName);
                      setIsAddModalOpen(true);
                    }}
                    className="text-xs text-charcoal-300 hover:text-white font-semibold flex items-center gap-1 hover:underline active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Single Item</span>
                  </button>
                </div>
              </div>

              {/* Items Grid for this Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {catItems.map((stock) => {
                  const rawMat = materials.find((m) => m.id === stock.materialId);

                  return (
                    <div
                      key={stock.materialId}
                      className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-2xl p-4 sm:p-5 shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-construction-400">
                              {stock.category}
                            </span>
                            <h3 className="text-base font-extrabold text-white mt-0.5">{stock.name}</h3>
                          </div>

                          {stock.isLowStock && (
                            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low
                            </span>
                          )}
                        </div>

                        {/* Stock Numbers (Strictly derived) */}
                        <div className="mt-4 p-3 bg-charcoal-950/60 rounded-xl border border-charcoal-800 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-charcoal-400">Current Stock</div>
                            <div
                              className={`text-xl font-black ${
                                stock.currentStock < 0
                                  ? 'text-red-400'
                                  : stock.isLowStock
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {stock.currentStock} <span className="text-xs font-semibold text-charcoal-400">{stock.unit}</span>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-charcoal-400 space-y-0.5">
                            <div>Purchased: <span className="font-bold text-slate-200">+{stock.totalPurchased}</span></div>
                            <div>Used: <span className="font-bold text-slate-200">-{stock.totalUsed}</span></div>
                          </div>
                        </div>

                        {/* Rates */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-charcoal-400">
                          <span>Last Rate: <strong className="text-white">₹{stock.lastPurchaseRate || 'N/A'}</strong></span>
                          <span>Min Alert: <strong className="text-slate-300">{stock.minimumStock} {stock.unit}</strong></span>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="mt-4 pt-3 border-t border-charcoal-800 flex items-center justify-between gap-1 text-xs">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setUsageMaterialId(stock.materialId)}
                            className="px-2.5 py-1.5 bg-charcoal-800 hover:bg-charcoal-750 text-construction-400 font-bold rounded-lg border border-charcoal-700 transition"
                            title="Record usage"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => setReturnMaterialId(stock.materialId)}
                            className="px-2.5 py-1.5 bg-charcoal-800 hover:bg-charcoal-750 text-sky-400 font-bold rounded-lg border border-charcoal-700 transition"
                            title="Return to supplier"
                          >
                            Return
                          </button>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => rawMat && setSelectedMaterialForRate(rawMat)}
                            className="p-1.5 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-lg transition"
                            title="Rate History"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rawMat && setSelectedMaterialForLog(rawMat)}
                            className="p-1.5 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-lg transition"
                            title="Stock Movement Log"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (rawMat) {
                                setMaterialToEdit(rawMat);
                                setAddModalCategory(rawMat.category);
                                setIsAddModalOpen(true);
                              }
                            }}
                            className="p-1.5 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-lg transition"
                            title="Edit Material Master"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => rawMat && handleDeleteMaterial(rawMat)}
                            className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
                            title="Archive/Delete Material"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && (
        <MaterialFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          materialToEdit={materialToEdit}
          defaultCategory={addModalCategory}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadData();
          }}
        />
      )}

      {isBulkAddOpen && (
        <BulkAddMaterialsModal
          isOpen={isBulkAddOpen}
          onClose={() => setIsBulkAddOpen(false)}
          initialCategory={bulkAddCategory}
          existingMaterialNames={new Set(materials.map((m) => m.name.toLowerCase().trim()))}
          onSuccess={() => {
            setIsBulkAddOpen(false);
            loadData();
          }}
        />
      )}

      {usageMaterialId && (
        <MaterialUsageModal
          isOpen={!!usageMaterialId}
          onClose={() => setUsageMaterialId(null)}
          initialMaterialId={usageMaterialId}
          onSuccess={() => {
            setUsageMaterialId(null);
            loadData();
          }}
        />
      )}

      {returnMaterialId && (
        <MaterialReturnModal
          isOpen={!!returnMaterialId}
          onClose={() => setReturnMaterialId(null)}
          initialMaterialId={returnMaterialId}
          onSuccess={() => {
            setReturnMaterialId(null);
            loadData();
          }}
        />
      )}

      {selectedMaterialForRate && (
        <MaterialRateHistoryModal
          isOpen={!!selectedMaterialForRate}
          onClose={() => setSelectedMaterialForRate(null)}
          material={selectedMaterialForRate}
        />
      )}

      {selectedMaterialForLog && (
        <StockMovementHistoryModal
          isOpen={!!selectedMaterialForLog}
          onClose={() => setSelectedMaterialForLog(null)}
          material={selectedMaterialForLog}
        />
      )}
    </div>
  );
};
