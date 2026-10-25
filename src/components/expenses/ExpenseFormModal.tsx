import React, { useState, useEffect } from 'react';
import { X, Receipt, AlertCircle } from 'lucide-react';
import { db, PREDEFINED_EXPENSE_CATEGORIES } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { createSiteExpense } from '../../engine/accounting';
import type { PaymentMode, SiteExpense } from '../../types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseToEdit?: SiteExpense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit
}) => {
  const { currentSiteId, showToast, triggerRefresh } = useAppStore();

  const [category, setCategory] = useState(expenseToEdit?.category || PREDEFINED_EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState<number>(expenseToEdit?.amount || 0);
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(expenseToEdit?.paymentMode || 'cash');
  const [paidTo, setPaidTo] = useState(expenseToEdit?.paidTo || '');
  const [notes, setNotes] = useState(expenseToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setCategory(expenseToEdit.category);
      setAmount(expenseToEdit.amount);
      setDate(expenseToEdit.date);
      setPaymentMode(expenseToEdit.paymentMode);
      setPaidTo(expenseToEdit.paidTo || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setCategory(PREDEFINED_EXPENSE_CATEGORIES[0]);
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('cash');
      setPaidTo('');
      setNotes('');
    }
    setError('');
  }, [expenseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (amount <= 0) {
      setError('Expense amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (expenseToEdit) {
        await db.expenses.update(expenseToEdit.id, {
          category,
          amount: Number(amount),
          date,
          paymentMode,
          paidTo: paidTo.trim() || undefined,
          notes: notes.trim() || undefined
        });
        triggerRefresh();
        showToast('Site expense updated successfully!', 'success');
      } else {
        await createSiteExpense({
          siteId: currentSiteId,
          category,
          amount: Number(amount),
          date,
          paymentMode,
          paidTo: paidTo.trim() || undefined,
          notes: notes.trim() || undefined
        });
        showToast('Site expense logged successfully!', 'success');
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {expenseToEdit ? 'Edit Site Expense' : 'Record Site Expense'}
              </h3>
              <p className="text-xs text-charcoal-400">Diesel, machinery, transport & daily site costs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
            >
              {PREDEFINED_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 1200"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-sm text-white font-bold focus:outline-none focus:border-construction-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              >
                <option value="cash">Cash (Nokad)</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Paid To (Person / Vendor)
              </label>
              <input
                type="text"
                placeholder="e.g. Petrol pump, Driver, Chai wala"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. 15L Diesel for generator"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white"
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
              className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
