import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
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

  // Quick Add Account state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountType, setNewAccountType] = useState<'supplier' | 'labour'>('supplier');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPhone, setNewAccountPhone] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleCreateAccount = async () => {
    if (!currentSiteId) return;
    if (!newAccountName.trim()) {
      setError('Please enter account name');
      return;
    }
    setIsCreatingAccount(true);
    setError('');
    try {
      const newAcc: Account = {
        id: 'acc_' + Date.now(),
        siteId: currentSiteId,
        type: newAccountType,
        name: newAccountName.trim(),
        phone: newAccountPhone.trim() || undefined,
        openingBalance: 0,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await db.accounts.add(newAcc);
      const updatedAccounts = [...accounts, newAcc];
      setAccounts(updatedAccounts);
      setAccountId(newAcc.id);
      setSelectedType('all');
      setNewAccountName('');
      setNewAccountPhone('');
      setShowAddAccount(false);
      showToast(`${newAccountType === 'supplier' ? 'Supplier' : 'Labour'} "${newAcc.name}" created and selected!`, 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
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
    if (!paymentToEdit && !accountId && list.length > 0) {
      setAccountId(list[0].id);
    }
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

          {/* Account Filter Type & Quick Add */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                {(['all', 'supplier', 'labour'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
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

              <button
                type="button"
                onClick={() => {
                  setShowAddAccount(!showAddAccount);
                  setError('');
                }}
                className="text-xs text-construction-400 hover:text-construction-300 font-bold flex items-center gap-1 active:scale-95 transition"
              >
                {showAddAccount ? '✕ Cancel' : '+ New Account'}
              </button>
            </div>

            {/* Quick Add Account Panel */}
            {showAddAccount ? (
              <div className="bg-charcoal-950/80 border border-construction-500/40 rounded-2xl p-3.5 space-y-3 mb-3 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-charcoal-800">
                  <span className="text-xs font-black text-white">Create New Account (नया खाता)</span>
                  <div className="flex bg-charcoal-900 rounded-lg p-0.5 border border-charcoal-800">
                    <button
                      type="button"
                      onClick={() => setNewAccountType('supplier')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                        newAccountType === 'supplier'
                          ? 'bg-construction-500 text-charcoal-950'
                          : 'text-charcoal-400 hover:text-white'
                      }`}
                    >
                      Supplier (सप्लायर)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewAccountType('labour')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                        newAccountType === 'labour'
                          ? 'bg-construction-500 text-charcoal-950'
                          : 'text-charcoal-400 hover:text-white'
                      }`}
                    >
                      Labour (कारीगर/लेबर)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder={newAccountType === 'supplier' ? 'e.g. Goyal Hardware' : 'e.g. Ramesh Mistry'}
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile No. (optional)"
                    value={newAccountPhone}
                    onChange={(e) => setNewAccountPhone(e.target.value)}
                    className="bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={isCreatingAccount}
                  onClick={handleCreateAccount}
                  className="w-full bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black py-2 rounded-xl text-xs transition shadow active:scale-95 disabled:opacity-50"
                >
                  {isCreatingAccount ? 'Creating...' : `✓ Save & Select ${newAccountType === 'supplier' ? 'Supplier' : 'Labour'}`}
                </button>
              </div>
            ) : (
              <>
                <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                  Select Recipient Account *
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
                >
                  <option value="">-- Choose Account --</option>
                  {filteredAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.toUpperCase()}) {a.phone ? `• ${a.phone}` : ''}
                    </option>
                  ))}
                </select>
              </>
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
