import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Calendar, Tag, Trash2, Edit2 } from 'lucide-react';
import { db, PREDEFINED_EXPENSE_CATEGORIES } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { deleteSiteExpense } from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { SiteExpense } from '../../types';
import { ExpenseFormModal } from './ExpenseFormModal';

export const ExpensesView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [expenses, setExpenses] = useState<SiteExpense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<SiteExpense | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadExpenses();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadExpenses = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const list = await db.expenses
        .where({ siteId: currentSiteId })
        .reverse()
        .sortBy('date');
      setExpenses(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDeleteExpense = async (exp: SiteExpense) => {
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to delete expense "${exp.category}" of ${formatCurrency(exp.amount)}?`
      )
    ) {
      return;
    }

    try {
      await deleteSiteExpense(currentSiteId, exp.id);
      showToast('Expense record deleted', 'info');
      loadExpenses();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-400" />
            <span>Site Expenses</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Fuel, diesel, machinery rentals & on-site expenses
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-charcoal-400">Total Site Expenses</div>
          <div className="text-2xl font-black text-sky-400 mt-0.5">
            {formatCurrency(totalExpenseAmount)}
          </div>
        </div>
        <div className="text-right text-xs text-charcoal-400">
          <span className="font-bold text-white">{expenses.length}</span> expense vouchers
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search expenses by category, vendor, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-charcoal-900 border border-charcoal-800 rounded-xl px-3 py-2 text-xs text-white"
        >
          <option value="all">All Categories</option>
          {PREDEFINED_EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-charcoal-400">Loading expenses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-400">
            No expenses found. Click "+ Record Expense" to log daily site expenses.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800">
            {filtered.map((exp) => (
              <div
                key={exp.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-charcoal-800/40 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-sm text-white">{exp.category}</span>
                      <span className="text-[10px] uppercase font-bold bg-charcoal-800 text-charcoal-300 px-1.5 py-0.5 rounded">
                        {exp.paymentMode}
                      </span>
                    </div>
                    {exp.paidTo && (
                      <div className="text-xs text-charcoal-300 mt-0.5">Paid to: {exp.paidTo}</div>
                    )}
                    <div className="text-[11px] text-charcoal-400 mt-0.5">
                      {formatDate(exp.date)} {exp.notes ? `• ${exp.notes}` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 justify-between sm:justify-end">
                  <div className="text-right sm:pr-2">
                    <div className="text-base sm:text-lg font-black text-white">
                      {formatCurrency(exp.amount)}
                    </div>
                    <div className="text-[10px] text-charcoal-400">Direct Expense</div>
                  </div>

                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <button
                      onClick={() => {
                        setExpenseToEdit(exp);
                        setIsModalOpen(true);
                      }}
                      className="bg-charcoal-800 hover:bg-charcoal-700 text-sky-400 border border-charcoal-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-sm"
                      title="Edit expense"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(exp)}
                      className="p-1.5 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded-lg transition"
                      title="Delete expense"
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
        <ExpenseFormModal
          isOpen={isModalOpen}
          expenseToEdit={expenseToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setExpenseToEdit(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setExpenseToEdit(null);
            loadExpenses();
          }}
        />
      )}
    </div>
  );
};
