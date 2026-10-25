import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  Calendar,
  FileText,
  AlertTriangle,
  Trash2,
  Edit2
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { deletePurchase } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Purchase } from '../../types';
import { PurchaseFormModal } from './PurchaseFormModal';
import { PaymentFormModal } from '../payments/PaymentFormModal';

export const PurchasesView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState<Purchase | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadPurchases();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadPurchases = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.purchases
        .where({ siteId: currentSiteId })
        .reverse()
        .sortBy('date');
      setPurchases(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = purchases.filter((p) => {
    const matchesSearch =
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.items.some(i => i.materialName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPendingAmount = purchases.reduce((sum, p) => sum + p.pendingAmount, 0);

  const handleQuickPay = (p: Purchase) => {
    setSelectedPurchaseForPayment(p);
    setIsPaymentModalOpen(true);
  };

  const handleDeletePurchase = async (p: Purchase) => {
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to delete purchase bill #${p.invoiceNumber || p.id} from "${p.supplierName}"? This will reverse the stock addition and remove any linked payments.`
      )
    ) {
      return;
    }

    try {
      await deletePurchase(currentSiteId, p.id);
      showToast('Purchase bill deleted and stock rolled back', 'info');
      loadPurchases();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete purchase', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-construction-400" />
            <span>Purchases (Material Bills)</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Multi-item invoices and stock records
          </p>
        </div>

        <button
          onClick={() => {
            setPurchaseToEdit(null);
            setIsPurchaseModalOpen(true);
          }}
          className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Bill</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl">
          <div className="text-xs font-semibold text-charcoal-400">Total Purchases</div>
          <div className="text-lg sm:text-xl font-black text-white mt-1">
            {formatCurrency(totalPurchasesAmount)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-0.5">{purchases.length} invoices</div>
        </div>

        <div className="bg-charcoal-900 border border-amber-900/40 p-4 rounded-xl">
          <div className="text-xs font-semibold text-amber-400">Total Pending Bills</div>
          <div className="text-lg sm:text-xl font-black text-amber-400 mt-1">
            {formatCurrency(totalPendingAmount)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-0.5">
            {purchases.filter(p => p.pendingAmount > 0).length} unpaid bills
          </div>
        </div>

        <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold text-emerald-400">Paid to Date</div>
          <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">
            {formatCurrency(totalPurchasesAmount - totalPendingAmount)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-0.5">Settled material costs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by supplier, invoice number, or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'pending', 'partial', 'paid'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-construction-500 text-charcoal-950'
                  : 'bg-charcoal-900 text-charcoal-300 hover:text-white border border-charcoal-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-charcoal-400">Loading purchase bills...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center bg-charcoal-900/50 border border-dashed border-charcoal-800 rounded-2xl">
            <ShoppingBag className="w-10 h-10 text-charcoal-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">No purchase bills found</div>
            <p className="text-xs text-charcoal-400 mt-1">
              Record a purchase bill to add inventory and track supplier outstanding.
            </p>
          </div>
        ) : (
          filtered.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-2xl p-4 sm:p-5 shadow-sm transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-charcoal-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base text-white">{purchase.supplierName}</span>
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                        purchase.paymentStatus === 'paid'
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                          : purchase.paymentStatus === 'partial'
                          ? 'bg-amber-950/40 text-amber-400 border-amber-800/40'
                          : 'bg-red-950/40 text-red-400 border-red-800/40'
                      }`}
                    >
                      {purchase.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-charcoal-400 mt-1">
                    {purchase.invoiceNumber && <span>Inv: #{purchase.invoiceNumber}</span>}
                    <span>Date: {formatDate(purchase.date)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div>
                    <div className="text-[10px] text-charcoal-400 text-right">Bill Total</div>
                    <div className="text-base font-black text-white text-right">
                      {formatCurrency(purchase.total)}
                    </div>
                  </div>

                  {purchase.pendingAmount > 0 ? (
                    <div>
                      <div className="text-[10px] text-amber-400 text-right">Pending</div>
                      <div className="text-base font-black text-amber-400 text-right">
                        {formatCurrency(purchase.pendingAmount)}
                      </div>
                    </div>
                  ) : null}

                  {purchase.pendingAmount > 0 && (
                    <button
                      onClick={() => handleQuickPay(purchase)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow active:scale-95 transition"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>Pay</span>
                    </button>
                  )}

                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button
                      onClick={() => {
                        setPurchaseToEdit(purchase);
                        setIsPurchaseModalOpen(true);
                      }}
                      className="bg-charcoal-800 hover:bg-charcoal-700 text-construction-400 border border-charcoal-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Edit purchase bill"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase)}
                      className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
                      title="Delete purchase bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items in this purchase */}
              <div className="pt-3">
                <div className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider mb-1.5">
                  Items Purchased:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-charcoal-800/60 border border-charcoal-750 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">{item.materialName}</div>
                        <div className="text-[10px] text-charcoal-400">
                          {item.quantity} {item.unit} @ ₹{item.rate}
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-200">
                        {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {purchase.notes && (
                <div className="mt-2.5 text-[11px] text-charcoal-400 italic">
                  Note: {purchase.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {isPurchaseModalOpen && (
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          purchaseToEdit={purchaseToEdit}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setPurchaseToEdit(null);
          }}
          onSuccess={() => {
            setIsPurchaseModalOpen(false);
            setPurchaseToEdit(null);
            loadPurchases();
          }}
        />
      )}

      {isPaymentModalOpen && selectedPurchaseForPayment && (
        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPurchaseForPayment(null);
          }}
          initialAccountId={selectedPurchaseForPayment.supplierId}
          initialAmount={selectedPurchaseForPayment.pendingAmount}
          initialPurchaseId={selectedPurchaseForPayment.id}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedPurchaseForPayment(null);
            loadPurchases();
          }}
        />
      )}
    </div>
  );
};
