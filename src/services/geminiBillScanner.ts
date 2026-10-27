// Google Gemini AI Bill & Challan Scanner Service

export interface ScannedBillItem {
  materialName: string;
  category: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface ScannedBillResult {
  supplierName?: string;
  supplierPhone?: string;
  invoiceNo?: string;
  date?: string;
  items: ScannedBillItem[];
  totalAmount?: number;
  paidAmount?: number;
  paymentMode?: 'cash' | 'upi' | 'bank' | 'cheque';
  notes?: string;
  rawResponse?: string;
}

const STORAGE_KEY_GEMINI = 'construction_khata_gemini_api_key';

export function getSavedGeminiKey(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_GEMINI);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

export function saveGeminiKey(key: string) {
  try {
    if (!key.trim()) {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    } else {
      localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
    }
  } catch (e) {}
}

/**
 * Client-side high efficiency image compressor
 * Shrinks 10MB mobile camera photos down to ~150KB for sub-second AI upload
 */
export async function compressImageForAI(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image preview'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = String(reader.result);
          const parts = raw.split(',');
          resolve({
            base64Data: parts[1] || '',
            mimeType: file.type || 'image/jpeg',
            previewUrl: raw
          });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1] || '';
        resolve({
          base64Data,
          mimeType: 'image/jpeg',
          previewUrl: dataUrl
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Call Gemini 1.5 Flash Vision to extract Indian construction bills and challans
 */
export async function scanBillWithGemini(
  base64Data: string,
  mimeType = 'image/jpeg',
  customKey?: string
): Promise<ScannedBillResult> {
  const apiKey = (customKey || getSavedGeminiKey()).trim();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const prompt = `You are an expert OCR & accounting AI for Indian construction sites, builders, and contractors.
Analyze this image of a material purchase bill, challan, invoice, cash slip, or hand-written receipt (in English, Hindi, or Hinglish).

Extract the following information with maximum accuracy:
1. "supplierName": Name of the shop / firm / trader (e.g. "Goyal Hardware & Sanitary", "Shree Ram Cement Store", "Aggarwal Traders").
2. "supplierPhone": Phone or mobile number if printed or written.
3. "invoiceNo": Bill or Challan or Memo number (if any, e.g. "INV-1042", "452", "CH-88").
4. "date": Date in YYYY-MM-DD format (if only DD/MM/YY or DD-MM-YYYY is written, convert to YYYY-MM-DD. If missing, use today's date).
5. "items": List of construction materials purchased. For each item:
   - "materialName": Name of material (e.g. "Ultratech Cement PPC", "TMT Bar 12mm", "110mm SWR Pipe", "Red Bricks", "River Sand", "Wall Putty").
   - "category": Match closest from: ["Cement", "Steel", "Brick", "Sand", "Bajri", "Plumbing", "Sanitary", "Electrical", "Tiles", "Hardware", "Paint", "Wood", "Other"].
   - "quantity": Number of units (e.g. 50, 1000, 2.5).
   - "unit": Standard unit: ["bags", "pcs", "ton", "kg", "cft", "sq ft", "feet", "meter", "bundle", "liter", "truck", "trolley"].
   - "rate": Price per unit (in Indian Rupees ₹).
   - "amount": Total cost for this item (quantity * rate, or extracted line total).
6. "totalAmount": Grand total amount of the invoice/bill (in Rupees ₹).
7. "paidAmount": Any advance or cash payment mentioned as paid (e.g. "Jama 10,000", "Paid 5000", or 0 if unpaid).
8. "paymentMode": "cash" or "upi" or "bank" or "cheque" (default "cash" if paid).
9. "notes": Any site name, vehicle number, or special notes mentioned.

Return strictly a valid JSON object matching this schema without any markdown formatting or commentary:
{
  "supplierName": string,
  "supplierPhone": string,
  "invoiceNo": string,
  "date": string,
  "items": [
    {
      "materialName": string,
      "category": string,
      "quantity": number,
      "unit": string,
      "rate": number,
      "amount": number
    }
  ],
  "totalAmount": number,
  "paidAmount": number,
  "paymentMode": string,
  "notes": string
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.1
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorJson: any = null;
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {}

    const code = errorJson?.error?.code || response.status;
    const message = errorJson?.error?.message || response.statusText;

    if (code === 400 && message?.includes('API_KEY_INVALID')) {
      throw new Error('INVALID_API_KEY: The provided Google Gemini API Key is invalid.');
    }
    if (code === 403 || message?.includes('blocked') || message?.includes('PERMISSION_DENIED')) {
      throw new Error('PERMISSION_DENIED: Gemini API is blocked or key lacks Generative Language permission.');
    }
    if (code === 429 || message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('RATE_LIMIT: Quota exceeded. Please try again in 1 minute.');
    }
    throw new Error(`Gemini Scan Error (${code}): ${message}`);
  }

  const jsonResult = await response.json();
  const rawText = jsonResult?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI could not extract text from this image. Please ensure the bill is well-lit and clear.');
  }

  // Parse JSON from response
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', rawText);
    throw new Error('Failed to parse AI bill data. Please take a clearer photo.');
  }

  // Sanitize and validate extracted items
  const items: ScannedBillItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((it: any) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate) || 0;
        const amount = Number(it.amount) || qty * rate;
        return {
          materialName: String(it.materialName || 'Material Item').trim(),
          category: String(it.category || 'Other').trim(),
          quantity: qty,
          unit: String(it.unit || 'pcs').trim(),
          rate: rate,
          amount: amount
        };
      })
    : [];

  return {
    supplierName: parsed.supplierName ? String(parsed.supplierName).trim() : undefined,
    supplierPhone: parsed.supplierPhone ? String(parsed.supplierPhone).trim() : undefined,
    invoiceNo: parsed.invoiceNo ? String(parsed.invoiceNo).trim() : undefined,
    date: parsed.date ? String(parsed.date).trim() : new Date().toISOString().split('T')[0],
    items,
    totalAmount: Number(parsed.totalAmount) || items.reduce((s, i) => s + (i.amount || 0), 0),
    paidAmount: Number(parsed.paidAmount) || 0,
    paymentMode: ['cash', 'upi', 'bank', 'cheque'].includes(parsed.paymentMode?.toLowerCase())
      ? (parsed.paymentMode.toLowerCase() as any)
      : 'cash',
    notes: parsed.notes ? String(parsed.notes).trim() : undefined,
    rawResponse: cleaned
  };
}
