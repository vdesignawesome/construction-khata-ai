import { db } from '../db';
import type { Account, Material, PaymentMode } from '../types';

export interface ParsedAiIntent {
  rawText: string;
  type: 'purchase' | 'payment' | 'expense' | 'labour_work' | 'material_usage' | 'material_return' | 'unknown';
  siteId: string;
  data: {
    accountId?: string;
    accountName?: string;
    accountType?: 'supplier' | 'labour' | 'expense' | 'other';
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
  missingFields: string[];
  clarificationRequired?: string;
  clarificationOptions?: { id: string; label: string; subtext?: string }[];
  isComplete: boolean;
}

// Helper: Normalize strings for fuzzy matching
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Extract currency amounts like 15000, 15,000, 15k, ₹5000, 420 ke, etc.
function extractNumbers(text: string): { amount?: number; quantity?: number; rate?: number } {
  const norm = text.toLowerCase();

  let amount: number | undefined;
  let quantity: number | undefined;
  let rate: number | undefined;

  // Check for expressions like "20 cement bags aaye 420 ke"
  // "20 ... 420 ke" -> quantity: 20, rate: 420, amount = 20 * 420
  const rateMatch = norm.match(/(\d+)\s*(?:bags?|pcs?|bora|boree|pipes?|pieces?|ton|kg|meters?|feet|ft|rft|sq\s*ft|cu\s*ft|cft)?\s*(?:aaye|aaya|liya|liye)?\s*(\d+)\s*(?:ke|ka|rate|rupaye|rs|inr)/i);
  if (rateMatch) {
    quantity = parseInt(rateMatch[1], 10);
    rate = parseInt(rateMatch[2], 10);
    amount = quantity * rate;
    return { amount, quantity, rate };
  }

  // Check for quantity with usage: "10 cpvc pipe use ho gaye" or "20 cement bags" or "50 feet wire use ho gaya"
  const qtyMatch = norm.match(/(\d+)\s*(?:bags?|pcs?|bora|pipes?|pieces?|ton|kg|meters?|feet|ft|rft|sq\s*ft|cu\s*ft|cft)?\s*(?:use|khatam|lag\s*gaye|lagaya|khapat)/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
  }

  // Check general quantities if not usage
  if (quantity === undefined) {
    const generalQty = norm.match(/(\d+)\s*(bags?|pcs|bora|pipes?|pieces?|ton|kg|meters?|feet|ft|rft|sq\s*ft|cu\s*ft|cft)/i);
    if (generalQty) {
      quantity = parseInt(generalQty[1], 10);
    }
  }

  // Find rupee amounts: "₹15000", "15000 ka", "15000 rupaye", "5000 de diye", "15k"
  const amountMatches = [
    norm.match(/(?:rs\.?|inr|₹)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i),
    norm.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rupaye|rupees|rs|inr|ka|ke|diye|de\s*diye|jama)/i),
    norm.match(/(\d+)k\b/i),
    norm.match(/(?:de\s*diye|payment|amount|paid|kharcha|bheje)\s*(\d+)/i)
  ];

  for (const m of amountMatches) {
    if (m && m[1]) {
      const valStr = m[1].replace(/,/g, '');
      const val = parseInt(valStr, 10);
      if (m[0].includes('k')) {
        amount = val * 1000;
      } else {
        amount = val;
      }
      break;
    }
  }

  // If no amount found through keywords, check standalone 3+ digit numbers that aren't the quantity
  if (amount === undefined) {
    const allNums = norm.match(/\b\d+\b/g);
    if (allNums) {
      for (const n of allNums) {
        const numVal = parseInt(n, 10);
        if (numVal !== quantity && numVal > 0) {
          amount = numVal;
          break;
        }
      }
    }
  }

  return { amount, quantity, rate };
}

// Payment Mode detection
function extractPaymentMode(text: string): PaymentMode {
  const norm = text.toLowerCase();
  if (norm.includes('upi') || norm.includes('gpay') || norm.includes('phonepe') || norm.includes('paytm')) return 'upi';
  if (norm.includes('bank') || norm.includes('neft') || norm.includes('rtgs') || norm.includes('transfer')) return 'bank';
  if (norm.includes('cheque') || norm.includes('check')) return 'cheque';
  return 'cash'; // Default in Indian construction sites
}

/**
 * PARSE NATURAL LANGUAGE INTO STRUCTURED TRANSACTION
 * Strict rules:
 * - NEVER invent amounts, quantities, suppliers, materials.
 * - Always use current site.
 * - Match against existing accounts & materials of current site.
 */
export async function parseNaturalLanguageInput(
  rawText: string,
  siteId: string
): Promise<ParsedAiIntent> {
  const trimmed = rawText.trim();
  const norm = normalize(trimmed);
  const today = new Date().toISOString().split('T')[0];

  const result: ParsedAiIntent = {
    rawText: trimmed,
    type: 'unknown',
    siteId,
    data: {
      date: today,
      notes: `AI Entry: "${trimmed}"`
    },
    missingFields: [],
    isComplete: false
  };

  if (!trimmed) {
    result.missingFields.push('input');
    return result;
  }

  // Fetch current site accounts and materials
  const accounts = await db.accounts.where({ siteId, status: 'active' }).toArray();
  const materials = await db.materials.where({ siteId, status: 'active' }).toArray();

  const { amount, quantity, rate } = extractNumbers(trimmed);
  const paymentMode = extractPaymentMode(trimmed);
  result.data.paymentMode = paymentMode;

  // 1. Detect Intent: Labour Work
  // e.g. "Rakesh ka 8000 ka kaam add karo", "Rakesh ka kaam 8000"
  if (
    norm.includes('kaam add') ||
    norm.includes('work add') ||
    norm.includes('ka kaam') ||
    norm.includes('hazaari') ||
    norm.includes('theka')
  ) {
    result.type = 'labour_work';
    result.data.amount = amount;

    // Find labour account
    const matchedLabour = accounts.filter(
      a => a.type === 'labour' && norm.includes(normalize(a.name))
    );

    if (matchedLabour.length === 1) {
      result.data.accountId = matchedLabour[0].id;
      result.data.accountName = matchedLabour[0].name;
      result.data.accountType = 'labour';
    } else if (matchedLabour.length > 1) {
      result.clarificationRequired = `Multiple labour accounts match. Which one?`;
      result.clarificationOptions = matchedLabour.map(l => ({
        id: l.id,
        label: l.name,
        subtext: l.phone || 'Labour'
      }));
    } else {
      // Extract potential name before "ka"
      const nameMatch = norm.match(/^([a-z\s]+?)\s+(?:ka|ne)\s+/i);
      if (nameMatch) {
        result.data.accountName = nameMatch[1].trim();
      }
    }

    if (!result.data.accountId && !result.data.accountName) result.missingFields.push('labour');
    if (!result.data.amount) result.missingFields.push('amount');

    result.isComplete = result.missingFields.length === 0 && !result.clarificationRequired;
    return result;
  }

  // 2. Detect Intent: Material Usage
  // e.g. "20 CPVC pipe use ho gaye", "10 cement bag lag gaye", "5 bags used"
  if (
    norm.includes('use ho gaye') ||
    norm.includes('used') ||
    norm.includes('use hue') ||
    norm.includes('lag gaye') ||
    norm.includes('lagaye') ||
    norm.includes('khapat')
  ) {
    result.type = 'material_usage';
    result.data.quantity = quantity;

    // Match material
    const matchedMaterials = materials.filter(m => norm.includes(normalize(m.name)));
    if (matchedMaterials.length === 1) {
      result.data.materialId = matchedMaterials[0].id;
      result.data.materialName = matchedMaterials[0].name;
      result.data.unit = matchedMaterials[0].unit;
    } else if (matchedMaterials.length > 1) {
      result.clarificationRequired = 'Which material did you use?';
      result.clarificationOptions = matchedMaterials.map(m => ({
        id: m.id,
        label: m.name,
        subtext: `${m.category} (${m.unit})`
      }));
    } else {
      // Try to match category
      const words = norm.split(' ');
      for (const m of materials) {
        if (words.some(w => w.length > 3 && normalize(m.name).includes(w))) {
          result.data.materialId = m.id;
          result.data.materialName = m.name;
          result.data.unit = m.unit;
          break;
        }
      }
    }

    if (!result.data.materialId && !result.data.materialName) result.missingFields.push('material');
    if (!result.data.quantity) result.missingFields.push('quantity');

    result.isComplete = result.missingFields.length === 0 && !result.clarificationRequired;
    return result;
  }

  // 3. Detect Intent: Material Return
  // e.g. "10 CPVC pipes returned", "5 bags cement wapas kiye"
  if (
    norm.includes('wapas') ||
    norm.includes('return') ||
    norm.includes('retun') ||
    norm.includes('back')
  ) {
    result.type = 'material_return';
    result.data.quantity = quantity;

    const matchedMaterials = materials.filter(m => norm.includes(normalize(m.name)));
    if (matchedMaterials.length >= 1) {
      result.data.materialId = matchedMaterials[0].id;
      result.data.materialName = matchedMaterials[0].name;
      result.data.unit = matchedMaterials[0].unit;
    }

    if (!result.data.materialId && !result.data.materialName) result.missingFields.push('material');
    if (!result.data.quantity) result.missingFields.push('quantity');

    result.isComplete = result.missingFields.length === 0 && !result.clarificationRequired;
    return result;
  }

  // 4. Detect Intent: Payment
  // e.g. "Rakesh plumber ko 5000 de diye", "Sharma ko 10000 diye", "5000 payment to electrician"
  if (
    norm.includes('de diye') ||
    norm.includes('diye') ||
    norm.includes('diya') ||
    norm.includes('payment') ||
    norm.includes('paid') ||
    norm.includes('bheje') ||
    norm.includes('transfer kiye')
  ) {
    result.type = 'payment';
    result.data.amount = amount;

    // Check matching accounts (supplier or labour or other)
    const matchingAccounts = accounts.filter(a => norm.includes(normalize(a.name)));

    if (matchingAccounts.length === 1) {
      result.data.accountId = matchingAccounts[0].id;
      result.data.accountName = matchingAccounts[0].name;
      result.data.accountType = matchingAccounts[0].type;
    } else if (matchingAccounts.length > 1) {
      // Test 7 Acceptance rule: If multiple accounts match, ask for clarification!
      result.clarificationRequired = `Multiple accounts match. Please select the intended recipient:`;
      result.clarificationOptions = matchingAccounts.map(a => ({
        id: a.id,
        label: a.name,
        subtext: `${a.type.toUpperCase()} • ${a.phone || 'No phone'}`
      }));
    } else {
      // Try to extract name before "ko"
      const nameMatch = norm.match(/^([a-z\s]+?)\s+ko\s+/i);
      if (nameMatch) {
        result.data.accountName = nameMatch[1].trim();
      }
    }

    if (!result.data.accountId && !result.data.accountName) result.missingFields.push('account');
    if (!result.data.amount) result.missingFields.push('amount');

    result.isComplete = result.missingFields.length === 0 && !result.clarificationRequired;
    return result;
  }

  // 5. Detect Intent: Direct Site Expense
  // e.g. "Diesel ka 1200 kharcha hua", "Generator rent 2500 diya", "Site expense 500"
  const expenseKeywords = [
    'diesel',
    'petrol',
    'transport',
    'machinery',
    'generator',
    'electricity',
    'bijli',
    'paani',
    'water',
    'kharcha',
    'food',
    'chai',
    'nasta',
    'rent',
    'tempo',
    'truck'
  ];

  if (expenseKeywords.some(k => norm.includes(k)) && !norm.includes('samaan')) {
    result.type = 'expense';
    result.data.amount = amount;

    if (norm.includes('diesel') || norm.includes('petrol')) result.data.category = 'Diesel';
    else if (norm.includes('transport') || norm.includes('tempo') || norm.includes('truck')) result.data.category = 'Transport';
    else if (norm.includes('machinery') || norm.includes('generator')) result.data.category = 'Machinery';
    else if (norm.includes('electricity') || norm.includes('bijli')) result.data.category = 'Electricity';
    else if (norm.includes('water') || norm.includes('paani')) result.data.category = 'Water';
    else if (norm.includes('food') || norm.includes('chai') || norm.includes('nasta')) result.data.category = 'Food';
    else if (norm.includes('rent')) result.data.category = 'Rent';
    else result.data.category = 'Site Expense';

    if (!result.data.amount) result.missingFields.push('amount');
    result.isComplete = result.missingFields.length === 0;
    return result;
  }

  // 6. Detect Intent: Purchase
  // e.g. "Sharma Hardware se plumbing ka samaan 15000 ka aaya"
  // "20 cement bags aaye 420 ke"
  // "Sharma se samaan aaya" (Test 8 missing material, quantity, rate)
  if (
    norm.includes('aaya') ||
    norm.includes('aaye') ||
    norm.includes('samaan') ||
    norm.includes('purchase') ||
    norm.includes('kharida') ||
    norm.includes('delivered')
  ) {
    result.type = 'purchase';
    result.data.amount = amount;
    result.data.quantity = quantity;
    result.data.rate = rate;

    // Check for supplier match
    const matchingSuppliers = accounts.filter(
      a => a.type === 'supplier' && norm.includes(normalize(a.name))
    );

    if (matchingSuppliers.length === 1) {
      result.data.accountId = matchingSuppliers[0].id;
      result.data.accountName = matchingSuppliers[0].name;
      result.data.accountType = 'supplier';
    } else if (matchingSuppliers.length > 1) {
      result.clarificationRequired = 'Which supplier delivered this?';
      result.clarificationOptions = matchingSuppliers.map(s => ({
        id: s.id,
        label: s.name,
        subtext: s.phone || 'Supplier'
      }));
    } else {
      // Check if text says "Sharma se"
      const suppMatch = norm.match(/^([a-z\s]+?)\s+se\s+/i);
      if (suppMatch) {
        const candidate = suppMatch[1].trim();
        // check partial match
        const partial = accounts.find(
          a => a.type === 'supplier' && normalize(a.name).includes(candidate)
        );
        if (partial) {
          result.data.accountId = partial.id;
          result.data.accountName = partial.name;
          result.data.accountType = 'supplier';
        } else {
          result.data.accountName = candidate;
        }
      }
    }

    // Check for material match
    const matchingMaterials = materials.filter(m => norm.includes(normalize(m.name)));
    if (matchingMaterials.length >= 1) {
      result.data.materialId = matchingMaterials[0].id;
      result.data.materialName = matchingMaterials[0].name;
      result.data.category = matchingMaterials[0].category;
      result.data.unit = matchingMaterials[0].unit;
    } else {
      // Check category mention (e.g. "plumbing ka samaan")
      const catMatches = ['plumbing', 'sanitary', 'cement', 'steel', 'brick', 'sand', 'bajri', 'tiles', 'electrical'];
      for (const cat of catMatches) {
        if (norm.includes(cat)) {
          result.data.category = cat.charAt(0).toUpperCase() + cat.slice(1);
          result.data.materialName = `${result.data.category} Material`;
          break;
        }
      }
    }

    // Strict Acceptance Rule (Test 8):
    // AI must NEVER invent Material, Quantity, Rate, Amount or Supplier!
    if (!result.data.accountId && !result.data.accountName) result.missingFields.push('supplier');
    if (!result.data.materialId && !result.data.materialName) result.missingFields.push('material');
    if (!result.data.amount && (!result.data.quantity || !result.data.rate)) {
      if (!result.data.quantity) result.missingFields.push('quantity');
      if (!result.data.rate) result.missingFields.push('rate');
      if (!result.data.amount) result.missingFields.push('amount');
    }

    result.isComplete = result.missingFields.length === 0 && !result.clarificationRequired;
    return result;
  }

  // Fallback: If we couldn't determine the type
  result.type = 'unknown';
  result.missingFields.push('intent');
  return result;
}
