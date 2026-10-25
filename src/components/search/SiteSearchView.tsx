import React, { useState, useEffect } from 'react';
import {
  Search,
  Users,
  Boxes,
  ShoppingBag,
  CreditCard,
  Receipt,
  HardHat,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import {
  calculateSupplierLedger,
  calculateLabourLedger,
  calculateMaterialStock,
  getMaterialRateHistory
} from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account, Material, Purchase, Payment, LabourWork, SiteExpense } from '../../types';

import { SupplierLedgerModal } from '../accounts/SupplierLedgerModal';
import { LabourLedgerModal } from '../accounts/LabourLedgerModal';
import { MaterialRateHistoryModal } from '../materials/MaterialRateHistoryModal';

export const SiteSearchView: React.FC = () => {
  const { currentSite, currentSiteId } = useAppStore();

  const [query, setQuery] = useState('');
  const [matchingAccounts, setMatchingAccounts] = useState<Array<{ account: Account; ledger: any }>>([]);
  const [matchingMaterials, setMatchingMaterials] = useState<Array<{ material: Material; stock: any; rateData: any }>>([]);
  const [matchingPurchases, setMatchingPurchases] = useState<Purchase[]>([]);
  const [matchingPayments, setMatchingPayments] = useState<Payment[]>([]);
  const [matchingWorks, setMatchingWorks] = useState<LabourWork[]>([]);
  const [matchingExpenses, setMatchingExpenses] = useState<SiteExpense[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modals
  const [selectedSupplier, setSelectedSupplier] = useState<Account | null>(null);
  const [selectedLabour, setSelectedLabour] = useState<Account | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (!query.trim() || !currentSiteId) {
      setMatchingAccounts([]);
      setMatchingMaterials([]);
      setMatchingPurchases([]);
      setMatchingPayments([]);
      setMatchingWorks([]);
      setMatchingExpenses([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query.trim());
    }, 200);

    return () => clearTimeout(timer);
  }, [query, currentSiteId]);

  const performSearch = async (searchTerm: string) => {
    if (!currentSiteId) return;
    setIsSearching(true);
    const term = searchTerm.toLowerCase();

    try {
      // 1. Search Accounts (Suppliers & Labour)
      const accounts = await db.accounts.where({ siteId: currentSiteId, status: 'active' }).toArray();
      const matchedAccs = accounts.filter(
        a => a.name.toLowerCase().includes(term) || (a.phone && a.phone.includes(term))
      );
      const accsWithLedger = [];
      for (const a of matchedAccs) {
        if (a.type === 'supplier') {
          const l = await calculateSupplierLedger(currentSiteId, a.id);
          accsWithLedger.push({ account: a, ledger: l });
        } else if (a.type === 'labour') {
          const l = await calculateLabourLedger(currentSiteId, a.id);
          accsWithLedger.push({ account: a, ledger: l });
        }
      }
      setMatchingAccounts(accsWithLedger);

      // 2. Search Materials
      const materials = await db.materials.where({ siteId: currentSiteId, status: 'active' }).toArray();
      const matchedMats = materials.filter(
        m => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
      );
      const matsWithData = [];
      for (const m of matchedMats) {
        const stock = await calculateMaterialStock(currentSiteId, m.id);
        const rateData = await getMaterialRateHistory(currentSiteId, m.id);
        matsWithData.push({ material: m, stock, rateData });
      }
      setMatchingMaterials(matsWithData);

      // 3. Search Purchases
      const purchases = await db.purchases.where({ siteId: currentSiteId }).toArray();
      const matchedPurchases = purchases.filter(
        p =>
          p.supplierName.toLowerCase().includes(term) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
          p.items.some(i => i.materialName.toLowerCase().includes(term))
      );
      setMatchingPurchases(matchedPurchases);

      // 4. Search Payments
      const payments = await db.payments.where({ siteId: currentSiteId }).toArray();
      const matchedPayments = payments.filter(
        p =>
          p.accountName.toLowerCase().includes(term) ||
          (p.reference && p.reference.toLowerCase().includes(term)) ||
          (p.notes && p.notes.toLowerCase().includes(term))
      );
      setMatchingPayments(matchedPayments);

      // 5. Search Labour Works
      const works = await db.labourWork.where({ siteId: currentSiteId }).toArray();
      const matchedWorks = works.filter(
        w =>
          w.labourName.toLowerCase().includes(term) ||
          w.workDescription.toLowerCase().includes(term)
      );
      setMatchingWorks(matchedWorks);

      // 6. Search Expenses
      const expenses = await db.expenses.where({ siteId: currentSiteId }).toArray();
      const matchedExpenses = expenses.filter(
        e =>
          e.category.toLowerCase().includes(term) ||
          (e.paidTo && e.paidTo.toLowerCase().includes(term)) ||
          (e.notes && e.notes.toLowerCase().includes(term))
      );
      setMatchingExpenses(matchedExpenses);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const totalResults =
    matchingAccounts.length +
    matchingMaterials.length +
    matchingPurchases.length +
    matchingPayments.length +
    matchingWorks.length +
    matchingExpenses.length;

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-construction-400" />
          <span>Site Universal Search</span>
        </h2>
        <p className="text-xs text-charcoal-400 mt-0.5">
          Site: {currentSite?.name} • Search anything: Supplier, Labour, Materials, Invoices, Payments
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-construction-400" />
        <input
          type="text"
          autoFocus
          placeholder="Try searching 'Rakesh', 'CPVC', 'Sharma', 'Cement', 'Diesel'..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-charcoal-900 border-2 border-charcoal-700 rounded-2xl pl-12 pr-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-construction-500 shadow-lg"
        />
      </div>

      {query && (
        <div className="text-xs text-charcoal-400 font-semibold">
          Found <span className="text-white">{totalResults}</span> matching record(s) on {currentSite?.name}
        </div>
      )}

      {/* Results Container */}
      {!query ? (
        <div className="py-12 text-center text-xs text-charcoal-500 bg-charcoal-900/40 border border-dashed border-charcoal-800 rounded-2xl p-6">
          <Search className="w-10 h-10 text-charcoal-600 mx-auto mb-2" />
          <div className="text-sm font-bold text-white mb-1">Search Anything on This Site</div>
          <p className="max-w-md mx-auto text-charcoal-400">
            Type any supplier name, labour mistri name, material item, bill number, or expense to quickly view ledgers and history.
          </p>
        </div>
      ) : totalResults === 0 ? (
        <div className="py-12 text-center text-xs text-charcoal-400 bg-charcoal-900 border border-charcoal-800 rounded-2xl">
          No records found matching "{query}" on this site.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Matched Accounts */}
          {matchingAccounts.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-construction-400" />
                <span>Accounts & Parties ({matchingAccounts.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingAccounts.map(({ account, ledger }) => (
                  <div
                    key={account.id}
                    onClick={() => {
                      if (account.type === 'supplier') setSelectedSupplier(account);
                      else setSelectedLabour(account);
                    }}
                    className="p-4 bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-2">
                        <span>{account.name}</span>
                        <span className="text-[10px] uppercase font-bold bg-charcoal-800 text-charcoal-300 px-1.5 py-0.5 rounded">
                          {account.type}
                        </span>
                      </div>
                      <div className="text-xs text-charcoal-400 mt-1">
                        Outstanding Due:{' '}
                        <strong className={ledger.outstanding > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                          {formatCurrency(ledger.outstanding)}
                        </strong>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Materials */}
          {matchingMaterials.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-sky-400" />
                <span>Materials & Inventory ({matchingMaterials.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingMaterials.map(({ material, stock, rateData }) => (
                  <div
                    key={material.id}
                    onClick={() => setSelectedMaterial(material)}
                    className="p-4 bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-white">{material.name}</div>
                      <div className="text-xs text-charcoal-400 mt-0.5">
                        Stock: <strong className="text-white">{stock.currentStock} {material.unit}</strong> • Last Rate: <strong className="text-construction-400">₹{rateData.lastPurchaseRate || 'N/A'}</strong>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-charcoal-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Purchases */}
          {matchingPurchases.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-construction-400" />
                <span>Purchases ({matchingPurchases.length})</span>
              </h3>
              <div className="space-y-2">
                {matchingPurchases.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-charcoal-900 border border-charcoal-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{p.supplierName}</div>
                      <div className="text-[11px] text-charcoal-400">
                        {p.invoiceNumber ? `Inv #${p.invoiceNumber} • ` : ''}
                        {formatDate(p.date)} • {p.items.map(i => i.materialName).join(', ')}
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
            </div>
          )}

          {/* Matched Payments */}
          {matchingPayments.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payments ({matchingPayments.length})</span>
              </h3>
              <div className="space-y-2">
                {matchingPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3 bg-charcoal-900 border border-charcoal-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">Paid to {pay.accountName}</div>
                      <div className="text-[11px] text-charcoal-400">
                        {formatDate(pay.date)} • Mode: {pay.paymentMode.toUpperCase()}
                      </div>
                    </div>
                    <div className="font-black text-emerald-400 text-sm">
                      {formatCurrency(pay.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals for viewing details */}
      {selectedSupplier && (
        <SupplierLedgerModal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          supplier={selectedSupplier}
        />
      )}

      {selectedLabour && (
        <LabourLedgerModal
          isOpen={!!selectedLabour}
          onClose={() => setSelectedLabour(null)}
          labour={selectedLabour}
        />
      )}

      {selectedMaterial && (
        <MaterialRateHistoryModal
          isOpen={!!selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          material={selectedMaterial}
        />
      )}
    </div>
  );
};
