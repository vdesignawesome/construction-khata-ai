import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  Calendar,
  Layers,
  Trash2,
  Edit2
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { deletePayment } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Payment } from '../../types';
import { PaymentFormModal } from './PaymentFormModal';

export const PaymentsView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadPayments();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadPayments = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.payments
        .where({ siteId: currentSiteId })
        .reverse()
        .sortBy('date');
      setPayments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMode = modeFilter === 'all' || p.paymentMode === modeFilter;
    const matchesType = typeFilter === 'all' || p.accountType === typeFilter;
    return matchesSearch && matchesMode && matchesType;
  });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleDeletePayment = async (p: Payment) => {
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to delete payment voucher of ${formatCurrency(p.amount)} paid to "${p.accountName}"? If linked to an invoice, the pending amount will be restored.`
      )
    ) {
      return;
    }

    try {
      await deletePayment(currentSiteId, p.id);
      showToast('Payment voucher deleted', 'info');
      loadPayments();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete payment', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <span>Payments Ledger</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • All payments made to suppliers and labour
          </p>
        </div>

        <button
          onClick={() => {
            setPaymentToEdit(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-charcoal-400">Total Payments Recorded</div>
          <div className="text-2xl font-black text-emerald-400 mt-0.5">
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="text-right text-xs text-charcoal-400">
          <span className="font-bold text-white">{payments.length}</span> payment vouchers
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search payments by party name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">All Types</option>
            <option value="supplier">Suppliers</option>
            <option value="labour">Labour</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="all">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading payments...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No payments found matching your filter.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800">
            {filtered.map((pay) => (
              <div
                key={pay.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-charcoal-800/40 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white">{pay.accountName}</span>
                      <span className="text-[10px] uppercase font-bold bg-charcoal-800 text-charcoal-300 px-1.5 py-0.5 rounded">
                        {pay.accountType}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-charcoal-400 mt-1">
                      <span>Date: {formatDate(pay.date)}</span>
                      <span className="uppercase font-semibold text-construction-400">
                        • {pay.paymentMode}
                      </span>
                      {pay.reference && <span>• Ref: {pay.reference}</span>}
                    </div>
                    {pay.notes && <div className="text-[11px] text-charcoal-500 mt-0.5">{pay.notes}</div>}
                  </div>
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end">
                  <div className="text-right sm:pr-2">
                    <div className="text-base sm:text-lg font-black text-emerald-400">
                      {formatCurrency(pay.amount)}
                    </div>
                    <div className="text-[10px] text-charcoal-400">Payment Out</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setPaymentToEdit(pay);
                        setIsModalOpen(true);
                      }}
                      className="bg-charcoal-800 hover:bg-charcoal-700 text-emerald-400 border border-charcoal-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Edit payment voucher"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeletePayment(pay)}
                      className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
                      title="Delete payment voucher"
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

      {isModalOpen && (
        <PaymentFormModal
          isOpen={isModalOpen}
          paymentToEdit={paymentToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setPaymentToEdit(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setPaymentToEdit(null);
            loadPayments();
          }}
        />
      )}
    </div>
  );
};
