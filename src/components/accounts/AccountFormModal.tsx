import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
import { db, logAudit } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import type { Account, AccountType } from '../../types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit?: Account | null;
  defaultType?: AccountType;
}

export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountToEdit,
  defaultType = 'supplier'
}) => {
  const { currentSiteId, showToast } = useAppStore();

  const [type, setType] = useState<AccountType>(accountToEdit?.type || defaultType);
  const [name, setName] = useState(accountToEdit?.name || '');
  const [phone, setPhone] = useState(accountToEdit?.phone || '');
  const [address, setAddress] = useState(accountToEdit?.address || '');
  const [openingBalance, setOpeningBalance] = useState<number>(accountToEdit?.openingBalance || 0);
  const [notes, setNotes] = useState(accountToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountToEdit) {
      setType(accountToEdit.type);
      setName(accountToEdit.name);
      setPhone(accountToEdit.phone || '');
      setAddress(accountToEdit.address || '');
      setOpeningBalance(accountToEdit.openingBalance || 0);
      setNotes(accountToEdit.notes || '');
    } else {
      setType(defaultType);
      setName('');
      setPhone('');
      setAddress('');
      setOpeningBalance(0);
      setNotes('');
    }
  }, [accountToEdit, defaultType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (accountToEdit) {
        await db.accounts.update(accountToEdit.id, {
          type,
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          openingBalance: Number(openingBalance) || 0,
          notes: notes.trim() || undefined,
          updatedAt: Date.now()
        });
        await logAudit(currentSiteId, 'account', accountToEdit.id, 'update', accountToEdit, { name, type });
        showToast('Account updated successfully', 'success');
      } else {
        const newAcc: Account = {
          id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          siteId: currentSiteId,
          type,
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          openingBalance: Number(openingBalance) || 0,
          notes: notes.trim() || undefined,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await db.accounts.add(newAcc);
        await logAudit(currentSiteId, 'account', newAcc.id, 'create', null, newAcc);
        showToast(`${type === 'supplier' ? 'Supplier' : 'Labour'} account created!`, 'success');
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-construction-500/20 text-construction-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {accountToEdit ? 'Edit Account' : 'Add New Account'}
              </h3>
              <p className="text-xs text-charcoal-400">Supplier or Labour Financial Ledger</p>
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

          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1.5">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('supplier')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'supplier'
                    ? 'bg-construction-500 text-charcoal-950'
                    : 'bg-charcoal-800 text-charcoal-300 hover:text-white'
                }`}
              >
                Supplier (Vendor/Dealer)
              </button>

              <button
                type="button"
                onClick={() => setType('labour')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  type === 'labour'
                    ? 'bg-construction-500 text-charcoal-950'
                    : 'bg-charcoal-800 text-charcoal-300 hover:text-white'
                }`}
              >
                Labour (Contractor/Mistri)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Account / Party Name *
            </label>
            <input
              type="text"
              required
              placeholder={type === 'supplier' ? 'e.g. Sharma Hardware' : 'e.g. Rakesh Plumber'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-construction-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="10 digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Opening Balance (₹)
              </label>
              <input
                type="number"
                placeholder="0 (Positive = Payable)"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Address / Shop Details
            </label>
            <input
              type="text"
              placeholder="e.g. Timber Market / Shop No 12"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">Notes</label>
            <input
              type="text"
              placeholder="Additional contact or trade notes"
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
              className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : accountToEdit ? 'Update Account' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
