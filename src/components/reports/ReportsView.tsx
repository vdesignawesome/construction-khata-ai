import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Boxes,
  Users,
  CreditCard,
  Receipt,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import {
  calculateSiteFinancialSummary,
  getAllMaterialStocksForSite,
  calculateSupplierLedger,
  calculateLabourLedger
} from '../../engine/accounting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { GoogleAdBanner } from '../ads/GoogleAdBanner';
import { BRAND_CONFIG } from '../../config/branding';

type ReportType =
  | 'project_cost'
  | 'material_purchase'
  | 'material_usage'
  | 'material_stock'
  | 'supplier_outstanding'
  | 'labour_outstanding'
  | 'expenses'
  | 'payments';

export const ReportsView: React.FC = () => {
  const { currentSite, currentSiteId, refreshTrigger, showToast } = useAppStore();

  const [activeReport, setActiveReport] = useState<ReportType>('project_cost');
  const [reportData, setReportData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentSiteId) {
      loadReport();
    }
  }, [currentSiteId, activeReport, refreshTrigger]);

  const loadReport = async () => {
    if (!currentSiteId) return;
    setIsLoading(true);

    try {
      switch (activeReport) {
        case 'project_cost': {
          const summary = await calculateSiteFinancialSummary(currentSiteId);
          setSummaryData(summary);
          setReportData([
            { category: 'Material Purchases', amount: summary.materialCost, share: summary.totalProjectCost > 0 ? (summary.materialCost / summary.totalProjectCost) * 100 : 0 },
            { category: 'Labour Contracts', amount: summary.labourCost, share: summary.totalProjectCost > 0 ? (summary.labourCost / summary.totalProjectCost) * 100 : 0 },
            { category: 'Site Expenses (Fuel, Rent, etc.)', amount: summary.otherExpenses, share: summary.totalProjectCost > 0 ? (summary.otherExpenses / summary.totalProjectCost) * 100 : 0 }
          ]);
          break;
        }

        case 'material_purchase': {
          const purchases = await db.purchases.where({ siteId: currentSiteId }).reverse().sortBy('date');
          setReportData(purchases);
          break;
        }

        case 'material_usage': {
          const usages = await db.stockMovements
            .where({ siteId: currentSiteId, type: 'usage' })
            .reverse()
            .sortBy('date');
          const materials = await db.materials.where({ siteId: currentSiteId }).toArray();
          const matMap = new Map(materials.map(m => [m.id, m.name]));

          const formatted = usages.map(u => ({
            ...u,
            materialName: matMap.get(u.materialId) || 'Unknown Item'
          }));
          setReportData(formatted);
          break;
        }

        case 'material_stock': {
          const stocks = await getAllMaterialStocksForSite(currentSiteId);
          setReportData(stocks);
          break;
        }

        case 'supplier_outstanding': {
          const suppliers = await db.accounts.where({ siteId: currentSiteId, type: 'supplier', status: 'active' }).toArray();
          const list = [];
          for (const s of suppliers) {
            const l = await calculateSupplierLedger(currentSiteId, s.id);
            list.push(l);
          }
          list.sort((a, b) => b.outstanding - a.outstanding);
          setReportData(list);
          break;
        }

        case 'labour_outstanding': {
          const labours = await db.accounts.where({ siteId: currentSiteId, type: 'labour', status: 'active' }).toArray();
          const list = [];
          for (const l of labours) {
            const led = await calculateLabourLedger(currentSiteId, l.id);
            list.push(led);
          }
          list.sort((a, b) => b.outstanding - a.outstanding);
          setReportData(list);
          break;
        }

        case 'expenses': {
          const expList = await db.expenses.where({ siteId: currentSiteId }).reverse().sortBy('date');
          setReportData(expList);
          break;
        }

        case 'payments': {
          const payList = await db.payments.where({ siteId: currentSiteId }).reverse().sortBy('date');
          setReportData(payList);
          break;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      showToast('No data to export', 'info');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    const keys = Object.keys(reportData[0]).filter(k => typeof reportData[0][k] !== 'object');
    csvContent += keys.join(',') + '\r\n';

    reportData.forEach((row) => {
      const line = keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',');
      csvContent += line + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentSite?.name || 'site'}_${activeReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded!', 'success');
  };

  // Export to PDF using jsPDF + AutoTable
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const siteTitle = currentSite?.name || 'Construction Site';
      const reportTitle = activeReport.replace('_', ' ').toUpperCase();

      // Header Banner
      doc.setFillColor(15, 23, 42); // Charcoal 900
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(245, 158, 11); // Construction Yellow
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('CONSTRUCTION KHATA AI', 14, 13);

      doc.setFontSize(8);
      doc.setTextColor(251, 191, 36); // Amber 400
      doc.setFont('helvetica', 'normal');
      doc.text(`by ${BRAND_CONFIG.parentBrand} Ecosystem`, 14, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`Site: ${siteTitle}`, 14, 25);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 140, 25);

      // Report Header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${reportTitle} STATEMENT`, 14, 42);

      let head: string[][] = [];
      let body: any[][] = [];

      if (activeReport === 'project_cost') {
        head = [['Category', 'Amount (INR)', 'Share (%)']];
        body = reportData.map(r => [
          r.category,
          formatCurrency(r.amount),
          `${r.share.toFixed(1)}%`
        ]);
        body.push(['TOTAL PROJECT COST', formatCurrency(summaryData?.totalProjectCost || 0), '100%']);
      } else if (activeReport === 'material_purchase') {
        head = [['Date', 'Supplier', 'Invoice No', 'Items', 'Total (INR)', 'Pending (INR)', 'Status']];
        body = reportData.map(p => [
          p.date,
          p.supplierName,
          p.invoiceNumber || '-',
          p.items.length,
          formatCurrency(p.total),
          formatCurrency(p.pendingAmount),
          p.paymentStatus.toUpperCase()
        ]);
      } else if (activeReport === 'material_stock') {
        head = [['Material', 'Category', 'Unit', 'Purchased', 'Used', 'Current Stock', 'Last Rate']];
        body = reportData.map(s => [
          s.name,
          s.category,
          s.unit,
          s.totalPurchased,
          s.totalUsed,
          s.currentStock,
          s.lastPurchaseRate ? `Rs.${s.lastPurchaseRate}` : '-'
        ]);
      } else if (activeReport === 'supplier_outstanding') {
        head = [['Supplier Name', 'Phone', 'Total Purchases', 'Total Paid', 'Outstanding Due']];
        body = reportData.map(s => [
          s.supplierName,
          s.phone || '-',
          formatCurrency(s.totalPurchases),
          formatCurrency(s.totalPayments),
          formatCurrency(s.outstanding)
        ]);
      } else if (activeReport === 'labour_outstanding') {
        head = [['Labour Contractor', 'Phone', 'Work Logged', 'Total Paid', 'Net Due']];
        body = reportData.map(l => [
          l.labourName,
          l.phone || '-',
          formatCurrency(l.totalWorkAmount),
          formatCurrency(l.totalPayments),
          formatCurrency(l.outstanding)
        ]);
      } else if (activeReport === 'expenses') {
        head = [['Date', 'Category', 'Paid To', 'Mode', 'Amount (INR)', 'Notes']];
        body = reportData.map(e => [
          e.date,
          e.category,
          e.paidTo || '-',
          e.paymentMode.toUpperCase(),
          formatCurrency(e.amount),
          e.notes || '-'
        ]);
      } else if (activeReport === 'payments') {
        head = [['Date', 'Party Name', 'Account Type', 'Mode', 'Amount (INR)', 'Reference']];
        body = reportData.map(p => [
          p.date,
          p.accountName,
          p.accountType.toUpperCase(),
          p.paymentMode.toUpperCase(),
          formatCurrency(p.amount),
          p.reference || '-'
        ]);
      }

      autoTable(doc, {
        head,
        body,
        startY: 48,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [245, 158, 11],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Generated via Construction Khata AI • Powered by ${BRAND_CONFIG.parentBrand} Ecosystem • Page ${data.pageNumber} of ${pageCount}`,
            14,
            doc.internal.pageSize.height - 7
          );
        }
      });

      doc.save(`${currentSite?.name || 'site'}_${activeReport}_statement.pdf`);
      showToast('PDF statement generated and downloaded!', 'success');
    } catch (err: any) {
      console.error('PDF error:', err);
      showToast('Error generating PDF: ' + err.message, 'error');
    }
  };

  const reportButtons: Array<{ id: ReportType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'project_cost', label: 'Project Cost', icon: TrendingUp },
    { id: 'material_purchase', label: 'Material Purchases', icon: Boxes },
    { id: 'material_stock', label: 'Stock Summary', icon: Boxes },
    { id: 'supplier_outstanding', label: 'Supplier Outstanding', icon: Users },
    { id: 'labour_outstanding', label: 'Labour Outstanding', icon: Users },
    { id: 'expenses', label: 'Expenses Report', icon: Receipt },
    { id: 'payments', label: 'Payments Report', icon: CreditCard }
  ];

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-construction-400" />
            <span>Site Reports & Statements</span>
          </h2>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Site: {currentSite?.name} • Financial breakdown, ledgers & PDF/CSV exports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 border border-charcoal-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-construction-400" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Clean PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
        {reportButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeReport === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setActiveReport(btn.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-construction-500 text-charcoal-950 shadow'
                  : 'bg-charcoal-900 text-charcoal-400 hover:text-white border border-charcoal-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Visual Analytics / Breakdown Chart Bar (Requirement 29) */}
      {activeReport === 'project_cost' && summaryData && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400">
            Project Cost Breakdown ({formatCurrency(summaryData.totalProjectCost)})
          </h3>

          {/* Visual Percentage Bar */}
          <div className="h-6 w-full bg-charcoal-950 rounded-xl overflow-hidden flex border border-charcoal-800">
            {summaryData.totalProjectCost > 0 ? (
              <>
                <div
                  style={{ width: `${(summaryData.materialCost / summaryData.totalProjectCost) * 100}%` }}
                  className="bg-sky-500 hover:bg-sky-400 transition"
                  title={`Materials: ${formatCurrency(summaryData.materialCost)}`}
                />
                <div
                  style={{ width: `${(summaryData.labourCost / summaryData.totalProjectCost) * 100}%` }}
                  className="bg-purple-500 hover:bg-purple-400 transition"
                  title={`Labour: ${formatCurrency(summaryData.labourCost)}`}
                />
                <div
                  style={{ width: `${(summaryData.otherExpenses / summaryData.totalProjectCost) * 100}%` }}
                  className="bg-emerald-500 hover:bg-emerald-400 transition"
                  title={`Expenses: ${formatCurrency(summaryData.otherExpenses)}`}
                />
              </>
            ) : (
              <div className="w-full text-center text-[10px] text-charcoal-500 py-1">No cost data yet</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-sky-500 shrink-0" />
              <div>
                <div className="text-charcoal-400 text-[10px]">Materials</div>
                <div className="font-bold text-white">{formatCurrency(summaryData.materialCost)}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-purple-500 shrink-0" />
              <div>
                <div className="text-charcoal-400 text-[10px]">Labour</div>
                <div className="font-bold text-white">{formatCurrency(summaryData.labourCost)}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
              <div>
                <div className="text-charcoal-400 text-[10px]">Other Expenses</div>
                <div className="font-bold text-white">{formatCurrency(summaryData.otherExpenses)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-charcoal-800 bg-charcoal-950/40 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-charcoal-300">
            {activeReport.replace('_', ' ').toUpperCase()} DATA ({reportData.length} records)
          </span>
          <span className="text-[11px] text-charcoal-500">Live Calculated Ledger</span>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-charcoal-400">Loading report data...</div>
          ) : reportData.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">No records found for this report.</div>
          ) : (
            <table className="w-full text-left text-xs text-charcoal-300">
              <thead className="bg-charcoal-950 text-charcoal-400 font-bold uppercase text-[10px] border-b border-charcoal-800">
                <tr>
                  {activeReport === 'project_cost' && (
                    <>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Amount (₹)</th>
                      <th className="p-3.5 text-right">Share (%)</th>
                    </>
                  )}

                  {activeReport === 'material_purchase' && (
                    <>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5 text-right">Total</th>
                      <th className="p-3.5 text-right">Pending</th>
                      <th className="p-3.5">Status</th>
                    </>
                  )}

                  {activeReport === 'material_stock' && (
                    <>
                      <th className="p-3.5">Material</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5 text-right">Purchased</th>
                      <th className="p-3.5 text-right">Used</th>
                      <th className="p-3.5 text-right">Current Stock</th>
                      <th className="p-3.5 text-right">Last Rate</th>
                    </>
                  )}

                  {activeReport === 'supplier_outstanding' && (
                    <>
                      <th className="p-3.5">Supplier</th>
                      <th className="p-3.5 text-right">Purchases</th>
                      <th className="p-3.5 text-right">Total Paid</th>
                      <th className="p-3.5 text-right">Outstanding Due</th>
                    </>
                  )}

                  {activeReport === 'labour_outstanding' && (
                    <>
                      <th className="p-3.5">Labour Name</th>
                      <th className="p-3.5 text-right">Work Done</th>
                      <th className="p-3.5 text-right">Total Paid</th>
                      <th className="p-3.5 text-right">Net Due</th>
                    </>
                  )}

                  {activeReport === 'expenses' && (
                    <>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Paid To</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </>
                  )}

                  {activeReport === 'payments' && (
                    <>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Party</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Mode</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-charcoal-800">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-charcoal-800/40 transition">
                    {activeReport === 'project_cost' && (
                      <>
                        <td className="p-3.5 font-bold text-white">{row.category}</td>
                        <td className="p-3.5 text-right font-black text-slate-100">{formatCurrency(row.amount)}</td>
                        <td className="p-3.5 text-right text-charcoal-400">{row.share.toFixed(1)}%</td>
                      </>
                    )}

                    {activeReport === 'material_purchase' && (
                      <>
                        <td className="p-3.5">{formatDate(row.date)}</td>
                        <td className="p-3.5 font-bold text-white">{row.supplierName}</td>
                        <td className="p-3.5 text-charcoal-400">{row.invoiceNumber || '-'}</td>
                        <td className="p-3.5 text-right font-black text-white">{formatCurrency(row.total)}</td>
                        <td className="p-3.5 text-right font-bold text-amber-400">{formatCurrency(row.pendingAmount)}</td>
                        <td className="p-3.5">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300">
                            {row.paymentStatus}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'material_stock' && (
                      <>
                        <td className="p-3.5 font-bold text-white">{row.name}</td>
                        <td className="p-3.5 text-charcoal-400">{row.category}</td>
                        <td className="p-3.5 text-right text-slate-300">{row.totalPurchased} {row.unit}</td>
                        <td className="p-3.5 text-right text-slate-300">{row.totalUsed} {row.unit}</td>
                        <td className="p-3.5 text-right font-black text-construction-400">{row.currentStock} {row.unit}</td>
                        <td className="p-3.5 text-right font-bold text-slate-200">₹{row.lastPurchaseRate || '-'}</td>
                      </>
                    )}

                    {activeReport === 'supplier_outstanding' && (
                      <>
                        <td className="p-3.5 font-bold text-white">{row.supplierName}</td>
                        <td className="p-3.5 text-right text-slate-300">{formatCurrency(row.totalPurchases)}</td>
                        <td className="p-3.5 text-right text-emerald-400 font-bold">{formatCurrency(row.totalPayments)}</td>
                        <td className="p-3.5 text-right font-black text-amber-400">{formatCurrency(row.outstanding)}</td>
                      </>
                    )}

                    {activeReport === 'labour_outstanding' && (
                      <>
                        <td className="p-3.5 font-bold text-white">{row.labourName}</td>
                        <td className="p-3.5 text-right text-slate-300">{formatCurrency(row.totalWorkAmount)}</td>
                        <td className="p-3.5 text-right text-emerald-400 font-bold">{formatCurrency(row.totalPayments)}</td>
                        <td className="p-3.5 text-right font-black text-purple-400">{formatCurrency(row.outstanding)}</td>
                      </>
                    )}

                    {activeReport === 'expenses' && (
                      <>
                        <td className="p-3.5">{formatDate(row.date)}</td>
                        <td className="p-3.5 font-bold text-white">{row.category}</td>
                        <td className="p-3.5 text-charcoal-400">{row.paidTo || '-'}</td>
                        <td className="p-3.5 uppercase text-charcoal-400">{row.paymentMode}</td>
                        <td className="p-3.5 text-right font-black text-sky-400">{formatCurrency(row.amount)}</td>
                      </>
                    )}

                    {activeReport === 'payments' && (
                      <>
                        <td className="p-3.5">{formatDate(row.date)}</td>
                        <td className="p-3.5 font-bold text-white">{row.accountName}</td>
                        <td className="p-3.5 uppercase text-charcoal-400">{row.accountType}</td>
                        <td className="p-3.5 uppercase text-charcoal-400">{row.paymentMode}</td>
                        <td className="p-3.5 text-right font-black text-emerald-400">{formatCurrency(row.amount)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Sponsored Ad Banner for Free Plan */}
      <GoogleAdBanner format="banner" className="mt-4" />
    </div>
  );
};
