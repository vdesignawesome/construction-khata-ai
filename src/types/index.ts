export type SiteStatus = 'active' | 'completed' | 'on-hold';

export interface Site {
  id: string;
  name: string;
  clientName?: string;
  location?: string;
  budget?: number;
  startDate?: string;
  status: SiteStatus;
  createdAt: number;
  updatedAt: number;
}

export type AccountType = 'supplier' | 'labour' | 'expense' | 'other';

export interface Account {
  id: string;
  siteId: string;
  type: AccountType;
  name: string;
  phone?: string;
  address?: string;
  openingBalance: number; // positive = we owe them, negative = advance paid
  notes?: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface MaterialCategory {
  id: string;
  name: string;
  isPredefined?: boolean;
}

export interface Material {
  id: string;
  siteId: string; // Site-specific material master / availability
  category: string;
  name: string;
  unit: string; // e.g. "pcs", "bags", "kg", "ton", "sq ft", "bundle", "meters"
  minimumStock: number;
  defaultRate?: number;
  notes?: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export type StockMovementType =
  | 'opening'
  | 'purchase'
  | 'usage'
  | 'return'
  | 'transfer_in'
  | 'transfer_out'
  | 'adjustment';

export interface StockMovement {
  id: string;
  siteId: string;
  materialId: string;
  type: StockMovementType;
  quantity: number; // always positive in storage; calculation applies direction
  unit: string;
  rate?: number;
  referenceType?: 'purchase' | 'usage' | 'return' | 'transfer' | 'manual';
  referenceId?: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  siteId: string;
  materialId: string;
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // discount amount on line
  tax: number; // tax amount on line
  lineTotal: number;
}

export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface Purchase {
  id: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber?: string;
  date: string; // YYYY-MM-DD
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  items: PurchaseItem[];
  createdAt: number;
  updatedAt: number;
}

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque' | 'other';

export interface Payment {
  id: string;
  siteId: string;
  accountId: string;
  accountType: AccountType;
  accountName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  reference?: string; // cheque no, UTR, transaction id
  notes?: string;
  purchaseId?: string; // optional direct link to purchase
  createdAt: number;
  updatedAt?: number;
}

export interface SiteExpense {
  id: string;
  siteId: string;
  category: string; // Transport, Diesel, Machinery, Electricity, Water, Site Expense, Food, Repair, Vehicle, Rent, Other
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  paidTo?: string;
  notes?: string;
  createdAt: number;
}

// NOTE: NO ATTENDANCE! Labour is purely a financial account with Work & Payments
export interface LabourWork {
  id: string;
  siteId: string;
  labourAccountId: string;
  labourName: string;
  workDescription: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: number;
}

export interface PendingAiTransaction {
  id: string;
  siteId: string;
  rawText: string;
  parsedType: 'purchase' | 'payment' | 'expense' | 'labour_work' | 'material_usage' | 'material_return' | 'unknown';
  structuredData: {
    accountId?: string;
    accountName?: string;
    accountType?: AccountType;
    materialId?: string;
    materialName?: string;
    category?: string;
    quantity?: number;
    unit?: string;
    rate?: number;
    amount?: number;
    paidAmount?: number;
    paymentMode?: PaymentMode;
    date?: string;
    notes?: string;
  };
  missingFields: string[]; // e.g. ["quantity", "rate", "supplier"]
  clarificationRequired?: string; // e.g. "Multiple Rakesh found: Plumber or Mason?"
  clarificationOptions?: { id: string; label: string; subtext?: string }[];
  status: 'pending_review' | 'confirmed' | 'discarded';
  createdAt: number;
}

export interface AuditLog {
  id: string;
  siteId: string;
  timestamp: number;
  entity: 'site' | 'account' | 'material' | 'purchase' | 'payment' | 'expense' | 'labour_work' | 'stock_movement';
  entityId: string;
  action: 'create' | 'update' | 'archive' | 'payment' | 'purchase' | 'usage' | 'return' | 'restore';
  oldValue?: string;
  newValue?: string;
}

export interface AppSettings {
  id: string;
  currencySymbol: string;
  language: 'en' | 'hi' | 'hinglish';
  pinCode?: string; // Optional security PIN
  isLockEnabled: boolean;
  theme: 'dark' | 'light';
  contractorName?: string;
  businessName?: string;
  phone?: string;
}

// Calculated view interfaces
export interface SupplierLedgerSummary {
  supplierId: string;
  supplierName: string;
  phone?: string;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  outstanding: number; // openingBalance + totalPurchases - totalPayments
  purchasesCount: number;
  paymentsCount: number;
}

export interface LabourLedgerSummary {
  labourId: string;
  labourName: string;
  phone?: string;
  openingBalance: number;
  totalWorkAmount: number;
  totalPayments: number;
  outstanding: number; // openingBalance + totalWorkAmount - totalPayments
  workEntriesCount: number;
  paymentsCount: number;
}

export interface MaterialStockSummary {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  minimumStock: number;
  currentStock: number;
  openingStock: number;
  totalPurchased: number;
  totalUsed: number;
  totalReturned: number;
  totalTransferredIn: number;
  totalTransferredOut: number;
  totalAdjusted: number;
  lastPurchaseRate?: number;
  averageRate?: number;
  isLowStock: boolean;
}

export interface SiteFinancialSummary {
  siteId: string;
  siteName: string;
  totalProjectCost: number; // Material Purchases Total + Labour Work Total + Site Expenses Total
  materialCost: number;
  labourCost: number;
  otherExpenses: number;
  totalPaid: number; // Payments to Suppliers + Payments to Labour + Direct Expenses
  totalPending: number; // Supplier Outstanding + Labour Outstanding
  supplierOutstanding: number;
  labourOutstanding: number;
  pendingPaymentCount: number;
  lowStockItemsCount: number;
}
