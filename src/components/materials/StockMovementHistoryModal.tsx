import React, { useState, useEffect } from 'react';
import { X, History, Boxes, ArrowUpRight, ArrowDownLeft, CornerUpLeft } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { formatDate } from '../../utils/formatters';
import type { Material, StockMovement } from '../../types';

interface StockMovementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

export const StockMovementHistoryModal: React.FC<StockMovementHistoryModalProps> = ({
  isOpen,
  onClose,
  material
}) => {
  const { currentSiteId } = useAppStore();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadMovements();
    }
  }, [isOpen, currentSiteId, material.id]);

  const loadMovements = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.stockMovements
        .where({ siteId: currentSiteId, materialId: material.id })
        .reverse()
        .sortBy('date');
      setMovements(list);
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
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-construction-400">
              Stock Audit Trail
            </div>
            <h3 className="text-lg font-black text-white">{material.name}</h3>
            <p className="text-xs text-charcoal-400">All inventory increments and decrements</p>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-charcoal-400">Loading stock log...</div>
          ) : movements.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-500 border border-dashed border-charcoal-800 rounded-xl">
              No stock movements recorded yet.
            </div>
          ) : (
            movements.map((m) => {
              const isIncrease = m.type === 'purchase' || m.type === 'opening' || m.type === 'transfer_in';
              return (
                <div
                  key={m.id}
                  className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isIncrease ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {isIncrease ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase text-[11px]">
                        {m.type.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-charcoal-400">
                        {formatDate(m.date)} {m.notes ? `• ${m.notes}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black text-sm ${
                        isIncrease ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isIncrease ? '+' : '-'}{m.quantity} {m.unit}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
