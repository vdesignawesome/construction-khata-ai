import Dexie, { type Table } from 'dexie';
import type {
  Site,
  Account,
  Material,
  MaterialCategory,
  StockMovement,
  Purchase,
  PurchaseItem,
  Payment,
  SiteExpense,
  LabourWork,
  PendingAiTransaction,
  AuditLog,
  AppSettings
} from '../types';

export const PREDEFINED_CATEGORIES: string[] = [
  'Cement',
  'Steel',
  'Brick',
  'Sand',
  'Bajri',
  'Plumbing',
  'Sanitary',
  'Electrical',
  'Tiles',
  'Hardware',
  'Paint',
  'Wood',
  'Glass',
  'Other'
];

export const PREDEFINED_EXPENSE_CATEGORIES: string[] = [
  'Transport',
  'Diesel',
  'Machinery',
  'Electricity',
  'Water',
  'Site Expense',
  'Food',
  'Repair',
  'Vehicle',
  'Rent',
  'Other'
];

export const STANDARD_UNITS: string[] = [
  'pcs',
  'bags',
  'feet',
  'ft',
  'rft',
  'sq ft',
  'cu ft',
  'cft',
  'kg',
  'ton',
  'meter',
  'bundle',
  'liter',
  'truck',
  'trolley'
];

export class ConstructionKhataDatabase extends Dexie {
  sites!: Table<Site, string>;
  accounts!: Table<Account, string>;
  materials!: Table<Material, string>;
  categories!: Table<MaterialCategory, string>;
  purchases!: Table<Purchase, string>;
  purchaseItems!: Table<PurchaseItem, string>;
  payments!: Table<Payment, string>;
  expenses!: Table<SiteExpense, string>;
  labourWork!: Table<LabourWork, string>;
  stockMovements!: Table<StockMovement, string>;
  pendingAiTransactions!: Table<PendingAiTransaction, string>;
  auditLogs!: Table<AuditLog, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('ConstructionKhataDB');

    this.version(1).stores({
      sites: 'id, name, status, createdAt',
      accounts: 'id, siteId, type, name, status, [siteId+type]',
      materials: 'id, siteId, category, name, status, [siteId+category]',
      categories: 'id, name',
      purchases: 'id, siteId, supplierId, date, paymentStatus, [siteId+supplierId], [siteId+date]',
      purchaseItems: 'id, purchaseId, siteId, materialId, [siteId+materialId]',
      payments: 'id, siteId, accountId, accountType, date, [siteId+accountId], [siteId+date]',
      expenses: 'id, siteId, category, date, [siteId+category], [siteId+date]',
      labourWork: 'id, siteId, labourAccountId, date, [siteId+labourAccountId], [siteId+date]',
      stockMovements: 'id, siteId, materialId, type, date, [siteId+materialId], [siteId+date]',
      pendingAiTransactions: 'id, siteId, status, createdAt',
      auditLogs: 'id, siteId, entity, action, timestamp',
      settings: 'id'
    });
  }
}

export const db = new ConstructionKhataDatabase();

// Initialize default data if fresh database
export async function initializeDatabase() {
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    const defaultCategories: MaterialCategory[] = PREDEFINED_CATEGORIES.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      isPredefined: true
    }));
    await db.categories.bulkAdd(defaultCategories);
  }

  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      currencySymbol: '₹',
      language: 'en',
      isLockEnabled: false,
      theme: 'dark',
      contractorName: 'Builder / Contractor',
      businessName: 'Site Office'
    });
  }
}

// Log audit trail
export async function logAudit(
  siteId: string,
  entity: AuditLog['entity'],
  entityId: string,
  action: AuditLog['action'],
  oldValue?: any,
  newValue?: any
) {
  try {
    await db.auditLogs.add({
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      siteId,
      timestamp: Date.now(),
      entity,
      entityId,
      action,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined
    });
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}
