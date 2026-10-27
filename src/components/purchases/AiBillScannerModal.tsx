import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Receipt,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  compressImageForAI,
  scanBillWithGemini,
  getSavedGeminiKey,
  saveGeminiKey,
  type ScannedBillResult
} from '../../services/geminiBillScanner';
import { formatCurrency } from '../../utils/formatters';

interface AiBillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBillData: (scannedData: ScannedBillResult) => void;
}

export const AiBillScannerModal: React.FC<AiBillScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyBillData
}) => {
  const [apiKey, setApiKey] = useState(() => getSavedGeminiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');
  const [keySavedToast, setKeySavedToast] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');

  const [isScanning, setIsScanning] = useState(false);
  const [scanStepMessage, setScanStepMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedBillResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedGeminiKey();
      setApiKey(current);
      setTempKeyInput(current);
      if (!current) {
        setShowKeyConfig(true);
      }
    } else {
      // Reset state on close
      setPreviewUrl(null);
      setBase64Data(null);
      setScannedResult(null);
      setError(null);
      setIsScanning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    const trimmed = tempKeyInput.trim();
    saveGeminiKey(trimmed);
    setApiKey(trimmed);
    setShowKeyConfig(false);
    setError(null);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 3000);
  };

  const handleFileSelected = async (file: File) => {
    setError(null);
    setScannedResult(null);
    setIsScanning(true);
    setScanStepMessage('Compressing photo for fast scanning...');

    try {
      const compressed = await compressImageForAI(file);
      setPreviewUrl(compressed.previewUrl);
      setBase64Data(compressed.base64Data);
      setMimeType(compressed.mimeType);

      // Check API Key
      const keyToUse = apiKey || getSavedGeminiKey();
      if (!keyToUse) {
        setIsScanning(false);
        setShowKeyConfig(true);
        setError('Please enter your free Google Gemini API Key below to start scanning bills.');
        return;
      }

      await executeScan(compressed.base64Data, compressed.mimeType, keyToUse);
    } catch (err: any) {
      console.error(err);
      setIsScanning(false);
      setError(err?.message || 'Failed to process image file');
    }
  };

  const executeScan = async (base64: string, mime: string, key: string) => {
    setIsScanning(true);
    setScanStepMessage('Gemini AI is reading shop name, items, and amounts...');

    try {
      const result = await scanBillWithGemini(base64, mime, key);
      setScannedResult(result);
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'MISSING_API_KEY') {
        setShowKeyConfig(true);
        setError('Gemini API Key is required. Get one free from Google AI Studio.');
      } else if (err?.message?.includes('INVALID_API_KEY') || err?.message?.includes('PERMISSION_DENIED')) {
        setShowKeyConfig(true);
        setError('Invalid or restricted API Key. Please verify your Google Gemini API key.');
      } else {
        setError(err?.message || 'AI scanning failed. Please take a clearer photo.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = () => {
    if (scannedResult) {
      onApplyBillData(scannedResult);
      onClose();
    }
  };

  // Demo Sample Bill for instant testing
  const handleLoadSampleDemoBill = () => {
    const demoResult: ScannedBillResult = {
      supplierName: 'Goyal Hardware & Building Material',
      supplierPhone: '98123-45678',
      invoiceNo: 'BILL-4091',
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          materialName: 'Ultratech Cement PPC',
          category: 'Cement',
          quantity: 50,
          unit: 'bags',
          rate: 385,
          amount: 19250
        },
        {
          materialName: 'TMT Steel Bar 12mm (Fe550)',
          category: 'Steel',
          quantity: 2,
          unit: 'ton',
          rate: 61500,
          amount: 123000
        },
        {
          materialName: 'River Sand (Chambal)',
          category: 'Sand',
          quantity: 400,
          unit: 'cft',
          rate: 52,
          amount: 20800
        }
      ],
      totalAmount: 163050,
      paidAmount: 25000,
      paymentMode: 'cash',
      notes: 'Delivered at Site Sector 35. Vehicle No. HR-02-B-9981'
    };

    setPreviewUrl(null);
    setScannedResult(demoResult);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">AI Bill & Challan Scanner</h3>
                <span className="text-[10px] bg-purple-950/80 border border-purple-700/60 text-purple-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-charcoal-400">पर्चे की फ़ोटो खींचें — AI खुद बिल और सामान भर देगा</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                apiKey
                  ? 'bg-charcoal-800 border-charcoal-700 text-charcoal-300 hover:text-white'
                  : 'bg-amber-950/70 border-amber-800 text-amber-300 hover:bg-amber-900/60 animate-pulse'
              }`}
              title="Configure Google Gemini API Key"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">{apiKey ? 'API Key' : 'Add Free Key'}</span>
            </button>

            <button onClick={onClose} className="p-1.5 text-charcoal-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {keySavedToast && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Gemini API Key saved successfully! Ready to scan.</span>
            </div>
          )}

          {/* Gemini API Key Config Drawer */}
          {showKeyConfig && (
            <div className="bg-charcoal-950/90 border border-purple-800/60 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Google Gemini API Key (100% Free / मुफ़्त)</span>
                  </div>
                  <p className="text-[11px] text-charcoal-400">
                    Google AI Studio रोज़ाना 1,500 बिल स्कैनिंग बिल्कुल मुफ़्त देता है (क्रेडिट कार्ड की ज़रूरत नहीं)।
                  </p>
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shrink-0"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste your Gemini API key (AIzaSy...)"
                  value={tempKeyInput}
                  onChange={(e) => setTempKeyInput(e.target.value)}
                  className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2 text-xs text-white placeholder-charcoal-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-950/70 border border-red-800 text-red-300 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Hidden Inputs for Camera and File Picker */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
              e.target.value = '';
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
              e.target.value = '';
            }}
          />

          {/* Upload / Capture Trigger Screen (when not showing result) */}
          {!scannedResult && !isScanning && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Mobile / Laptop Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-6 bg-charcoal-950/70 hover:bg-charcoal-800/80 border-2 border-dashed border-purple-500/50 hover:border-purple-400 rounded-2xl flex flex-col items-center justify-center text-center transition group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-105 transition">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-black text-white">कैमरे से फ़ोटो लें</span>
                  <span className="text-xs text-charcoal-400 mt-1">Take Photo from Camera</span>
                  <span className="text-[10px] text-purple-400 mt-2 font-bold bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
                    Mobile & Tablet Recommended
                  </span>
                </button>

                {/* Upload File / Gallery Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 bg-charcoal-950/70 hover:bg-charcoal-800/80 border-2 border-dashed border-charcoal-700 hover:border-construction-400 rounded-2xl flex flex-col items-center justify-center text-center transition group active:scale-[0.98]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-charcoal-800 text-construction-400 border border-charcoal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                    <Upload className="w-7 h-7" />
                  </div>
                  <span className="text-sm font-black text-white">गैलरी / फ़ाइल अपलोड करें</span>
                  <span className="text-xs text-charcoal-400 mt-1">Upload Receipt / Challan Image</span>
                  <span className="text-[10px] text-charcoal-400 mt-2 font-bold bg-charcoal-800 px-2 py-0.5 rounded-full border border-charcoal-700">
                    JPEG, PNG, WebP
                  </span>
                </button>
              </div>

              {/* Instant Demo Bill Testing Button */}
              <div className="bg-charcoal-950/50 border border-charcoal-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-charcoal-800 text-construction-400 rounded-lg">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">अभी हाथ में कोई पर्चा नहीं है?</div>
                    <div className="text-[11px] text-charcoal-400">डेमो हार्डवेयर बिल लोड करके तुरंत चेक करें कि यह कैसे काम करता है।</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadSampleDemoBill}
                  className="bg-charcoal-800 hover:bg-charcoal-700 text-construction-400 border border-charcoal-700 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shrink-0"
                >
                  Try Demo Bill
                </button>
              </div>

              {/* Scanning Best Practice Tips */}
              <div className="bg-charcoal-950/40 rounded-xl p-3.5 border border-charcoal-800/80 space-y-1.5 text-xs text-charcoal-400">
                <div className="font-bold text-charcoal-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>अच्छे रिज़ल्ट के लिए टिप्स:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-charcoal-400">
                  <li>बिल को समतल जगह पर रखकर अच्छी रोशनी में साफ़ फ़ोटो लें।</li>
                  <li>दुकान का नाम, सामान की मात्रा (Qty), और रेट साफ़ नज़र आने चाहिए।</li>
                  <li>हाथ से लिखा कच्चा पर्चा या प्रिंटेड चालान दोनों सपोर्टेड हैं।</li>
                </ul>
              </div>
            </div>
          )}

          {/* Scanning Progress Animation */}
          {isScanning && (
            <div className="py-8 space-y-4 flex flex-col items-center justify-center text-center">
              {previewUrl && (
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-2xl">
                  <img src={previewUrl} alt="Bill Preview" className="w-full h-full object-cover filter brightness-75" />
                  {/* Glowing Laser Scan Bar */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent shadow-[0_0_15px_rgba(168,85,247,1)] animate-bounce" />
                </div>
              )}

              <div className="flex items-center gap-2 text-purple-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm font-black text-white">{scanStepMessage || 'Scanning Bill with Gemini Vision AI...'}</span>
              </div>
              <p className="text-xs text-charcoal-400 max-w-sm">
                AI पर्चे में से सप्लायर का नाम, तारीख, सभी सामान, रेट और कुल रकम निकाल रहा है...
              </p>
            </div>
          )}

          {/* Scanned Results Display */}
          {scannedResult && !isScanning && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Top Summary Banner */}
              <div className="bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-700/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">
                      AI Extracted Supplier
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {scannedResult.supplierName || 'Unknown Supplier (दुकानदार)'}
                    </h4>
                    {scannedResult.supplierPhone && (
                      <span className="text-xs text-charcoal-400">Phone: {scannedResult.supplierPhone}</span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-charcoal-400 uppercase font-bold">Total Bill Amount</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">
                    {formatCurrency(scannedResult.totalAmount || 0)}
                  </div>
                  <div className="text-[11px] text-charcoal-400">
                    Inv: {scannedResult.invoiceNo || 'N/A'} • {scannedResult.date}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-charcoal-950 border border-charcoal-800 rounded-2xl overflow-hidden">
                <div className="p-3 bg-charcoal-900 border-b border-charcoal-800 flex items-center justify-between">
                  <span className="text-xs font-black text-white">
                    Extracted Items ({scannedResult.items.length})
                  </span>
                  <span className="text-[10px] text-charcoal-400">मटीरियल और दर</span>
                </div>

                {scannedResult.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-charcoal-400">
                    No items could be distinguished. You can still auto-fill the supplier and amount.
                  </div>
                ) : (
                  <div className="divide-y divide-charcoal-800/80">
                    {scannedResult.items.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate">{item.materialName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-charcoal-400 mt-0.5">
                            <span className="bg-charcoal-800 px-1.5 py-0.5 rounded text-construction-400 font-semibold text-[10px]">
                              {item.category}
                            </span>
                            <span>
                              Qty: <strong className="text-white">{item.quantity} {item.unit}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Rate: <strong className="text-white">₹{item.rate}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-white text-sm">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Extra Details */}
              {(scannedResult.paidAmount || scannedResult.notes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {scannedResult.paidAmount ? (
                    <div className="p-3 bg-charcoal-950 rounded-xl border border-charcoal-800">
                      <span className="text-charcoal-400 block text-[10px]">Paid Amount / Advance:</span>
                      <strong className="text-emerald-400 font-bold text-sm">
                        {formatCurrency(scannedResult.paidAmount)}
                      </strong>{' '}
                      <span className="uppercase text-[10px] text-charcoal-400">({scannedResult.paymentMode || 'cash'})</span>
                    </div>
                  ) : null}

                  {scannedResult.notes ? (
                    <div className="p-3 bg-charcoal-950 rounded-xl border border-charcoal-800">
                      <span className="text-charcoal-400 block text-[10px]">Notes:</span>
                      <span className="text-charcoal-300 text-[11px]">{scannedResult.notes}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    setPreviewUrl(null);
                    setError(null);
                  }}
                  className="bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 font-bold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan Another Bill (दूसरा बिल स्कैन करें)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black px-5 py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 transition active:scale-95"
                >
                  <span>✓ Auto-Fill into Purchase Bill (बिल में भरें)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
