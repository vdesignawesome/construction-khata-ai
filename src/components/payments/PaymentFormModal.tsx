import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Building2, User } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { createPayment } from '../../engine/accounting';
import { formatCurrency } from '../../utils/formatters';
import type { Account, PaymentMode, Payment } from '../../types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAccountId?: string;
  initialAmount?: number;
  initialPurchaseId?: string;
  paymentToEdit?: Payment | null;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAccountId,
  initialAmount,
  initialPurchaseId,
  paymentToEdit
}) => {
  const { currentSiteId, showToast, triggerRefresh } = useAppStore();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedType, setSelectedType] = useState<'supplier' | 'labour' | 'all'>('all');
  const [accountId, setAccountId] = useState(paymentToEdit?.accountId || initialAccountId || '');
  const [amount, setAmount] = useState<number>(paymentToEdit?.amount || initialAmount || 0);
  const [date, setDate] = useState(paymentToEdit?.date || new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(paymentToEdit?.paymentMode || 'cash');
  const [reference, setReference] = useState(paymentToEdit?.reference || '');
  const [notes, setNotes] = useState(paymentToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick Add Account inline (matching Purchase Bill style)
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'supplier' | 'labour'>('supplier');
  const [newAccountName, setNewAccountName] = useState('');

  const handleCreateAccount = async () => {
    if (!newAccountName.trim() || !currentSiteId) return;
    try {
      const typeToUse: 'supplier' | 'labour' =
        selectedType === 'labour'
          ? 'labour'
          : selectedType === 'supplier'
          ? 'supplier'
          : newAccountType;

      const newAcc: Account = {
        id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        siteId: currentSiteId,
        type: typeToUse,
        name: newAccountName.trim(),
        openingBalance: 0,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.accounts.add(newAcc);
      setAccounts([...accounts, newAcc]);
      setAccountId(newAcc.id);
      setNewAccountName('');
      setShowAddAccount(false);
      showToast(`${typeToUse === 'supplier' ? 'Supplier' : 'Labour'} "${newAcc.name}" added!`, 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to add account');
    }
  };

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadAccounts();
    }
  }, [isOpen, currentSiteId]);

  useEffect(() => {
    if (paymentToEdit) {
      setAccountId(paymentToEdit.accountId);
      setAmount(paymentToEdit.amount);
      setDate(paymentToEdit.date);
      setPaymentMode(paymentToEdit.paymentMode);
      setReference(paymentToEdit.reference || '');
      setNotes(paymentToEdit.notes || '');
    } else {
      setAccountId(initialAccountId || '');
      setAmount(initialAmount || 0);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMode('cash');
      setReference('');
      setNotes('');
    }
    setError('');
  }, [paymentToEdit, isOpen, initialAccountId, initialAmount]);

  const loadAccounts = async () => {
    if (!currentSiteId) return;
    const list = await db.accounts
      .where({ siteId: currentSiteId, status: 'active' })
      .toArray();
    setAccounts(list);
  };

  const filteredAccounts = accounts.filter(
    a => selectedType === 'all' || a.type === selectedType
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (paymentToEdit) {
        const acc = accounts.find(a => a.id === accountId);
        await db.payments.update(paymentToEdit.id, {
          accountId,
          accountName: acc ? acc.name : paymentToEdit.accountName,
          accountType: acc ? acc.type : paymentToEdit.accountType,
          amount: Number(amount),
          date,
          paymentMode,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          updatedAt: Date.now()
        });
        triggerRefresh();
        showToast('Payment voucher updated successfully!', 'success');
      } else {
        await createPayment({
          siteId: currentSiteId,
          accountId,
          amount: Number(amount),
          date,
          paymentMode,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          purchaseId: initialPurchaseId
        });
        showToast('Payment voucher recorded successfully!', 'success');
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[92vh] flex flex-col">
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {paymentToEdit ? 'Edit Payment Voucher' : 'Record Payment'}
              </h3>
              <p className="text-xs text-charcoal-400">Pay Supplier, Labour, or Contractor</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-charcoal-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Filter Type */}
          <div>
            <div className="flex gap-2 mb-2">
              {(['all', 'supplier', 'labour'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedType(t);
                    if (t === 'supplier' || t === 'labour') {
                      setNewAccountType(t);
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    selectedType === t
                      ? 'bg-construction-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-charcoal-300 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All Accounts' : t}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-charcoal-300">
                Recipient Account (सप्लायर / लेबर खाता) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddAccount(!showAddAccount);
                  setError('');
                }}
                className="text-[11px] text-construction-400 hover:underline font-bold"
              >
                {showAddAccount
                  ? 'Cancel'
                  : selectedType === 'labour'
                  ? '+ New Labour'
                  : selectedType === 'supplier'
                  ? '+ New Supplier'
                  : '+ New Account'}
              </button>
            </div>

            {showAddAccount ? (
              <div className="flex gap-1.5">
                {selectedType === 'all' && (
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as 'supplier' | 'labour')}
                    className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-2.5 py-2 text-xs text-construction-400 font-bold focus:outline-none focus:border-construction-500"
                  >
                    <option value="supplier">Supplier</option>
                    <option value="labour">Labour</option>
                  </select>
                )}
                <div className="relative flex-1">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-construction-400">
                    {selectedType === 'labour' || newAccountType === 'labour' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={
                      selectedType === 'labour' || newAccountType === 'labour'
                        ? 'New Labour Name (e.g. Ramesh Mistry)'
                        : 'New Supplier Name (e.g. Goyal Hardware)'
                    }
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateAccount();
                      }
                    }}
                    autoFocus
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 px-3.5 rounded-xl text-xs font-black transition active:scale-95 shrink-0"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white font-medium focus:outline-none focus:border-construction-500"
              >
                <option value="">-- Select Recipient Account (खाता चुनें) --</option>
                {filteredAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type.toUpperCase()}) {a.phone ? `• ${a.phone}` : ''}
                  </option>
                ))}
              </select>
            )}
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
                placeholder="e.g. 5000"
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
                <option value="bank">Bank Transfer (NEFT/RTGS)</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Reference / Txn ID / Cheque #
              </label>
              <input
                type="text"
                placeholder="UTR, cheque no. or note"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Notes / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Part payment for plumbing invoice"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white"
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
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : paymentToEdit ? 'Save Changes' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
