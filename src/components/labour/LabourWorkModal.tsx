import React, { useState, useEffect } from 'react';
import { X, HardHat, AlertCircle } from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { createLabourWork } from '../../engine/accounting';
import type { Account, LabourWork } from '../../types';

interface LabourWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLabourId?: string;
  workToEdit?: LabourWork | null;
}

export const LabourWorkModal: React.FC<LabourWorkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLabourId,
  workToEdit
}) => {
  const { currentSiteId, showToast, triggerRefresh } = useAppStore();

  const [labourAccounts, setLabourAccounts] = useState<Account[]>([]);
  const [labourAccountId, setLabourAccountId] = useState(workToEdit?.labourAccountId || initialLabourId || '');
  const [workDescription, setWorkDescription] = useState(workToEdit?.workDescription || '');
  const [amount, setAmount] = useState<number>(workToEdit?.amount || 0);
  const [date, setDate] = useState(workToEdit?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(workToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentSiteId) {
      loadLabourAccounts();
    }
  }, [isOpen, currentSiteId]);

  useEffect(() => {
    if (workToEdit) {
      setLabourAccountId(workToEdit.labourAccountId);
      setWorkDescription(workToEdit.workDescription);
      setAmount(workToEdit.amount);
      setDate(workToEdit.date);
      setNotes(workToEdit.notes || '');
    } else {
      setLabourAccountId(initialLabourId || '');
      setWorkDescription('');
      setAmount(0);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError('');
  }, [workToEdit, isOpen, initialLabourId]);

  const loadLabourAccounts = async () => {
    if (!currentSiteId) return;
    const list = await db.accounts
      .where({ siteId: currentSiteId, type: 'labour', status: 'active' })
      .toArray();
    setLabourAccounts(list);
    if (!workToEdit && !labourAccountId && list.length > 0) {
      setLabourAccountId(list[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!labourAccountId) {
      setError('Please select a labour account');
      return;
    }
    if (amount <= 0) {
      setError('Work amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (workToEdit) {
        const acc = labourAccounts.find(a => a.id === labourAccountId);
        await db.labourWork.update(workToEdit.id, {
          labourAccountId,
          labourName: acc ? acc.name : workToEdit.labourName,
          workDescription: workDescription.trim() || 'Labour Work Completed',
          amount: Number(amount),
          date,
          notes: notes.trim() || undefined
        });
        triggerRefresh();
        showToast('Labour work updated successfully!', 'success');
      } else {
        await createLabourWork({
          siteId: currentSiteId,
          labourAccountId,
          workDescription: workDescription.trim() || 'Labour Work Completed',
          amount: Number(amount),
          date,
          notes: notes.trim() || undefined
        });
        showToast('Labour work amount recorded to Khata!', 'success');
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save labour work');
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
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {workToEdit ? 'Edit Labour Work Entry' : 'Add Labour Work (Financial)'}
              </h3>
              <p className="text-xs text-charcoal-400">Purely financial work contract / measurement</p>
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
              Select Labour Account / Mistri *
            </label>
            <select
              required
              value={labourAccountId}
              onChange={(e) => setLabourAccountId(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
            >
              <option value="">-- Choose Labour Account --</option>
              {labourAccounts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.phone ? `• ${l.phone}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              Work Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bathroom plumbing fitting, Plaster work ground floor"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-construction-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                Work Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 8000"
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

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">Remarks / Notes</label>
            <input
              type="text"
              placeholder="e.g. Verified by site supervisor"
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
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition shadow disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : workToEdit ? 'Save Changes' : 'Record Work'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
