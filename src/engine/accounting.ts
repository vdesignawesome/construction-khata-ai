import { db, logAudit } from '../db';
import type {
  Purchase,
  PurchaseItem,
  Payment,
  StockMovement,
  SiteFinancialSummary,
  SupplierLedgerSummary,
  LabourLedgerSummary,
  MaterialStockSummary,
  LabourWork,
  SiteExpense
} from '../types';

/**
 * DEDICATED BUSINESS LOGIC ENGINE FOR CONSTRUCTION KHATA AI
 * All calculations are performed here, never directly in UI components.
 * Strict site_id filtering is enforced on every operation.
 */

// ==========================================
// 1. STOCK CALCULATION & MOVEMENTS
// ==========================================

export async function calculateMaterialStock(
  siteId: string,
  materialId: string
): Promise<MaterialStockSummary> {
  const material = await db.materials.get(materialId);
  if (!material || material.siteId !== siteId) {
    throw new Error(`Material not found or does not belong to site ${siteId}`);
  }

  // Get all stock movements for this site and material
  const movements = await db.stockMovements
    .where({ siteId, materialId })
    .toArray();

  let openingStock = 0;
  let totalPurchased = 0;
  let totalUsed = 0;
  let totalReturned = 0;
  let totalTransferredIn = 0;
  let totalTransferredOut = 0;
  let totalAdjusted = 0;

  for (const m of movements) {
    const qty = Number(m.quantity) || 0;
    switch (m.type) {
      case 'opening':
        openingStock += qty;
        break;
      case 'purchase':
        totalPurchased += qty;
        break;
      case 'usage':
        totalUsed += qty;
        break;
      case 'return':
        totalReturned += qty;
        break;
      case 'transfer_in':
        totalTransferredIn += qty;
        break;
      case 'transfer_out':
        totalTransferredOut += qty;
        break;
      case 'adjustment':
        totalAdjusted += qty;
        break;
    }
  }

  // Formula as required:
  // Current Stock = Opening Stock + Purchases + Transfers In + Returns - Material Usage - Transfers Out +/- Adjustments
  const currentStock =
    openingStock +
    totalPurchased +
    totalTransferredIn +
    totalReturned -
    totalUsed -
    totalTransferredOut +
    totalAdjusted;

  // Rate history
  const rateHistory = await getMaterialRateHistory(siteId, materialId);

  return {
    materialId: material.id,
    name: material.name,
    category: material.category,
    unit: material.unit,
    minimumStock: material.minimumStock || 0,
    currentStock,
    openingStock,
    totalPurchased,
    totalUsed,
    totalReturned,
    totalTransferredIn,
    totalTransferredOut,
    totalAdjusted,
    lastPurchaseRate: rateHistory.lastPurchaseRate,
    averageRate: rateHistory.averageRate,
    isLowStock: currentStock <= (material.minimumStock || 0)
  };
}

export async function getAllMaterialStocksForSite(siteId: string): Promise<MaterialStockSummary[]> {
  const materials = await db.materials.where({ siteId, status: 'active' }).toArray();
  const summaries: MaterialStockSummary[] = [];
  for (const mat of materials) {
    const stock = await calculateMaterialStock(siteId, mat.id);
    summaries.push(stock);
  }
  return summaries;
}

export async function getMaterialRateHistory(siteId: string, materialId: string) {
  // Query all purchase items for this site & material
  const items = await db.purchaseItems
    .where({ siteId, materialId })
    .toArray();

  if (items.length === 0) {
    const material = await db.materials.get(materialId);
    return {
      lastPurchaseRate: material?.defaultRate,
      averageRate: material?.defaultRate,
      history: []
    };
  }

  // Get parent purchases to retrieve dates
  const historyWithDates = [];
  let totalCost = 0;
  let totalQty = 0;

  for (const item of items) {
    const purchase = await db.purchases.get(item.purchaseId);
    if (purchase && purchase.siteId === siteId) {
      historyWithDates.push({
        date: purchase.date,
        supplierName: purchase.supplierName,
        quantity: item.quantity,
        rate: item.rate,
        unit: item.unit,
        lineTotal: item.lineTotal
      });
      totalCost += item.lineTotal;
      totalQty += item.quantity;
    }
  }

  // Sort by date ascending
  historyWithDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lastPurchase = historyWithDates[historyWithDates.length - 1];
  const lastPurchaseRate = lastPurchase ? lastPurchase.rate : undefined;
  const averageRate = totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : undefined;

  return {
    lastPurchaseRate,
    averageRate,
    history: historyWithDates
  };
}

// Record Material Usage
export async function recordMaterialUsage(params: {
  siteId: string;
  materialId: string;
  quantity: number;
  date: string;
  notes?: string;
}): Promise<StockMovement> {
  const { siteId, materialId, quantity, date, notes } = params;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const material = await db.materials.get(materialId);
  if (!material || material.siteId !== siteId) {
    throw new Error('Material not found for this site');
  }

  const stockInfo = await calculateMaterialStock(siteId, materialId);
  // Allow usage even if low stock, but we track it accurately
  const movement: StockMovement = {
    id: 'sm_use_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    siteId,
    materialId,
    type: 'usage',
    quantity,
    unit: material.unit,
    referenceType: 'usage',
    date,
    notes: notes || `Used on site`,
    createdAt: Date.now()
  };

  await db.stockMovements.add(movement);
  await logAudit(siteId, 'stock_movement', movement.id, 'usage', { currentStockBefore: stockInfo.currentStock }, movement);

  return movement;
}

// Record Material Return
export async function recordMaterialReturn(params: {
  siteId: string;
  materialId: string;
  quantity: number;
  date: string;
  supplierId?: string;
  notes?: string;
}): Promise<StockMovement> {
  const { siteId, materialId, quantity, date, notes } = params;

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const material = await db.materials.get(materialId);
  if (!material || material.siteId !== siteId) {
    throw new Error('Material not found for this site');
  }

  const movement: StockMovement = {
    id: 'sm_ret_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    siteId,
    materialId,
    type: 'return',
    quantity,
    unit: material.unit,
    referenceType: 'return',
    date,
    notes: notes || `Returned material`,
    createdAt: Date.now()
  };

  await db.stockMovements.add(movement);
  await logAudit(siteId, 'stock_movement', movement.id, 'return', null, movement);

  return movement;
}

// ==========================================
// 2. PURCHASE ENGINE & MULTI-LINE ITEMS
// ==========================================

export async function createPurchase(params: {
  siteId: string;
  supplierId: string;
  invoiceNumber?: string;
  date: string;
  items: Array<{
    materialId: string;
    quantity: number;
    rate: number;
    discount?: number;
    tax?: number;
  }>;
  paidAmount?: number;
  paymentMode?: Payment['paymentMode'];
  paymentReference?: string;
  notes?: string;
}): Promise<Purchase> {
  const { siteId, supplierId, invoiceNumber, date, items, notes } = params;

  if (!items || items.length === 0) {
    throw new Error('Purchase must contain at least one line item');
  }

  const supplier = await db.accounts.get(supplierId);
  if (!supplier || supplier.siteId !== siteId || supplier.type !== 'supplier') {
    throw new Error('Valid supplier required for this site');
  }

  const purchaseId = 'pur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  const processedItems: PurchaseItem[] = [];
  const stockMovementsToCreate: StockMovement[] = [];

  for (const item of items) {
    if (item.quantity <= 0) throw new Error('Item quantity must be greater than 0');
    if (item.rate < 0) throw new Error('Item rate cannot be negative');

    const material = await db.materials.get(item.materialId);
    if (!material || material.siteId !== siteId) {
      throw new Error(`Material ${item.materialId} not found for this site`);
    }

    const itemSubtotal = item.quantity * item.rate;
    const discount = Number(item.discount) || 0;
    const tax = Number(item.tax) || 0;
    const lineTotal = itemSubtotal - discount + tax;

    subtotal += itemSubtotal;
    totalDiscount += discount;
    totalTax += tax;

    const purchaseItem: PurchaseItem = {
      id: 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      purchaseId,
      siteId,
      materialId: material.id,
      materialName: material.name,
      category: material.category,
      quantity: item.quantity,
      unit: material.unit,
      rate: item.rate,
      discount,
      tax,
      lineTotal
    };
    processedItems.push(purchaseItem);

    // Stock Movement (Purchase increases inventory)
    stockMovementsToCreate.push({
      id: 'sm_pur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      siteId,
      materialId: material.id,
      type: 'purchase',
      quantity: item.quantity,
      unit: material.unit,
      rate: item.rate,
      referenceType: 'purchase',
      referenceId: purchaseId,
      date,
      notes: `Purchase from ${supplier.name}`,
      createdAt: Date.now()
    });
  }

  const total = subtotal - totalDiscount + totalTax;
  const initialPaid = Math.max(0, Number(params.paidAmount) || 0);
  const pendingAmount = Math.max(0, total - initialPaid);

  let paymentStatus: Purchase['paymentStatus'] = 'pending';
  if (initialPaid >= total) {
    paymentStatus = 'paid';
  } else if (initialPaid > 0) {
    paymentStatus = 'partial';
  }

  const purchase: Purchase = {
    id: purchaseId,
    siteId,
    supplierId,
    supplierName: supplier.name,
    invoiceNumber,
    date,
    subtotal,
    discount: totalDiscount,
    tax: totalTax,
    total,
    paidAmount: initialPaid,
    pendingAmount,
    paymentStatus,
    notes,
    items: processedItems,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Perform atomic database transaction
  await db.transaction('rw', [db.purchases, db.purchaseItems, db.stockMovements, db.payments, db.auditLogs], async () => {
    await db.purchases.add(purchase);
    await db.purchaseItems.bulkAdd(processedItems);
    await db.stockMovements.bulkAdd(stockMovementsToCreate);

    if (initialPaid > 0) {
      const payment: Payment = {
        id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        siteId,
        accountId: supplier.id,
        accountType: 'supplier',
        accountName: supplier.name,
        amount: initialPaid,
        date,
        paymentMode: params.paymentMode || 'cash',
        reference: params.paymentReference || (invoiceNumber ? `Inv: ${invoiceNumber}` : 'Direct purchase payment'),
        notes: `Initial payment for purchase ${purchaseId}`,
        purchaseId,
        createdAt: Date.now()
      };
      await db.payments.add(payment);
    }

    await logAudit(siteId, 'purchase', purchaseId, 'purchase', null, purchase);
  });

  return purchase;
}

// ==========================================
// 3. PAYMENT ENGINE
// ==========================================

export async function createPayment(params: {
  siteId: string;
  accountId: string;
  amount: number;
  date: string;
  paymentMode: Payment['paymentMode'];
  reference?: string;
  notes?: string;
  purchaseId?: string;
}): Promise<Payment> {
  const { siteId, accountId, amount, date, paymentMode, reference, notes, purchaseId } = params;

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  const account = await db.accounts.get(accountId);
  if (!account || account.siteId !== siteId) {
    throw new Error('Account not found for this site');
  }

  const payment: Payment = {
    id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    siteId,
    accountId: account.id,
    accountType: account.type,
    accountName: account.name,
    amount,
    date,
    paymentMode,
    reference,
    notes,
    purchaseId,
    createdAt: Date.now()
  };

  await db.transaction('rw', [db.payments, db.purchases, db.auditLogs], async () => {
    await db.payments.add(payment);

    // If payment is linked to a specific purchase, adjust purchase's paid/pending amount
    if (purchaseId) {
      const pur = await db.purchases.get(purchaseId);
      if (pur && pur.siteId === siteId) {
        const newPaid = pur.paidAmount + amount;
        const newPending = Math.max(0, pur.total - newPaid);
        const newStatus = newPaid >= pur.total ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
        await db.purchases.update(purchaseId, {
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
          updatedAt: Date.now()
        });
      }
    }

    await logAudit(siteId, 'payment', payment.id, 'payment', null, payment);
  });

  return payment;
}

// ==========================================
// 4. LABOUR WORK ENGINE (NO ATTENDANCE!)
// ==========================================

export async function createLabourWork(params: {
  siteId: string;
  labourAccountId: string;
  workDescription: string;
  amount: number;
  date: string;
  notes?: string;
}): Promise<LabourWork> {
  const { siteId, labourAccountId, workDescription, amount, date, notes } = params;

  if (amount <= 0) {
    throw new Error('Labour work amount must be greater than zero');
  }

  const labour = await db.accounts.get(labourAccountId);
  if (!labour || labour.siteId !== siteId || labour.type !== 'labour') {
    throw new Error('Valid labour account required for this site');
  }

  const work: LabourWork = {
    id: 'lw_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    siteId,
    labourAccountId: labour.id,
    labourName: labour.name,
    workDescription,
    amount,
    date,
    notes,
    createdAt: Date.now()
  };

  await db.labourWork.add(work);
  await logAudit(siteId, 'labour_work', work.id, 'create', null, work);

  return work;
}

// ==========================================
// 5. SITE EXPENSE ENGINE
// ==========================================

export async function createSiteExpense(params: {
  siteId: string;
  category: string;
  amount: number;
  date: string;
  paymentMode: Payment['paymentMode'];
  paidTo?: string;
  notes?: string;
}): Promise<SiteExpense> {
  const { siteId, category, amount, date, paymentMode, paidTo, notes } = params;

  if (amount <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  const expense: SiteExpense = {
    id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    siteId,
    category,
    amount,
    date,
    paymentMode,
    paidTo,
    notes,
    createdAt: Date.now()
  };

  await db.expenses.add(expense);
  await logAudit(siteId, 'expense', expense.id, 'create', null, expense);

  return expense;
}

// ==========================================
// 6. LEDGER & OUTSTANDING CALCULATIONS
// ==========================================

export async function calculateSupplierLedger(
  siteId: string,
  supplierId: string
): Promise<SupplierLedgerSummary> {
  const supplier = await db.accounts.get(supplierId);
  if (!supplier || supplier.siteId !== siteId) {
    throw new Error('Supplier not found for this site');
  }

  const purchases = await db.purchases.where({ siteId, supplierId }).toArray();
  const payments = await db.payments.where({ siteId, accountId: supplierId }).toArray();

  const totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalPayments = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const openingBalance = Number(supplier.openingBalance) || 0;

  // Outstanding = Opening Balance + Total Purchases - Total Payments
  const outstanding = openingBalance + totalPurchases - totalPayments;

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    phone: supplier.phone,
    openingBalance,
    totalPurchases,
    totalPayments,
    outstanding,
    purchasesCount: purchases.length,
    paymentsCount: payments.length
  };
}

export async function calculateLabourLedger(
  siteId: string,
  labourId: string
): Promise<LabourLedgerSummary> {
  const labour = await db.accounts.get(labourId);
  if (!labour || labour.siteId !== siteId) {
    throw new Error('Labour account not found for this site');
  }

  const workList = await db.labourWork.where({ siteId, labourAccountId: labourId }).toArray();
  const payments = await db.payments.where({ siteId, accountId: labourId }).toArray();

  const totalWorkAmount = workList.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const totalPayments = payments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const openingBalance = Number(labour.openingBalance) || 0;

  // Outstanding = Opening Balance + Total Work - Total Payments
  const outstanding = openingBalance + totalWorkAmount - totalPayments;

  return {
    labourId: labour.id,
    labourName: labour.name,
    phone: labour.phone,
    openingBalance,
    totalWorkAmount,
    totalPayments,
    outstanding,
    workEntriesCount: workList.length,
    paymentsCount: payments.length
  };
}

// ==========================================
// 7. SITE FINANCIAL SUMMARY
// ==========================================

export async function calculateSiteFinancialSummary(siteId: string): Promise<SiteFinancialSummary> {
  const site = await db.sites.get(siteId);
  if (!site) {
    throw new Error(`Site not found: ${siteId}`);
  }

  // 1. Material Purchases Total
  const purchases = await db.purchases.where({ siteId }).toArray();
  const materialCost = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  // 2. Labour Cost Total
  // A contractor may enter formal Labour Work bills, OR direct Labour Payments (advances, daily wage), OR both.
  // Effective labour cost for each labour account is Math.max(Total Work, Total Payments).
  // This guarantees that direct payments made to labour (even without a separate work bill)
  // are immediately counted in Labour Cost and Total Project Cost.
  const labourWorks = await db.labourWork.where({ siteId }).toArray();
  const labourPayments = await db.payments.where({ siteId, accountType: 'labour' }).toArray();
  const labourAccounts = await db.accounts.where({ siteId, type: 'labour' }).toArray();

  const labourAccountMap = new Map<string, { work: number; payments: number }>();

  for (const acc of labourAccounts) {
    labourAccountMap.set(acc.id, { work: 0, payments: 0 });
  }

  for (const w of labourWorks) {
    const entry = labourAccountMap.get(w.labourAccountId) || { work: 0, payments: 0 };
    entry.work += Number(w.amount) || 0;
    labourAccountMap.set(w.labourAccountId, entry);
  }

  for (const p of labourPayments) {
    const entry = labourAccountMap.get(p.accountId) || { work: 0, payments: 0 };
    entry.payments += Number(p.amount) || 0;
    labourAccountMap.set(p.accountId, entry);
  }

  let labourCost = 0;
  for (const [, { work, payments }] of labourAccountMap) {
    labourCost += Math.max(work, payments);
  }

  // Fallback if there are any unmapped labour payments/works
  const totalLabourWorkAmount = labourWorks.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const totalLabourPaidAmount = labourPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  if (labourCost === 0 && (totalLabourWorkAmount > 0 || totalLabourPaidAmount > 0)) {
    labourCost = Math.max(totalLabourWorkAmount, totalLabourPaidAmount);
  }

  // 3. Other Site Expenses Total
  const expenses = await db.expenses.where({ siteId }).toArray();
  const otherExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Total Project Cost = Material + Labour + Other Expenses
  const totalProjectCost = materialCost + labourCost + otherExpenses;

  // 4. Payments Made
  const allPayments = await db.payments.where({ siteId }).toArray();
  const totalPaymentsMade = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  // Total Paid across the site includes payments to suppliers, labour, and direct expenses
  const totalPaid = totalPaymentsMade + otherExpenses;

  // 5. Calculate Supplier Outstandings
  const suppliers = await db.accounts.where({ siteId, type: 'supplier', status: 'active' }).toArray();
  let supplierOutstanding = 0;
  let pendingPaymentCount = 0;

  for (const s of suppliers) {
    const sLedger = await calculateSupplierLedger(siteId, s.id);
    if (sLedger.outstanding > 0) {
      supplierOutstanding += sLedger.outstanding;
      pendingPaymentCount++;
    }
  }

  // 6. Calculate Labour Outstandings
  let labourOutstanding = 0;

  for (const l of labourAccounts) {
    if (l.status === 'archived') continue;
    const lLedger = await calculateLabourLedger(siteId, l.id);
    if (lLedger.outstanding > 0) {
      labourOutstanding += lLedger.outstanding;
      pendingPaymentCount++;
    }
  }

  const totalPending = supplierOutstanding + labourOutstanding;

  // 7. Low Stock items count
  const allStocks = await getAllMaterialStocksForSite(siteId);
  const lowStockItemsCount = allStocks.filter(s => s.isLowStock).length;

  return {
    siteId,
    siteName: site.name,
    totalProjectCost,
    materialCost,
    labourCost,
    otherExpenses,
    totalPaid,
    totalPending,
    supplierOutstanding,
    labourOutstanding,
    pendingPaymentCount,
    lowStockItemsCount
  };
}

// ==========================================
// 8. DELETION & AUDIT ROLLBACK OPERATIONS
// ==========================================

export async function deletePurchase(siteId: string, purchaseId: string): Promise<void> {
  const purchase = await db.purchases.get(purchaseId);
  if (!purchase || purchase.siteId !== siteId) {
    throw new Error('Purchase not found for this site');
  }

  await db.transaction('rw', [db.purchases, db.purchaseItems, db.stockMovements, db.payments, db.auditLogs], async () => {
    // 1. Remove associated stock movements (reversing inventory increase)
    const movements = await db.stockMovements
      .where({ siteId, referenceId: purchaseId })
      .toArray();
    for (const m of movements) {
      await db.stockMovements.delete(m.id);
    }

    // 2. Remove purchase line items
    await db.purchaseItems.where({ purchaseId }).delete();

    // 3. Remove linked initial payment if any
    const linkedPayments = await db.payments.where({ siteId, purchaseId }).toArray();
    for (const p of linkedPayments) {
      await db.payments.delete(p.id);
    }

    // 4. Delete the purchase record
    await db.purchases.delete(purchaseId);

    // 5. Log audit trail
    await logAudit(siteId, 'purchase', purchaseId, 'archive', purchase, { status: 'deleted' });
  });
}

export async function deletePayment(siteId: string, paymentId: string): Promise<void> {
  const payment = await db.payments.get(paymentId);
  if (!payment || payment.siteId !== siteId) {
    throw new Error('Payment not found for this site');
  }

  await db.transaction('rw', [db.payments, db.purchases, db.auditLogs], async () => {
    // If linked to a purchase, rollback purchase paid/pending amount
    if (payment.purchaseId) {
      const pur = await db.purchases.get(payment.purchaseId);
      if (pur && pur.siteId === siteId) {
        const newPaid = Math.max(0, pur.paidAmount - payment.amount);
        const newPending = pur.total - newPaid;
        const newStatus = newPaid >= pur.total ? 'paid' : newPaid > 0 ? 'partial' : 'pending';
        await db.purchases.update(pur.id, {
          paidAmount: newPaid,
          pendingAmount: newPending,
          paymentStatus: newStatus,
          updatedAt: Date.now()
        });
      }
    }

    await db.payments.delete(paymentId);
    await logAudit(siteId, 'payment', paymentId, 'archive', payment, { status: 'deleted' });
  });
}

export async function deleteLabourWork(siteId: string, workId: string): Promise<void> {
  const work = await db.labourWork.get(workId);
  if (!work || work.siteId !== siteId) {
    throw new Error('Labour work record not found for this site');
  }

  await db.labourWork.delete(workId);
  await logAudit(siteId, 'labour_work', workId, 'archive', work, { status: 'deleted' });
}

export async function deleteSiteExpense(siteId: string, expenseId: string): Promise<void> {
  const expense = await db.expenses.get(expenseId);
  if (!expense || expense.siteId !== siteId) {
    throw new Error('Expense record not found for this site');
  }

  await db.expenses.delete(expenseId);
  await logAudit(siteId, 'expense', expenseId, 'archive', expense, { status: 'deleted' });
}

export async function deleteAccount(siteId: string, accountId: string): Promise<void> {
  const account = await db.accounts.get(accountId);
  if (!account || account.siteId !== siteId) {
    throw new Error('Account not found for this site');
  }

  // Soft delete / archive to maintain data integrity
  await db.accounts.update(accountId, { status: 'archived', updatedAt: Date.now() });
  await logAudit(siteId, 'account', accountId, 'archive', account, { status: 'archived' });
}

export async function deleteMaterial(siteId: string, materialId: string): Promise<void> {
  const material = await db.materials.get(materialId);
  if (!material || material.siteId !== siteId) {
    throw new Error('Material not found for this site');
  }

  // Soft delete / archive to maintain stock audit integrity
  await db.materials.update(materialId, { status: 'archived', updatedAt: Date.now() });
  await logAudit(siteId, 'material', materialId, 'archive', material, { status: 'archived' });
}

export async function updatePurchase(params: {
  siteId: string;
  purchaseId: string;
  supplierId: string;
  invoiceNumber?: string;
  date: string;
  items: {
    materialId: string;
    quantity: number;
    rate: number;
    discount?: number;
    tax?: number;
  }[];
  notes?: string;
}): Promise<Purchase> {
  const { siteId, purchaseId, supplierId, invoiceNumber, date, items, notes } = params;

  const existingPurchase = await db.purchases.get(purchaseId);
  if (!existingPurchase || existingPurchase.siteId !== siteId) {
    throw new Error('Purchase not found for this site');
  }

  const supplier = await db.accounts.get(supplierId);
  if (!supplier || supplier.siteId !== siteId || supplier.type !== 'supplier') {
    throw new Error('Valid supplier required for this site');
  }

  if (!items || items.length === 0) {
    throw new Error('Purchase must contain at least one line item');
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  const processedItems: PurchaseItem[] = [];
  const stockMovementsToCreate: StockMovement[] = [];

  for (const item of items) {
    if (item.quantity <= 0) throw new Error('Item quantity must be greater than 0');
    if (item.rate < 0) throw new Error('Item rate cannot be negative');

    const material = await db.materials.get(item.materialId);
    if (!material || material.siteId !== siteId) {
      throw new Error(`Material ${item.materialId} not found for this site`);
    }

    const itemSubtotal = item.quantity * item.rate;
    const discount = Number(item.discount) || 0;
    const tax = Number(item.tax) || 0;
    const lineTotal = itemSubtotal - discount + tax;

    subtotal += itemSubtotal;
    totalDiscount += discount;
    totalTax += tax;

    const purchaseItem: PurchaseItem = {
      id: 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      purchaseId,
      siteId,
      materialId: material.id,
      materialName: material.name,
      category: material.category,
      quantity: item.quantity,
      unit: material.unit,
      rate: item.rate,
      discount,
      tax,
      lineTotal
    };
    processedItems.push(purchaseItem);

    // Stock Movement (replaces previous movements)
    stockMovementsToCreate.push({
      id: 'sm_pur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      siteId,
      materialId: material.id,
      type: 'purchase',
      quantity: item.quantity,
      unit: material.unit,
      rate: item.rate,
      referenceType: 'purchase',
      referenceId: purchaseId,
      date,
      notes: `Purchase from ${supplier.name}`,
      createdAt: Date.now()
    });
  }

  const total = subtotal - totalDiscount + totalTax;
  const paidAmount = Number(existingPurchase.paidAmount) || 0;
  const pendingAmount = Math.max(0, total - paidAmount);

  let paymentStatus: Purchase['paymentStatus'] = 'pending';
  if (paidAmount >= total) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }

  const updatedPurchase: Purchase = {
    ...existingPurchase,
    supplierId,
    supplierName: supplier.name,
    invoiceNumber: invoiceNumber ? invoiceNumber.trim() : undefined,
    date,
    subtotal,
    discount: totalDiscount,
    tax: totalTax,
    total,
    pendingAmount,
    paymentStatus,
    notes: notes ? notes.trim() : undefined,
    items: processedItems,
    updatedAt: Date.now()
  };

  await db.transaction('rw', [db.purchases, db.purchaseItems, db.stockMovements, db.auditLogs], async () => {
    // 1. Remove old stock movements for this purchase
    const oldMovements = await db.stockMovements
      .where({ siteId, referenceId: purchaseId })
      .toArray();
    for (const m of oldMovements) {
      await db.stockMovements.delete(m.id);
    }

    // 2. Remove old purchaseItems
    await db.purchaseItems.where({ purchaseId }).delete();

    // 3. Add new purchaseItems
    await db.purchaseItems.bulkAdd(processedItems);

    // 4. Add new stockMovements
    await db.stockMovements.bulkAdd(stockMovementsToCreate);

    // 5. Update purchase record
    await db.purchases.put(updatedPurchase);

    // 6. Audit log
    await logAudit(siteId, 'purchase', purchaseId, 'update', existingPurchase, updatedPurchase);
  });

  return updatedPurchase;
}

