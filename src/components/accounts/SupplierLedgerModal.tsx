import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, ArrowDownLeft, FileText, Phone, MapPin, Plus } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { calculateSupplierLedger } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, Purchase, Payment, SupplierLedgerSummary } from '../../types';
import { PaymentFormModal } from '../payments/PaymentFormModal';

interface SupplierLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Account;
}

export const SupplierLedgerModal: React.FC<SupplierLedgerModalProps> = ({
  isOpen,
  onClose,
  supplier
}) => {
  const { currentSiteId, refreshTrigger } = useAppStore();

  const [summary, setSummary] = useState<SupplierLedgerSummary | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadLedger();
    }
  }, [isOpen, currentSiteId, supplier.id, refreshTrigger]);

  const loadLedger = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const sSummary = await calculateSupplierLedger(currentSiteId, supplier.id);
      setSummary(sSummary);

      const pList = await db.purchases
        .where({ siteId: currentSiteId, supplierId: supplier.id })
        .reverse()
        .sortBy('date');
      setPurchases(pList);

      const payList = await db.payments
        .where({ siteId: currentSiteId, accountId: supplier.id })
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
            <div className="text-xs font-bold uppercase tracking-wider text-construction-400">
              Supplier Statement
            </div>
            <h3 className="text-xl font-black text-white">{supplier.name}</h3>
            <div className="flex items-center space-x-3 text-xs text-charcoal-400 mt-1">
              {supplier.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {supplier.phone}
                </span>
              )}
              {supplier.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {supplier.address}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
            <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ledger Summary Cards - Requirement 10 */}
        <div className="p-5 grid grid-cols-3 gap-3 border-b border-charcoal-800 bg-charcoal-950/40">
          <div className="bg-charcoal-900 border border-charcoal-800 p-3 rounded-xl">
            <div className="text-[11px] text-charcoal-400">Total Purchases</div>
            <div className="text-base sm:text-lg font-black text-white mt-0.5">
              {formatCurrency(summary?.totalPurchases || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">{summary?.purchasesCount} bills</div>
          </div>

          <div className="bg-charcoal-900 border border-charcoal-800 p-3 rounded-xl">
            <div className="text-[11px] text-charcoal-400">Total Paid</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
              {formatCurrency(summary?.totalPayments || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">{summary?.paymentsCount} payments</div>
          </div>

          <div className="bg-charcoal-900 border border-amber-900/40 p-3 rounded-xl">
            <div className="text-[11px] text-amber-400">Net Outstanding</div>
            <div className="text-base sm:text-lg font-black text-amber-400 mt-0.5">
              {formatCurrency(summary?.outstanding || 0)}
            </div>
            <div className="text-[10px] text-charcoal-500">Payable amount</div>
          </div>
        </div>

        {/* Two Tabs or Timeline of Invoices and Payments */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Purchases Section */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-construction-400" />
              <span>Purchase Invoices ({purchases.length})</span>
            </h4>

            {purchases.length === 0 ? (
              <div className="text-xs text-charcoal-500 py-3 text-center border border-dashed border-charcoal-800 rounded-xl">
                No purchases recorded for this supplier on this site.
              </div>
            ) : (
              <div className="space-y-2">
                {purchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{p.invoiceNumber ? `Inv: #${p.invoiceNumber}` : 'Purchase Bill'}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            p.paymentStatus === 'paid'
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">
                        {formatDate(p.date)} • {p.items.length} material(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white">{formatCurrency(p.total)}</div>
                      {p.pendingAmount > 0 && (
                        <div className="text-[10px] text-amber-400">
                          Due: {formatCurrency(p.pendingAmount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payments Section */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 mb-2 flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment History ({payments.length})</span>
            </h4>

            {payments.length === 0 ? (
              <div className="text-xs text-charcoal-500 py-3 text-center border border-dashed border-charcoal-800 rounded-xl">
                No payments made yet.
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-750 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">Payment Out</div>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">
                        {formatDate(pay.date)} • {pay.paymentMode.toUpperCase()}
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

      {isPayModalOpen && (
        <PaymentFormModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          initialAccountId={supplier.id}
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
