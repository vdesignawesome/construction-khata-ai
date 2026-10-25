import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';

export const BackupRestoreView: React.FC = () => {
  const { showToast, triggerRefresh, setCurrentSiteId } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // EXPORT BACKUP
  const handleExportBackup = async () => {
    setIsExporting(true);
    setError(null);

    try {
      // Collect all tables into a structured backup bundle
      const backupData = {
        appName: 'Construction Khata AI',
        version: '1.0.0',
        timestamp: Date.now(),
        date: new Date().toISOString(),
        tables: {
          sites: await db.sites.toArray(),
          accounts: await db.accounts.toArray(),
          materials: await db.materials.toArray(),
          categories: await db.categories.toArray(),
          purchases: await db.purchases.toArray(),
          purchaseItems: await db.purchaseItems.toArray(),
          payments: await db.payments.toArray(),
          expenses: await db.expenses.toArray(),
          labourWork: await db.labourWork.toArray(),
          stockMovements: await db.stockMovements.toArray(),
          pendingAiTransactions: await db.pendingAiTransactions.toArray(),
          auditLogs: await db.auditLogs.toArray(),
          settings: await db.settings.toArray()
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `construction_khata_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Backup exported safely as ${fileName}`, 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to export backup');
      showToast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // RESTORE BACKUP
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportSummary(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.tables || !backup.tables.sites) {
        throw new Error('Invalid backup file. Missing required construction database tables.');
      }

      // Restore inside a Dexie transaction
      await db.transaction(
        'rw',
        [
          db.sites,
          db.accounts,
          db.materials,
          db.categories,
          db.purchases,
          db.purchaseItems,
          db.payments,
          db.expenses,
          db.labourWork,
          db.stockMovements,
          db.pendingAiTransactions,
          db.auditLogs,
          db.settings
        ],
        async () => {
          // Clear current tables before restoring
          await db.sites.clear();
          await db.accounts.clear();
          await db.materials.clear();
          await db.categories.clear();
          await db.purchases.clear();
          await db.purchaseItems.clear();
          await db.payments.clear();
          await db.expenses.clear();
          await db.labourWork.clear();
          await db.stockMovements.clear();
          await db.pendingAiTransactions.clear();
          await db.auditLogs.clear();
          await db.settings.clear();

          // Restore bulk
          if (backup.tables.sites?.length) await db.sites.bulkAdd(backup.tables.sites);
          if (backup.tables.accounts?.length) await db.accounts.bulkAdd(backup.tables.accounts);
          if (backup.tables.materials?.length) await db.materials.bulkAdd(backup.tables.materials);
          if (backup.tables.categories?.length) await db.categories.bulkAdd(backup.tables.categories);
          if (backup.tables.purchases?.length) await db.purchases.bulkAdd(backup.tables.purchases);
          if (backup.tables.purchaseItems?.length) await db.purchaseItems.bulkAdd(backup.tables.purchaseItems);
          if (backup.tables.payments?.length) await db.payments.bulkAdd(backup.tables.payments);
          if (backup.tables.expenses?.length) await db.expenses.bulkAdd(backup.tables.expenses);
          if (backup.tables.labourWork?.length) await db.labourWork.bulkAdd(backup.tables.labourWork);
          if (backup.tables.stockMovements?.length) await db.stockMovements.bulkAdd(backup.tables.stockMovements);
          if (backup.tables.pendingAiTransactions?.length) await db.pendingAiTransactions.bulkAdd(backup.tables.pendingAiTransactions);
          if (backup.tables.auditLogs?.length) await db.auditLogs.bulkAdd(backup.tables.auditLogs);
          if (backup.tables.settings?.length) await db.settings.bulkAdd(backup.tables.settings);
        }
      );

      const firstSite = await db.sites.toCollection().first();
      if (firstSite) {
        await setCurrentSiteId(firstSite.id);
      }

      triggerRefresh();
      setImportSummary(
        `Successfully restored ${backup.tables.sites?.length || 0} sites, ${
          backup.tables.accounts?.length || 0
        } accounts, and ${backup.tables.purchases?.length || 0} purchases.`
      );
      showToast('Database restored successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to restore backup file');
      showToast('Restore error', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // CLEAR LOCAL DATA (for acceptance test 6)
  const handleClearData = async () => {
    if (
      !window.confirm(
        'WARNING: This will wipe all local data for testing purposes! Make sure you have exported a backup file first. Proceed?'
      )
    ) {
      return;
    }

    try {
      await db.transaction(
        'rw',
        [
          db.sites,
          db.accounts,
          db.materials,
          db.categories,
          db.purchases,
          db.purchaseItems,
          db.payments,
          db.expenses,
          db.labourWork,
          db.stockMovements,
          db.pendingAiTransactions,
          db.auditLogs
        ],
        async () => {
          await db.sites.clear();
          await db.accounts.clear();
          await db.materials.clear();
          await db.categories.clear();
          await db.purchases.clear();
          await db.purchaseItems.clear();
          await db.payments.clear();
          await db.expenses.clear();
          await db.labourWork.clear();
          await db.stockMovements.clear();
          await db.pendingAiTransactions.clear();
          await db.auditLogs.clear();
        }
      );

      await setCurrentSiteId(null);
      triggerRefresh();
      showToast('Local database cleared for testing', 'info');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-construction-400" />
          <span>Local Backup & Restore (Offline-First)</span>
        </h2>
        <p className="text-xs text-charcoal-400 mt-0.5">
          Your data is stored 100% locally on this device in IndexedDB. Export regular backups to protect your site records.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {importSummary && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{importSummary}</span>
        </div>
      )}

      {/* Two Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-construction-500/10 border border-construction-500/40 text-construction-400 flex items-center justify-center mb-3 font-bold">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Export Local Backup</h3>
            <p className="text-xs text-charcoal-300 mt-1">
              Downloads a complete structured JSON file containing all sites, accounts, materials, purchase bills, payments, and movements.
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="w-full bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow disabled:opacity-50 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Download Application Backup (.json)'}</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Restore from Backup</h3>
            <p className="text-xs text-charcoal-300 mt-1">
              Restore your site records from a previously exported backup file. All accounts, rates, and stock will be recovered.
            </p>
          </div>

          <label className="w-full bg-charcoal-800 hover:bg-charcoal-750 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 border border-charcoal-700 cursor-pointer transition shadow active:scale-95">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>{isImporting ? 'Restoring Database...' : 'Select Backup File to Restore'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Acceptance Test 6 Utility: Reset / Wipe local database */}
      <div className="bg-charcoal-950/60 border border-charcoal-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-charcoal-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Testing Sandbox: Clear Local Data</span>
          </div>
          <p className="text-xs text-charcoal-400 mt-0.5 max-w-xl">
            For validating Acceptance Test 6: Create backup, delete local data, and restore backup to verify zero data loss.
          </p>
        </div>

        <button
          onClick={handleClearData}
          className="bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5 inline mr-1" />
          Clear Local Data (Test Env)
        </button>
      </div>
    </div>
  );
};
