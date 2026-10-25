import React, { useState, useEffect } from 'react';
import { HardHat, Plus, Search, Calendar, ArrowDownLeft, Trash2, Edit2 } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { deleteLabourWork } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { LabourWork } from '../../types';
import { LabourWorkModal } from './LabourWorkModal';
import { PaymentFormModal } from '../payments/PaymentFormModal';

export const LabourWorkView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [works, setWorks] = useState<LabourWork[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [workToEdit, setWorkToEdit] = useState<LabourWork | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedLabourIdForPay, setSelectedLabourIdForPay] = useState<string | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadWorks();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadWorks = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.labourWork
        .where({ siteId: currentSiteId })
        .reverse()
        .sortBy('date');
      setWorks(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = works.filter((w) => {
    return (
      w.labourName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.workDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.notes && w.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalLabourWorkAmount = works.reduce((sum, w) => sum + w.amount, 0);

  const handleDeleteLabourWork = async (w: LabourWork) => {
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to delete labour work entry "${w.workDescription}" of ${formatCurrency(w.amount)} for ${w.labourName}?`
      )
    ) {
      return;
    }

    try {
      await deleteLabourWork(currentSiteId, w.id);
      showToast('Labour work entry deleted', 'info');
      loadWorks();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete labour work', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <HardHat className="w-6 h-6 text-purple-400" />
            <span>Labour Work Ledger (Financial)</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Financial contract work tracking (Strictly no attendance)
          </p>
        </div>

        <button
          onClick={() => {
            setWorkToEdit(null);
            setIsWorkModalOpen(true);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Labour Work</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-charcoal-400">Total Work Value Logged</div>
          <div className="text-2xl font-black text-purple-400 mt-0.5">
            {formatCurrency(totalLabourWorkAmount)}
          </div>
        </div>
        <div className="text-right text-xs text-charcoal-400">
          <span className="font-bold text-white">{works.length}</span> work contracts / measurement entries
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
        <input
          type="text"
          placeholder="Search by worker/contractor name or work description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
        />
      </div>

      {/* List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading labour entries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No labour work entries found. Use "+ Add Labour Work" or say "Rakesh ka 8000 ka kaam add karo" in AI Entry.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800">
            {filtered.map((work) => (
              <div
                key={work.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-charcoal-800/40 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/40 text-purple-400 flex items-center justify-center shrink-0">
                    <HardHat className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{work.labourName}</div>
                    <div className="text-xs text-charcoal-300 mt-0.5">{work.workDescription}</div>
                    <div className="text-[11px] text-charcoal-400 mt-0.5">
                      Date: {formatDate(work.date)} {work.notes ? `• ${work.notes}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-white">
                      {formatCurrency(work.amount)}
                    </div>
                    <div className="text-[10px] text-charcoal-400">Work Amount</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedLabourIdForPay(work.labourAccountId);
                        setIsPayModalOpen(true);
                      }}
                      className="bg-charcoal-800 hover:bg-charcoal-750 text-emerald-400 border border-charcoal-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>
                    <button
                      onClick={() => {
                        setWorkToEdit(work);
                        setIsWorkModalOpen(true);
                      }}
                      className="bg-charcoal-800 hover:bg-charcoal-700 text-purple-400 border border-charcoal-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Edit labour work"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteLabourWork(work)}
                      className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
                      title="Delete labour work"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isWorkModalOpen && (
        <LabourWorkModal
          isOpen={isWorkModalOpen}
          workToEdit={workToEdit}
          onClose={() => {
            setIsWorkModalOpen(false);
            setWorkToEdit(null);
          }}
          onSuccess={() => {
            setIsWorkModalOpen(false);
            setWorkToEdit(null);
            loadWorks();
          }}
        />
      )}

      {isPayModalOpen && selectedLabourIdForPay && (
        <PaymentFormModal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedLabourIdForPay(null);
          }}
          initialAccountId={selectedLabourIdForPay}
          onSuccess={() => {
            setIsPayModalOpen(false);
            setSelectedLabourIdForPay(null);
            loadWorks();
          }}
        />
      )}
    </div>
  );
};
