import React, { useState, useEffect } from 'react';
import { X, HardHat, ArrowDownLeft, Phone, Plus, AlertCircle } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { calculateLabourLedger } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, LabourWork, Payment, LabourLedgerSummary } from '../../types';
import { PaymentFormModal } from '../payments/PaymentFormModal';
import { LabourWorkModal } from '../labour/LabourWorkModal';

interface LabourLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  labour: Account;
}

export const LabourLedgerModal: React.FC<LabourLedgerModalProps> = ({
  isOpen,
  onClose,
  labour
}) => {
  const { currentSiteId, refreshTrigger } = useAppStore();

  const [summary, setSummary] = useState<LabourLedgerSummary | null>(null);
  const [works, setWorks] = useState<LabourWork[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Modals
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadLedger();
    }
  }, [isOpen, currentSiteId, labour.id, refreshTrigger]);

  const loadLedger = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const lSummary = await calculateLabourLedger(currentSiteId, labour.id);
      setSummary(lSummary);

      const wList = await db.labourWork
        .where({ siteId: currentSiteId, labourAccountId: labour.id })
        .reverse()
        .sortBy('date');
      setWorks(wList);

      const payList = await db.payments
        .where({ siteId: currentSiteId, accountId: labour.id })
        .reverse()
        .sortBy('date');
      setPayments(payList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Labour Financial Ledger (No Attendance)
            </div>
            <h3 className="text-xl font-black text-white">{labour.name}</h3>
            {labour.phone && (
              <div className="flex items-center space-x-2 text-xs text-charcoal-400 mt-1">
                <Phone className="w-3.5 h-3.5" />
                <span>{labour.phone}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsWorkModalOpen(true)}
              className="bg-charcoal-800 hover:bg-charcoal-700 text-construction-400 border border-charcoal-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Work</span>
            </button>

            <button
              onClick={() => setIsPayModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Pay Labour</span>
            </button>

            <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Summary Cards - Requirement 11 */}
        <div className="p-5 grid grid-cols-3 gap-3 border-b border-charcoal-800 bg-charcoal-950/40">
          <div className="bg-charcoal-900 border border-charcoal-800 p-3 rounded-xl">
            <div className="text-[11px] text-charcoal-400">Total Work Amount</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {formatCurrency(summary?.totalWorkAmount || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">{summary?.workEntriesCount} works logged</div>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 p-3 rounded-xl">
            <div className="text-[11px] text-charcoal-400">Total Paid</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
              {formatCurrency(summary?.totalPayments || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">{summary?.paymentsCount} payments</div>
          </div>

          <div className="bg-charcoal-900 border border-amber-900/40 p-3 rounded-xl">
            <div className="text-[11px] text-amber-400">Net Pending Due</div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
              {formatCurrency(summary?.outstanding || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">Payable to worker</div>
          </div>
        </div>

        {/* Work & Payment Entries */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Work logs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 mb-2 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-purple-400" />
              <span>Labour Work Entries ({works.length})</span>
            </h4>

            {works.length === 0 ? (
              <div className="text-xs text-charcoal-500 py-3 text-center border border-dashed border-charcoal-800 rounded-xl">
                No work amounts logged yet. Click "+ Add Work" to log agreed work amounts.
              </div>
            ) : (
              <div className="space-y-2">
                {works.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{w.workDescription || 'Labour Work'}</div>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">{formatDate(w.date)}</div>
                    </div>
                    <div className="font-black text-white text-sm">
                      {formatCurrency(w.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 mb-2 flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payments Paid to {labour.name} ({payments.length})</span>
            </h4>

            {payments.length === 0 ? (
              <div className="text-xs text-charcoal-500 py-3 text-center border border-dashed border-charcoal-800 rounded-xl">
                No payments paid to this labour account yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">Labour Payment</div>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">
                        {formatDate(pay.date)} • Mode: {pay.paymentMode.toUpperCase()}
                        {pay.reference ? ` • Ref: ${pay.reference}` : ''}
                      </div>
                    </div>
                    <div className="font-black text-emerald-400 text-sm">
                      {formatCurrency(pay.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isWorkModalOpen && (
        <LabourWorkModal
          isOpen={isWorkModalOpen}
          onClose={() => setIsWorkModalOpen(false)}
          initialLabourId={labour.id}
          onSuccess={() => {
            setIsWorkModalOpen(false);
            loadLedger();
          }}
        />
      )}

      {isPayModalOpen && (
        <PaymentFormModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          initialAccountId={labour.id}
          initialAmount={summary?.outstanding && summary.outstanding > 0 ? summary.outstanding : 0}
          onSuccess={() => {
            setIsPayModalOpen(false);
            loadLedger();
          }}
        />
      )}
    </div>
  );
};
