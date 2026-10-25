import React, { useState, useEffect } from 'react';
import { X, TrendingUp, History, DollarSign } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getMaterialRateHistory } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Material } from '../../types';

interface MaterialRateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

export const MaterialRateHistoryModal: React.FC<MaterialRateHistoryModalProps> = ({
  isOpen,
  onClose,
  material
}) => {
  const { currentSiteId } = useAppStore();

  const [rateData, setRateData] = useState<{
    lastPurchaseRate?: number;
    averageRate?: number;
    history: Array<{
      date: string;
      supplierName: string;
      quantity: number;
      rate: number;
      unit: string;
      lineTotal: number;
    }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadHistory();
    }
  }, [isOpen, currentSiteId, material.id]);

  const loadHistory = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const data = await getMaterialRateHistory(currentSiteId, material.id);
      setRateData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-construction-400">
              Material Rate History & Price Intelligence
            </div>
            <h3 className="text-lg font-black text-white">{material.name}</h3>
            <p className="text-xs text-charcoal-400">Category: {material.category} • Unit: {material.unit}</p>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rate Summary Cards - Requirement 18 */}
        <div className="p-5 grid grid-cols-2 gap-3 border-b border-charcoal-800 bg-charcoal-950/40">
          <div className="bg-charcoal-900 border border-charcoal-800 p-3.5 rounded-xl">
            <div className="text-[11px] text-charcoal-400 font-semibold">Last Purchase Rate</div>
            <div className="text-xl font-black text-construction-400 mt-1">
              {rateData?.lastPurchaseRate ? `₹${rateData.lastPurchaseRate} / ${material.unit}` : 'N/A'}
            </div>
            <div className="text-[10px] text-charcoal-500 mt-0.5">Most recent invoice price</div>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 p-3.5 rounded-xl">
            <div className="text-[11px] text-charcoal-400 font-semibold">Weighted Average Rate</div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {rateData?.averageRate ? `₹${rateData.averageRate} / ${material.unit}` : 'N/A'}
            </div>
            <div className="text-[10px] text-charcoal-500 mt-0.5">Total spent / Total qty</div>
          </div>
        </div>

        {/* History List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-1.5">
            <History className="w-4 h-4 text-charcoal-400" />
            <span>Historical Purchases ({rateData?.history.length || 0})</span>
          </h4>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-charcoal-400">Loading rate history...</div>
          ) : !rateData || rateData.history.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-500 border border-dashed border-charcoal-800 rounded-xl">
              No historical purchases logged for this material yet.
            </div>
          ) : (
            <div className="space-y-2">
              {rateData.history.map((h, i) => (
                <div
                  key={i}
                  className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{h.supplierName}</div>
                    <div className="text-[11px] text-charcoal-400 mt-0.5">
                      {formatDate(h.date)} • {h.quantity} {h.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-construction-400 text-sm">
                      ₹{h.rate} / {h.unit}
                    </div>
                    <div className="text-[10px] text-charcoal-400">
                      Total: {formatCurrency(h.lineTotal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
