import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  HardHat,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { calculateSupplierLedger, calculateLabourLedger, deleteAccount } from '../../engine/accounting';
import { formatCurrency } from '../../utils/formatters';
import type { Account, AccountType, SupplierLedgerSummary, LabourLedgerSummary } from '../../types';

import { AccountFormModal } from './AccountFormModal';
import { SupplierLedgerModal } from './SupplierLedgerModal';
import { LabourLedgerModal } from './LabourLedgerModal';

interface AccountWithLedger {
  account: Account;
  supplierLedger?: SupplierLedgerSummary;
  labourLedger?: LabourLedgerSummary;
}

export const AccountsView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [activeTab, setActiveTab] = useState<'supplier' | 'labour'>('supplier');
  const [accounts, setAccounts] = useState<AccountWithLedger[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Account | null>(null);
  const [selectedLabourForLedger, setSelectedLabourForLedger] = useState<Account | null>(null);

  useEffect(() => {
    if (currentSiteId) {
      loadAccounts();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadAccounts = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);
    try {
      const allAccounts = await db.accounts
        .where({ siteId: currentSiteId, status: 'active' })
        .toArray();

      const withLedger: AccountWithLedger[] = [];

      for (const acc of allAccounts) {
        if (acc.type === 'supplier') {
          const sLedger = await calculateSupplierLedger(currentSiteId, acc.id);
          withLedger.push({ account: acc, supplierLedger: sLedger });
        } else if (acc.type === 'labour') {
          const lLedger = await calculateLabourLedger(currentSiteId, acc.id);
          withLedger.push({ account: acc, labourLedger: lLedger });
        }
      }

      setAccounts(withLedger);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = accounts.filter(({ account }) => {
    const matchesTab = account.type === activeTab;
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.phone && account.phone.includes(searchTerm));
    return matchesTab && matchesSearch;
  });

  const totalSupplierOutstanding = accounts
    .filter(a => a.account.type === 'supplier')
    .reduce((sum, a) => sum + (a.supplierLedger?.outstanding || 0), 0);

  const totalLabourOutstanding = accounts
    .filter(a => a.account.type === 'labour')
    .reduce((sum, a) => sum + (a.labourLedger?.outstanding || 0), 0);

  const handleDeleteAccount = async (e: React.MouseEvent, acc: Account) => {
    e.stopPropagation();
    if (!currentSiteId) return;
    if (
      !window.confirm(
        `Are you sure you want to archive / delete account "${acc.name}"? Existing past transactions will remain preserved in historical records.`
      )
    ) {
      return;
    }

    try {
      await deleteAccount(currentSiteId, acc.id);
      showToast(`${acc.type === 'supplier' ? 'Supplier' : 'Labour'} account archived`, 'info');
      loadAccounts();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete account', 'error');
    }
  };

  const handleEditAccount = (e: React.MouseEvent, acc: Account) => {
    e.stopPropagation();
    setAccountToEdit(acc);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-construction-400" />
            <span>Accounts & Ledgers</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Separate Supplier accounts & Labour accounts
          </p>
        </div>

        <button
          onClick={() => {
            setAccountToEdit(null);
            setIsAddModalOpen(true);
          }}
          className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-charcoal-400">Total Supplier Outstanding</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
              {formatCurrency(totalSupplierOutstanding)}
            </div>
            <div className="text-[11px] text-charcoal-500">
              {accounts.filter(a => a.account.type === 'supplier').length} supplier vendors
            </div>
          </div>
          <ShoppingBag className="w-8 h-8 text-construction-500/30" />
        </div>

        <div className="bg-charcoal-900 border border-charcoal-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-charcoal-400">Total Labour Due (No Attendance)</div>
            <div className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5">
              {formatCurrency(totalLabourOutstanding)}
            </div>
            <div className="text-[11px] text-charcoal-500">
              {accounts.filter(a => a.account.type === 'labour').length} mistri / contractors
            </div>
          </div>
          <HardHat className="w-8 h-8 text-purple-500/30" />
        </div>
      </div>

      {/* Tab toggle: Suppliers vs Labour */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex bg-charcoal-900 p-1 rounded-xl border border-charcoal-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('supplier')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'supplier'
                ? 'bg-construction-500 text-charcoal-950 shadow'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Suppliers ({accounts.filter(a => a.account.type === 'supplier').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('labour')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'labour'
                ? 'bg-construction-500 text-charcoal-950 shadow'
                : 'text-charcoal-400 hover:text-white'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Labour ({accounts.filter(a => a.account.type === 'labour').length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'supplier' ? 'suppliers' : 'labour'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-construction-500"
          />
        </div>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-xs text-charcoal-400">
            Loading accounts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-charcoal-900/50 border border-dashed border-charcoal-800 rounded-2xl">
            <Users className="w-10 h-10 text-charcoal-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">
              No {activeTab === 'supplier' ? 'suppliers' : 'labour accounts'} found
            </div>
            <p className="text-xs text-charcoal-400 mt-1">
              Add your {activeTab === 'supplier' ? 'material suppliers' : 'labour mistri/contractors'} to track financial dues.
            </p>
          </div>
        ) : (
          filtered.map(({ account, supplierLedger, labourLedger }) => {
            const isSupplier = account.type === 'supplier';
            const totalWorkOrPurchase = isSupplier
              ? supplierLedger?.totalPurchases || 0
              : labourLedger?.totalWorkAmount || 0;
            const totalPaid = isSupplier
              ? supplierLedger?.totalPayments || 0
              : labourLedger?.totalPayments || 0;
            const outstanding = isSupplier
              ? supplierLedger?.outstanding || 0
              : labourLedger?.outstanding || 0;

            return (
              <div
                key={account.id}
                onClick={() => {
                  if (isSupplier) {
                    setSelectedSupplierForLedger(account);
                  } else {
                    setSelectedLabourForLedger(account);
                  }
                }}
                className="bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 hover:bg-charcoal-850/60 rounded-2xl p-4 sm:p-5 shadow-sm transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-white group-hover:text-construction-400 transition">
                        {account.name}
                      </span>
                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => handleEditAccount(e, account)}
                          className="p-1 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded transition"
                          title="Edit account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAccount(e, account)}
                          className="p-1 text-charcoal-400 hover:text-red-400 hover:bg-charcoal-800 rounded transition"
                          title="Archive/Delete account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {account.phone && (
                      <div className="flex items-center space-x-1.5 text-xs text-charcoal-400 mt-1">
                        <Phone className="w-3 h-3" />
                        <span>{account.phone}</span>
                      </div>
                    )}
                    {account.address && (
                      <div className="text-[11px] text-charcoal-500 mt-0.5">{account.address}</div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-charcoal-400">
                      {outstanding > 0 ? 'Pending Outstanding' : 'Balance Clear'}
                    </div>
                    <div
                      className={`text-base font-black ${
                        outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(outstanding)}
                    </div>
                  </div>
                </div>

                {/* Micro Ledger Breakdown */}
                <div className="mt-3 pt-3 border-t border-charcoal-800 flex items-center justify-between text-xs text-charcoal-400">
                  <div>
                    <span>{isSupplier ? 'Purchases: ' : 'Work Logged: '}</span>
                    <span className="font-bold text-slate-200">
                      {formatCurrency(totalWorkOrPurchase)}
                    </span>
                  </div>

                  <div>
                    <span>Paid: </span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>

                  <div className="flex items-center text-construction-400 font-semibold group-hover:translate-x-0.5 transition">
                    <span>View Khata</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AccountFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultType={activeTab}
          accountToEdit={accountToEdit}
          onSuccess={() => {
            setIsAddModalOpen(false);
            loadAccounts();
          }}
        />
      )}

      {selectedSupplierForLedger && (
        <SupplierLedgerModal
          isOpen={!!selectedSupplierForLedger}
          onClose={() => setSelectedSupplierForLedger(null)}
          supplier={selectedSupplierForLedger}
        />
      )}

      {selectedLabourForLedger && (
        <LabourLedgerModal
          isOpen={!!selectedLabourForLedger}
          onClose={() => setSelectedLabourForLedger(null)}
          labour={selectedLabourForLedger}
        />
      )}
    </div>
  );
};
