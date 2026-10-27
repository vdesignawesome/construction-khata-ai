import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Boxes,
  Users,
  Receipt,
  CreditCard,
  AlertTriangle,
  Clock,
  Plus,
  Mic,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  HardHat,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { calculateSiteFinancialSummary, getAllMaterialStocksForSite } from '../../engine/accounting';
import { db } from '../../db';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { SiteFinancialSummary, MaterialStockSummary, Purchase, Payment, LabourWork, SiteExpense } from '../../types';

// Modals
import { PurchaseFormModal } from '../purchases/PurchaseFormModal';
import { PaymentFormModal } from '../payments/PaymentFormModal';
import { ExpenseFormModal } from '../expenses/ExpenseFormModal';
import { MaterialUsageModal } from '../materials/MaterialUsageModal';
import { LabourWorkModal } from '../labour/LabourWorkModal';
import { SiteEditModal } from '../site/SiteEditModal';
import { GoogleAdBanner } from '../ads/GoogleAdBanner';

interface RecentActivity {
  id: string;
  type: 'purchase' | 'payment' | 'expense' | 'labour_work' | 'usage';
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  statusBadge?: string;
}

export const SiteDashboard: React.FC = () => {
  const { currentSite, currentSiteId, setAiModalOpen, setActiveTab, refreshTrigger } = useAppStore();

  const [summary, setSummary] = useState<SiteFinancialSummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<MaterialStockSummary[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<Purchase[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isLabourModalOpen, setIsLabourModalOpen] = useState(false);
  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);

  useEffect(() => {
    if (currentSiteId) {
      loadDashboardData();
    }
  }, [currentSiteId, refreshTrigger]);

  const loadDashboardData = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);

    try {
      // 1. Calculate Site Financial Summary
      const finSummary = await calculateSiteFinancialSummary(currentSiteId);
      setSummary(finSummary);

      // 2. Fetch Low Stock items
      const allStocks = await getAllMaterialStocksForSite(currentSiteId);
      const low = allStocks.filter(s => s.isLowStock);
      setLowStockItems(low.slice(0, 5));

      // 3. Fetch Pending Purchases
      const pendingBills = await db.purchases
        .where({ siteId: currentSiteId })
        .filter(p => p.pendingAmount > 0)
        .reverse()
        .sortBy('date');
      setPendingPurchases(pendingBills.slice(0, 5));

      // 4. Build Recent Activity Stream
      const purchases = await db.purchases.where({ siteId: currentSiteId }).reverse().limit(6).toArray();
      const payments = await db.payments.where({ siteId: currentSiteId }).reverse().limit(6).toArray();
      const expenses = await db.expenses.where({ siteId: currentSiteId }).reverse().limit(6).toArray();
      const labourWorks = await db.labourWork.where({ siteId: currentSiteId }).reverse().limit(6).toArray();

      const activities: RecentActivity[] = [];

      purchases.forEach(p => {
        activities.push({
          id: p.id,
          type: 'purchase',
          title: `Purchase: ${p.supplierName}`,
          subtitle: `${p.items.length} item(s) • ${p.paymentStatus.toUpperCase()}`,
          amount: p.total,
          date: p.date,
          statusBadge: p.paymentStatus
        });
      });

      payments.forEach(p => {
        activities.push({
          id: p.id,
          type: 'payment',
          title: `Paid to ${p.accountName}`,
          subtitle: `${p.accountType.toUpperCase()} • Mode: ${p.paymentMode.toUpperCase()}`,
          amount: p.amount,
          date: p.date
        });
      });

      expenses.forEach(e => {
        activities.push({
          id: e.id,
          type: 'expense',
          title: `Expense: ${e.category}`,
          subtitle: e.notes || 'Site Expense',
          amount: e.amount,
          date: e.date
        });
      });

      labourWorks.forEach(l => {
        activities.push({
          id: l.id,
          type: 'labour_work',
          title: `Labour Work: ${l.labourName}`,
          subtitle: l.workDescription || 'Work logged',
          amount: l.amount,
          date: l.date
        });
      });

      // Sort activities descending by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivities(activities.slice(0, 8));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentSite) {
    return (
      <div className="p-8 text-center text-charcoal-400">
        Please select a site to view its dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner & AI Primary CTA */}
      <div className="relative overflow-hidden bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-charcoal-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-construction-400">
              <span className="w-2 h-2 rounded-full bg-construction-400 animate-ping inline-block" />
              <span>Current Site Active</span>
            </div>
            <div className="flex items-center space-x-2.5 mt-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {currentSite.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditSiteOpen(true)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition"
                title="Edit Site Details"
              >
                <Edit3 className="w-4 h-4 text-charcoal-400 hover:text-construction-400" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
              {currentSite.clientName ? `Client: ${currentSite.clientName}` : 'Construction Site Khata'}
              {currentSite.location && ` • ${currentSite.location}`}
            </p>
          </div>

          {/* Primary CTA: 🎙 AI Entry */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAiModalOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-construction-500 via-amber-500 to-construction-400 hover:from-construction-400 hover:to-amber-300 text-charcoal-950 font-black px-6 py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center space-x-3 shadow-lg shadow-construction-500/20 active:scale-95 transition"
            >
              <Mic className="w-5 h-5 animate-pulse" />
              <span>🎙 AI ENTRY (Speak / Type)</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core Financial Summary Cards - Requirement 7 */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Project Cost */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 p-4 rounded-xl shadow-sm hover:border-charcoal-700 transition col-span-2 sm:col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-400 mb-1">
            <span>Total Project Cost</span>
            <TrendingUp className="w-4 h-4 text-construction-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatCurrency(summary?.totalProjectCost || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">
            Materials + Labour + Expenses
          </div>
        </div>

        {/* Material Cost */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 p-4 rounded-xl shadow-sm hover:border-charcoal-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-400 mb-1">
            <span>Material Cost</span>
            <Boxes className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-100">
            {formatCurrency(summary?.materialCost || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">All site purchases</div>
        </div>

        {/* Labour Cost */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 p-4 rounded-xl shadow-sm hover:border-charcoal-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-400 mb-1">
            <span>Labour Cost</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-100">
            {formatCurrency(summary?.labourCost || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">Total work logged</div>
        </div>

        {/* Other Expenses */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 p-4 rounded-xl shadow-sm hover:border-charcoal-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-400 mb-1">
            <span>Other Expenses</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-100">
            {formatCurrency(summary?.otherExpenses || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">Diesel, rent, etc.</div>
        </div>

        {/* Total Paid */}
        <div className="bg-charcoal-900/90 border border-charcoal-800 p-4 rounded-xl shadow-sm hover:border-charcoal-700 transition">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-400 mb-1">
            <span>Total Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-400">
            {formatCurrency(summary?.totalPaid || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">Settled payments</div>
        </div>

        {/* Total Pending */}
        <div className="bg-charcoal-900/90 border border-amber-900/50 p-4 rounded-xl shadow-sm hover:border-amber-800 transition col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1">
            <span>Total Pending</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-400">
            {formatCurrency(summary?.totalPending || 0)}
          </div>
          <div className="text-[11px] text-charcoal-400 mt-1">Payable balance</div>
        </div>
      </div>

      {/* Quick Action Buttons - Requirement 7 */}
      <div className="bg-charcoal-950/60 border border-charcoal-800/80 rounded-2xl p-4">
        <div className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-charcoal-800 hover:bg-charcoal-750 text-white font-semibold py-3 px-3 rounded-xl border border-charcoal-700 transition active:scale-95 text-xs sm:text-sm"
          >
            <ShoppingBag className="w-4 h-4 text-construction-400" />
            <span>Purchase</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-charcoal-800 hover:bg-charcoal-750 text-white font-semibold py-3 px-3 rounded-xl border border-charcoal-700 transition active:scale-95 text-xs sm:text-sm"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Payment</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-charcoal-800 hover:bg-charcoal-750 text-white font-semibold py-3 px-3 rounded-xl border border-charcoal-700 transition active:scale-95 text-xs sm:text-sm"
          >
            <Receipt className="w-4 h-4 text-sky-400" />
            <span>Expense</span>
          </button>

          <button
            onClick={() => setIsUsageModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-charcoal-800 hover:bg-charcoal-750 text-white font-semibold py-3 px-3 rounded-xl border border-charcoal-700 transition active:scale-95 text-xs sm:text-sm"
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Material Used</span>
          </button>

          <button
            onClick={() => setIsLabourModalOpen(true)}
            className="flex items-center justify-center space-x-2 bg-charcoal-800 hover:bg-charcoal-750 text-white font-semibold py-3 px-3 rounded-xl border border-charcoal-700 transition active:scale-95 text-xs sm:text-sm col-span-2 sm:col-span-1"
          >
            <HardHat className="w-4 h-4 text-purple-400" />
            <span>Labour Work</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Low Stock & Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Payments Section */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Pending Payments</h3>
            </div>
            <button
              onClick={() => setActiveTab('purchases')}
              className="text-xs text-construction-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingPurchases.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              No pending bills for this site! Outstanding is clear.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingPurchases.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-charcoal-800/60 border border-charcoal-750 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{p.supplierName}</div>
                    <div className="text-[11px] text-charcoal-400">
                      {p.invoiceNumber ? `Inv: ${p.invoiceNumber} • ` : ''}
                      {formatDate(p.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-amber-400">
                      {formatCurrency(p.pendingAmount)}
                    </div>
                    <div className="text-[10px] text-charcoal-400">
                      Total: {formatCurrency(p.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts Section */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Low Stock Materials</h3>
            </div>
            <button
              onClick={() => setActiveTab('materials')}
              className="text-xs text-construction-400 hover:underline flex items-center gap-1"
            >
              <span>Stock Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-charcoal-400">
              All materials are above minimum stock levels.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockItems.map(item => (
                <div
                  key={item.materialId}
                  className="flex items-center justify-between p-3 rounded-xl bg-charcoal-800/60 border border-amber-900/30 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-[11px] text-charcoal-400">
                      Category: {item.category} • Min: {item.minimumStock} {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-amber-400">
                      {item.currentStock} {item.unit}
                    </div>
                    <span className="inline-block text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                      Low Stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Site Activity */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-charcoal-400" />
            <h3 className="text-sm font-bold text-white">Recent Transactions ({currentSite.name})</h3>
          </div>
          <button
            onClick={() => setActiveTab('purchases')}
            className="text-xs text-charcoal-400 hover:text-white"
          >
            All Ledger
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-10 text-center text-xs text-charcoal-400">
            No transactions recorded yet for this site. Tap "AI Entry" or any quick action to start.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800/60">
            {recentActivities.map(act => (
              <div
                key={act.id}
                onClick={() => {
                  if (act.type === 'purchase') setActiveTab('purchases');
                  else if (act.type === 'payment') setActiveTab('payments');
                  else if (act.type === 'expense') setActiveTab('expenses');
                  else if (act.type === 'labour_work') setActiveTab('labour');
                  else if (act.type === 'usage') setActiveTab('materials');
                }}
                className="py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-charcoal-800/60 transition cursor-pointer group"
                title="Click to view and edit this entry"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      act.type === 'purchase'
                        ? 'bg-construction-500/20 text-construction-400'
                        : act.type === 'payment'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : act.type === 'expense'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {act.type === 'purchase' ? (
                      <ShoppingBag className="w-4 h-4" />
                    ) : act.type === 'payment' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : act.type === 'expense' ? (
                      <Receipt className="w-4 h-4" />
                    ) : (
                      <HardHat className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-construction-400 transition">{act.title}</div>
                    <div className="text-[11px] text-charcoal-400">{act.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    {act.amount !== undefined && (
                      <div
                        className={`font-black ${
                          act.type === 'payment' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {formatCurrency(act.amount)}
                      </div>
                    )}
                    <div className="text-[10px] text-charcoal-400">{formatDate(act.date)}</div>
                  </div>
                  <span className="text-[11px] font-bold text-charcoal-300 group-hover:text-white group-hover:border-construction-500/50 bg-charcoal-800 px-2 py-1 rounded-lg border border-charcoal-700 transition flex items-center gap-1 shrink-0">
                    Edit / View →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Google Ad / Free Plan Sponsor Banner */}
      <GoogleAdBanner format="banner" className="my-2" />

      {/* Quick Action Modals */}
      {isPurchaseModalOpen && (
        <PurchaseFormModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onSuccess={() => {
            setIsPurchaseModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isPaymentModalOpen && (
        <PaymentFormModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isExpenseModalOpen && (
        <ExpenseFormModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => {
            setIsExpenseModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isUsageModalOpen && (
        <MaterialUsageModal
          isOpen={isUsageModalOpen}
          onClose={() => setIsUsageModalOpen(false)}
          onSuccess={() => {
            setIsUsageModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isLabourModalOpen && (
        <LabourWorkModal
          isOpen={isLabourModalOpen}
          onClose={() => setIsLabourModalOpen(false)}
          onSuccess={() => {
            setIsLabourModalOpen(false);
            loadDashboardData();
          }}
        />
      )}

      {isEditSiteOpen && currentSite && (
        <SiteEditModal
          isOpen={isEditSiteOpen}
          site={currentSite}
          onClose={() => setIsEditSiteOpen(false)}
          onSuccess={async () => {
            await loadDashboardData();
          }}
        />
      )}
    </div>
  );
};
