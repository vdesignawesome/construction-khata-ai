import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { db, PREDEFINED_CATEGORIES, STANDARD_UNITS } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { createPurchase, updatePurchase } from '../../engine/accounting';
import { formatCurrency } from '../../utils/formatters';
import type { Account, Material, PaymentMode, Purchase } from '../../types';

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseToEdit?: Purchase | null;
}

interface FormLineItem {
  category: string;
  materialId: string;
  quantity: number;
  rate: number;
  discount: number;
  tax: number;
  totalAmount?: number;
}

const CATEGORY_DEFAULT_UNITS: Record<string, string> = {
  Cement: 'bags',
  Steel: 'kg',
  Brick: 'pcs',
  Sand: 'cft',
  Bajri: 'cft',
  Plumbing: 'pcs',
  Sanitary: 'pcs',
  Electrical: 'pcs',
  Tiles: 'sq ft',
  Hardware: 'pcs',
  Paint: 'liter',
  Wood: 'cft',
  Glass: 'sq ft',
  Other: 'pcs'
};

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  purchaseToEdit
}) => {
  const { currentSiteId, showToast, triggerRefresh } = useAppStore();

  const [suppliers, setSuppliers] = useState<Account[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Form State
  const [supplierId, setSupplierId] = useState(purchaseToEdit?.supplierId || '');
  const [invoiceNumber, setInvoiceNumber] = useState(purchaseToEdit?.invoiceNumber || '');
  const [date, setDate] = useState(purchaseToEdit?.date || new Date().toISOString().split('T')[0]);
  const [billCategory, setBillCategory] = useState<string>('all');
  const [items, setItems] = useState<FormLineItem[]>([
    { category: 'Cement', materialId: '', quantity: 1, rate: 0, discount: 0, tax: 0 }
  ]);
  const [paidAmount, setPaidAmount] = useState<number>(purchaseToEdit?.paidAmount || 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [notes, setNotes] = useState(purchaseToEdit?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick New Supplier inline
  const [newSupplierName, setNewSupplierName] = useState('');
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  // Quick Add Material inside a Category
  const [quickAddModal, setQuickAddModal] = useState<{
    isOpen: boolean;
    rowIndex: number;
    category: string;
    name: string;
    unit: string;
  }>({
    isOpen: false,
    rowIndex: -1,
    category: 'Cement',
    name: '',
    unit: 'bags'
  });

  useEffect(() => {
    if (isOpen && currentSiteId) {
      initForm();
    }
  }, [isOpen, currentSiteId, purchaseToEdit]);

  const initForm = async () => {
    if (!currentSiteId) return;

    // Load active suppliers & materials
    const suppList = await db.accounts
      .where({ siteId: currentSiteId, type: 'supplier', status: 'active' })
      .toArray();
    setSuppliers(suppList);

    const matList = await db.materials
      .where({ siteId: currentSiteId, status: 'active' })
      .toArray();
    setMaterials(matList);

    if (purchaseToEdit) {
      setSupplierId(purchaseToEdit.supplierId);
      setInvoiceNumber(purchaseToEdit.invoiceNumber || '');
      setDate(purchaseToEdit.date);
      setPaidAmount(purchaseToEdit.paidAmount || 0);
      setPaymentMode('cash');
      setNotes(purchaseToEdit.notes || '');

      // Load existing line items: from purchaseToEdit.items or db.purchaseItems
      let existingItems = purchaseToEdit.items;
      if (!existingItems || existingItems.length === 0) {
        existingItems = await db.purchaseItems.where({ purchaseId: purchaseToEdit.id }).toArray();
      }

      if (existingItems && existingItems.length > 0) {
        const loadedItems = existingItems.map(it => {
          const m = matList.find(mat => mat.id === it.materialId);
          const qty = it.quantity || 1;
          const r = it.rate || 0;
          return {
            category: it.category || m?.category || 'Cement',
            materialId: it.materialId,
            quantity: qty,
            rate: r,
            discount: it.discount || 0,
            tax: it.tax || 0,
            totalAmount: Math.round(qty * r * 100) / 100
          };
        });
        setItems(loadedItems);
        // Check if all items belong to a single category
        const uniqueCats = Array.from(new Set(loadedItems.map(i => i.category)));
        if (uniqueCats.length === 1) {
          setBillCategory(uniqueCats[0]);
        } else {
          setBillCategory('all');
        }
      } else if (matList.length > 0) {
        const first = matList[0];
        const defaultR = first.defaultRate || 0;
        setItems([{
          category: first.category || 'Cement',
          materialId: first.id,
          quantity: 1,
          rate: defaultR,
          discount: 0,
          tax: 0,
          totalAmount: defaultR
        }]);
      }
    } else {
      if (suppList.length > 0) {
        setSupplierId(suppList[0].id);
      } else {
        setSupplierId('');
      }
      setInvoiceNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setBillCategory('all');

      if (matList.length > 0) {
        const first = matList[0];
        const defaultR = first.defaultRate || 0;
        setItems([{
          category: first.category || 'Cement',
          materialId: first.id,
          quantity: 1,
          rate: defaultR,
          discount: 0,
          tax: 0,
          totalAmount: defaultR
        }]);
      } else {
        setItems([{
          category: 'Cement',
          materialId: '',
          quantity: 1,
          rate: 0,
          discount: 0,
          tax: 0,
          totalAmount: 0
        }]);
      }
      setPaidAmount(0);
      setPaymentMode('cash');
      setNotes('');
    }
    setError('');
  };

  const handleAddItem = () => {
    const targetCategory = billCategory !== 'all'
      ? billCategory
      : (items[items.length - 1]?.category || PREDEFINED_CATEGORIES[0]);

    const matching = materials.filter(m => m.category === targetCategory);
    const defaultMat = matching[0]?.id || '';
    const defaultRate = matching[0]?.defaultRate || 0;

    setItems([
      ...items,
      {
        category: targetCategory,
        materialId: defaultMat,
        quantity: 1,
        rate: defaultRate,
        discount: 0,
        tax: 0,
        totalAmount: defaultRate * 1
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemCategoryChange = (index: number, newCat: string) => {
    const updated = [...items];
    const item = { ...updated[index], category: newCat };

    const matching = materials.filter(m => m.category === newCat);
    if (matching.length > 0) {
      item.materialId = matching[0].id;
      item.rate = matching[0].defaultRate || 0;
      item.totalAmount = Math.round(item.quantity * item.rate * 100) / 100;
    } else {
      item.materialId = '';
      item.rate = 0;
      item.totalAmount = 0;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleBillCategoryChange = (newCat: string) => {
    setBillCategory(newCat);
    if (newCat !== 'all') {
      const updated = items.map(item => {
        const matching = materials.filter(m => m.category === newCat);
        const matchFound = matching.some(m => m.id === item.materialId);
        const matId = matchFound ? item.materialId : (matching[0]?.id || '');
        const r = matchFound ? item.rate : (matching[0]?.defaultRate || 0);
        return {
          ...item,
          category: newCat,
          materialId: matId,
          rate: r,
          totalAmount: Math.round(item.quantity * r * 100) / 100
        };
      });
      setItems(updated);
    }
  };

  const handleItemChange = (index: number, field: keyof FormLineItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'materialId') {
      item.materialId = value;
      const mat = materials.find(m => m.id === value);
      if (mat && mat.defaultRate) {
        item.rate = mat.defaultRate;
        item.totalAmount = Math.round(item.quantity * mat.defaultRate * 100) / 100;
      }
    } else if (field === 'quantity') {
      const qty = typeof value === 'number' ? value : parseFloat(value) || 0;
      item.quantity = qty;
      if (item.rate > 0) {
        item.totalAmount = Math.round(qty * item.rate * 100) / 100;
      } else if (item.totalAmount && qty > 0) {
        item.rate = parseFloat((item.totalAmount / qty).toFixed(2));
      }
    } else if (field === 'rate') {
      const r = typeof value === 'number' ? value : parseFloat(value) || 0;
      item.rate = r;
      item.totalAmount = Math.round(item.quantity * r * 100) / 100;
    } else if (field === 'totalAmount') {
      const tot = typeof value === 'number' ? value : parseFloat(value) || 0;
      item.totalAmount = tot;
      item.rate = item.quantity > 0 ? parseFloat((tot / item.quantity).toFixed(2)) : 0;
    } else {
      (item as any)[field] = value;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleGrandTotalChange = (newGrandTotal: number) => {
    if (items.length === 1) {
      handleItemChange(0, 'totalAmount', newGrandTotal);
    } else if (items.length > 1) {
      const currentSub = items.reduce((sum, it) => sum + (it.totalAmount ?? (it.quantity * it.rate)), 0);
      if (currentSub > 0) {
        const ratio = newGrandTotal / currentSub;
        const updated = items.map(it => {
          const oldTot = it.totalAmount ?? (it.quantity * it.rate);
          const newTot = Math.round(oldTot * ratio * 100) / 100;
          const newRate = it.quantity > 0 ? parseFloat((newTot / it.quantity).toFixed(2)) : it.rate;
          return {
            ...it,
            rate: newRate,
            totalAmount: newTot
          };
        });
        setItems(updated);
      }
    }
  };

  const openQuickAddMaterial = (rowIndex: number, category: string) => {
    setQuickAddModal({
      isOpen: true,
      rowIndex,
      category,
      name: '',
      unit: CATEGORY_DEFAULT_UNITS[category] || 'pcs'
    });
  };

  const handleSaveQuickMaterial = async () => {
    if (!quickAddModal.name.trim() || !currentSiteId) return;

    const matId = 'mat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newMat: Material = {
      id: matId,
      siteId: currentSiteId,
      category: quickAddModal.category,
      name: quickAddModal.name.trim(),
      unit: quickAddModal.unit,
      minimumStock: 10,
      defaultRate: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.materials.add(newMat);
    const updatedMaterials = [...materials, newMat];
    setMaterials(updatedMaterials);

    // Auto-select this newly created material in the row
    if (quickAddModal.rowIndex >= 0 && quickAddModal.rowIndex < items.length) {
      const updated = [...items];
      updated[quickAddModal.rowIndex].category = quickAddModal.category;
      updated[quickAddModal.rowIndex].materialId = newMat.id;
      setItems(updated);
    }

    showToast(`Added "${newMat.name}" under ${newMat.category}!`, 'success');
    setQuickAddModal({ isOpen: false, rowIndex: -1, category: 'Cement', name: '', unit: 'bags' });
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => {
    const itemTot = item.totalAmount !== undefined ? item.totalAmount : (item.quantity * item.rate);
    return sum + itemTot;
  }, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);
  const pendingAmount = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim() || !currentSiteId) return;
    const newSupp: Account = {
      id: 'acc_supp_' + Date.now(),
      siteId: currentSiteId,
      type: 'supplier',
      name: newSupplierName.trim(),
      openingBalance: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.accounts.add(newSupp);
    setSuppliers([...suppliers, newSupp]);
    setSupplierId(newSupp.id);
    setNewSupplierName('');
    setShowAddSupplier(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSiteId) return;
    if (!supplierId) {
      setError('Please select or add a supplier');
      return;
    }
    if (items.some(i => !i.materialId || i.quantity <= 0)) {
      setError('All items must have a valid material and quantity greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (purchaseToEdit) {
        await updatePurchase({
          siteId: currentSiteId,
          purchaseId: purchaseToEdit.id,
          supplierId,
          invoiceNumber: invoiceNumber.trim() || undefined,
          date,
          items,
          notes: notes.trim() || undefined
        });
        triggerRefresh();
        showToast('Purchase invoice & stock updated!', 'success');
      } else {
        await createPurchase({
          siteId: currentSiteId,
          supplierId,
          invoiceNumber: invoiceNumber.trim() || undefined,
          date,
          items,
          paidAmount: Number(paidAmount) || 0,
          paymentMode,
          notes: notes.trim() || undefined
        });
        showToast('Purchase invoice saved and stock updated!', 'success');
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-3xl w-full max-w-full sm:max-w-[96vw] lg:max-w-5xl xl:max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-construction-500/20 text-construction-400 rounded-2xl border border-construction-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {purchaseToEdit ? 'Edit Purchase Bill' : 'New Purchase Bill (मटेरियल खरीद बिल)'}
                </h3>
                <span className="hidden sm:inline-block bg-construction-500/15 text-construction-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-construction-500/30 uppercase">
                  Rate ↔ Total Auto-Sync
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-0.5">
                {purchaseToEdit
                  ? 'Update bill invoice number, date, rates, or remarks'
                  : 'Enter material bill with auto rate & total calculation and instant stock update'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-xl transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 overscroll-contain">
          {error && (
            <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier & Invoice metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-charcoal-950/70 p-4 rounded-2xl border border-charcoal-800">
            {/* Supplier select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-charcoal-300">Supplier (दुकानदार / सप्लायर) *</label>
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="text-[11px] text-construction-400 hover:underline font-bold"
                >
                  {showAddSupplier ? 'Cancel' : '+ New Supplier'}
                </button>
              </div>

              {showAddSupplier ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="New Supplier Name"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSupplier}
                    className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 px-3 rounded-xl text-xs font-black transition"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white font-medium focus:outline-none focus:border-construction-500"
                >
                  <option value="">-- Select Supplier / Firm --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1.5">
                Bill / Invoice No. (बिल नंबर)
              </label>
              <input
                type="text"
                placeholder="e.g. INV-1042"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500 font-mono"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1.5">Bill Date (तारीख) *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-construction-500"
              />
            </div>

            {/* Bill Category Filter */}
            <div>
              <label className="block text-xs font-bold text-charcoal-300 mb-1.5">
                Bill Category (बिल की श्रेणी)
              </label>
              <select
                value={billCategory}
                onChange={(e) => handleBillCategoryChange(e.target.value)}
                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-construction-400 font-bold focus:outline-none focus:border-construction-500"
              >
                <option value="all" className="bg-charcoal-900 text-white">⚡ All Categories (Mixed Bill)</option>
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-charcoal-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border border-charcoal-800 rounded-2xl p-3.5 sm:p-5 bg-charcoal-950/40 space-y-3.5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-charcoal-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Material Items List ({items.length})
                </span>
                <span className="text-xs text-charcoal-500">•</span>
                <span className="text-[11px] text-charcoal-400 hidden sm:inline">
                  Tip: You can edit either <strong className="text-white">Rate</strong> or <strong className="text-amber-400">Total Amount</strong> directly
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="bg-construction-500/15 hover:bg-construction-500/25 border border-construction-500/40 text-construction-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto active:scale-95 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Item</span>
              </button>
            </div>

            {/* Desktop Table Headers */}
            <div className="hidden lg:grid grid-cols-12 gap-3 text-[11px] font-extrabold uppercase tracking-wider text-charcoal-400 px-3 py-2 bg-charcoal-950/80 rounded-xl border border-charcoal-800">
              <div className="col-span-2">1. Category</div>
              <div className="col-span-3">2. Material / Item</div>
              <div className="col-span-2">3. Quantity (मात्रा)</div>
              <div className="col-span-2">4. Rate (दर ₹)</div>
              <div className="col-span-2 text-amber-400">5. Total Amount (रकम ₹)</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {/* Items Rows */}
            <div className="space-y-3">
              {items.map((item, idx) => {
                const categoryMaterials = materials.filter((m) => m.category === item.category);
                const selectedMat = materials.find((m) => m.id === item.materialId);
                const currentLineTotal = item.totalAmount !== undefined ? item.totalAmount : (item.quantity * item.rate);

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2.5 sm:gap-3 items-center bg-charcoal-900/90 p-3 sm:p-3.5 rounded-2xl border border-charcoal-800 hover:border-charcoal-700 transition shadow-sm text-xs"
                  >
                    {/* Category Column */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-2">
                      <div className="lg:hidden text-[10px] text-charcoal-400 font-bold mb-1">
                        1. Category
                      </div>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemCategoryChange(idx, e.target.value)}
                        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-white font-bold text-xs focus:outline-none focus:border-construction-500"
                      >
                        {PREDEFINED_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Material Item Column */}
                    <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                      <div className="lg:hidden text-[10px] text-charcoal-400 font-bold mb-1 flex items-center justify-between">
                        <span>2. Item under {item.category}</span>
                        <button
                          type="button"
                          onClick={() => openQuickAddMaterial(idx, item.category)}
                          className="text-construction-400 text-[10px] font-bold"
                        >
                          + New Item
                        </button>
                      </div>
                      <div className="flex gap-1.5">
                        <select
                          value={item.materialId}
                          onChange={(e) => {
                            if (e.target.value === '__NEW__') {
                              openQuickAddMaterial(idx, item.category);
                            } else {
                              handleItemChange(idx, 'materialId', e.target.value);
                            }
                          }}
                          className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-construction-500 truncate font-semibold"
                        >
                          <option value="">
                            {categoryMaterials.length === 0
                              ? `-- No ${item.category} items yet --`
                              : `-- Select ${item.category} Item --`}
                          </option>
                          {categoryMaterials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.unit})
                            </option>
                          ))}
                          <option value="__NEW__">➕ Add New Item in {item.category}...</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => openQuickAddMaterial(idx, item.category)}
                          className="px-2.5 py-1.5 bg-charcoal-800 hover:bg-charcoal-700 text-construction-400 border border-charcoal-700 rounded-xl text-xs font-black shrink-0 transition"
                          title={`Add new item under ${item.category}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <div className="lg:hidden text-[10px] text-charcoal-400 font-bold mb-1">
                        3. Quantity
                      </div>
                      <div className="flex items-center bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden focus-within:border-construction-500">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          placeholder="Qty"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, 'quantity', e.target.value)
                          }
                          className="w-full bg-transparent p-2.5 text-white text-xs focus:outline-none font-bold"
                        />
                        <span className="text-[10px] text-construction-400 pr-2.5 font-bold uppercase shrink-0">
                          {selectedMat?.unit || CATEGORY_DEFAULT_UNITS[item.category] || 'pcs'}
                        </span>
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="col-span-6 sm:col-span-4 lg:col-span-2">
                      <div className="lg:hidden text-[10px] text-charcoal-400 font-bold mb-1">
                        4. Rate (दर ₹)
                      </div>
                      <div className="flex items-center bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden focus-within:border-construction-500">
                        <span className="text-xs text-charcoal-400 pl-2.5 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Rate"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={(e) =>
                            handleItemChange(idx, 'rate', e.target.value)
                          }
                          className="w-full bg-transparent p-2.5 text-white text-xs focus:outline-none font-bold"
                        />
                      </div>
                    </div>

                    {/* Total Amount (Editable Two-Way!) */}
                    <div className="col-span-10 sm:col-span-3 lg:col-span-2">
                      <div className="lg:hidden text-[10px] text-amber-400 font-bold mb-1">
                        5. Total Amount (रकम ₹)
                      </div>
                      <div className="flex items-center bg-amber-500/10 border border-amber-500/40 rounded-xl overflow-hidden focus-within:border-amber-400">
                        <span className="text-xs text-amber-400 pl-2.5 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Total"
                          value={currentLineTotal === 0 ? '' : currentLineTotal}
                          onChange={(e) =>
                            handleItemChange(idx, 'totalAmount', e.target.value)
                          }
                          className="w-full bg-transparent p-2.5 text-amber-300 font-extrabold text-xs focus:outline-none"
                          title="You can type the total amount directly - Rate will auto-calculate!"
                        />
                      </div>
                    </div>

                    {/* Delete Action */}
                    <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-center justify-center">
                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(idx)}
                        className="p-2 text-charcoal-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition disabled:opacity-20"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals & Immediate Payment Settlement */}
          <div className="bg-charcoal-950/70 border border-charcoal-800 rounded-2xl p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Col 1: Notes & Remarks */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-300 mb-1.5">
                    Notes / Remarks (विवरण / टिप्पणी)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Astral CPVC pipes for first floor, bill cleared via cash..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-3 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500 resize-none"
                  />
                </div>
              </div>

              {/* Col 2: Immediate Payment Settlement */}
              <div className="space-y-3 bg-charcoal-900/60 border border-charcoal-800 p-4 rounded-xl">
                <div className="text-[11px] font-black uppercase tracking-wider text-charcoal-300">
                  Payment Settlement (भुगतान विवरण)
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-charcoal-300">
                      Paid Amount Now (रकम दी)
                    </label>
                    <div className="flex gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setPaidAmount(grandTotal)}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Full Paid
                      </button>
                      <span className="text-charcoal-600">|</span>
                      <button
                        type="button"
                        onClick={() => setPaidAmount(0)}
                        className="text-amber-400 hover:underline font-bold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center bg-charcoal-800 border border-charcoal-700 rounded-xl overflow-hidden focus-within:border-construction-500">
                    <span className="text-xs text-charcoal-400 pl-2.5 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      placeholder="0"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent p-2 text-white text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-construction-500 font-semibold"
                  >
                    <option value="cash">💵 Cash (नकद)</option>
                    <option value="upi">📱 UPI / GPay / PhonePe</option>
                    <option value="bank">🏦 Bank Transfer / NEFT</option>
                    <option value="cheque">📝 Cheque (चेक)</option>
                  </select>
                </div>
              </div>

              {/* Col 3: Bill Total & Balance Card */}
              <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-charcoal-400">
                    <span>Total Items:</span>
                    <span className="font-bold text-white">{items.length} items</span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-charcoal-400">
                    <span>Subtotal:</span>
                    <span className="font-bold text-white text-sm">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="pt-2 border-t border-charcoal-800">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal-300">
                        Grand Total (कुल रकम):
                      </span>
                      <div className="flex items-center bg-construction-500/10 border border-construction-500/40 rounded-xl px-2.5 py-1">
                        <span className="text-xs text-construction-400 font-bold mr-1">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={grandTotal === 0 ? '' : grandTotal}
                          onChange={(e) => handleGrandTotalChange(parseFloat(e.target.value) || 0)}
                          className="w-28 bg-transparent text-right font-black text-construction-400 text-sm focus:outline-none"
                          title="Edit Grand Total directly - Rate will auto-calculate!"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-charcoal-800 flex justify-between items-center text-xs">
                  <span className="text-charcoal-400">Remaining Balance:</span>
                  <span
                    className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                      pendingAmount > 0
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {formatCurrency(pendingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          </div>

          {/* Sticky Pinned Footer Actions */}
          <div className="p-3 sm:p-4 bg-charcoal-950 border-t border-charcoal-800 flex items-center justify-between sm:justify-end gap-3 shrink-0 safe-area-bottom">
            <div className="text-left sm:hidden">
              <div className="text-[10px] text-charcoal-400">Total: <strong className="text-construction-400 font-extrabold">{formatCurrency(grandTotal)}</strong></div>
              <div className="text-[10px] text-amber-400 font-bold">Pending: {formatCurrency(pendingAmount)}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-charcoal-400 hover:text-white hover:bg-charcoal-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black px-5 py-2.5 rounded-xl text-xs transition shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : purchaseToEdit ? 'Save Changes' : 'Save Purchase Bill'}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Add Material Modal for specific Category */}
        {quickAddModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="bg-charcoal-900 border border-charcoal-700 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-charcoal-800">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Add New Item in {quickAddModal.category}
                  </h4>
                  <p className="text-[11px] text-charcoal-400">
                    Will be saved under category: {quickAddModal.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ ...quickAddModal, isOpen: false })}
                  className="p-1 text-charcoal-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-300 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder={
                      quickAddModal.category === 'Cement'
                        ? 'e.g. PPC, OPC 43'
                        : quickAddModal.category === 'Sanitary'
                        ? 'e.g. Wash Basin, Western Seat'
                        : quickAddModal.category === 'Electrical'
                        ? 'e.g. 1.5 sq mm Wire, 16A Switch'
                        : 'e.g. Item Name'
                    }
                    value={quickAddModal.name}
                    onChange={(e) =>
                      setQuickAddModal({ ...quickAddModal, name: e.target.value })
                    }
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-construction-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-300 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={quickAddModal.unit}
                    onChange={(e) =>
                      setQuickAddModal({ ...quickAddModal, unit: e.target.value })
                    }
                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-construction-500"
                  >
                    {STANDARD_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickAddModal({ ...quickAddModal, isOpen: false })}
                  className="px-3 py-1.5 text-xs text-charcoal-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickMaterial}
                  className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow active:scale-95"
                >
                  Save &amp; Select Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
