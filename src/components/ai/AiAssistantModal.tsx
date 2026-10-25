import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Clock,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { parseNaturalLanguageInput, type ParsedAiIntent } from '../../engine/aiParser';
import {
  createPurchase,
  createPayment,
  createSiteExpense,
  createLabourWork,
  recordMaterialUsage,
  recordMaterialReturn
} from '../../engine/accounting';
import { db } from '../../db';
import { formatCurrency } from '../../utils/formatters';
import type { PendingAiTransaction, Account, Material } from '../../types';

export const AiAssistantModal: React.FC = () => {
  const {
    currentSite,
    currentSiteId,
    isAiModalOpen,
    setAiModalOpen,
    aiInitialPrompt,
    showToast,
    triggerRefresh
  } = useAppStore();

  const [inputText, setInputText] = useState(aiInitialPrompt || '');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speechLang, setSpeechLang] = useState<'hi-IN' | 'en-IN' | 'en-US'>('hi-IN');

  // Parsed intent & confirmation state
  const [parsedIntent, setParsedIntent] = useState<ParsedAiIntent | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState<PendingAiTransaction[]>([]);
  const [showDraftsList, setShowDraftsList] = useState(false);

  // References
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (isAiModalOpen && currentSiteId) {
      loadPendingDrafts();
      if (aiInitialPrompt) {
        handleParse(aiInitialPrompt);
      }
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [isAiModalOpen, currentSiteId, aiInitialPrompt]);

  const loadPendingDrafts = async () => {
    if (!currentSiteId) return;
    const drafts = await db.pendingAiTransactions
      .where({ siteId: currentSiteId, status: 'pending_review' })
      .reverse()
      .toArray();
    setPendingDrafts(drafts);
  };

  // Setup Web Speech API for Hindi / Hinglish / English
  const startVoiceInput = async () => {
    setRecognitionError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecognitionError(
        'Browser speech API not supported. On Windows, press Win + H to dictate directly into the text box.'
      );
      return;
    }

    // Pre-check microphone permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (micErr: any) {
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
          setRecognitionError(
            'Microphone access blocked. Click the lock 🔒 or camera/mic icon in the browser address bar to allow Microphone.'
          );
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const currentSaid = finalTranscript || interimTranscript;
        if (currentSaid) {
          setInputText(currentSaid);

          // Reset silence timer: auto-stop and process 2.2s after user pauses speaking
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            stopVoiceInput();
          }, 2200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (event.error === 'not-allowed') {
          setRecognitionError(
            'Microphone permission was denied. Please allow microphone access in your browser address bar.'
          );
        } else if (event.error === 'network') {
          if (speechLang === 'hi-IN') {
            setSpeechLang('en-IN');
            setRecognitionError(
              'Hindi voice server connection timeout. Switched language to Hinglish/English. Tap mic again, or press Win + H on Windows.'
            );
          } else {
            setRecognitionError(
              'Voice network timeout: Google speech server unreachable. On Windows, press Win + H to speak offline directly!'
            );
          }
          setTimeout(() => textareaRef.current?.focus(), 100);
        } else if (event.error === 'no-speech') {
          setRecognitionError('No speech detected. Please speak clearly into your microphone.');
        } else if (event.error === 'audio-capture') {
          setRecognitionError('No microphone was detected. Please plug in or enable a microphone.');
        } else {
          setRecognitionError('Voice input stopped. You can type directly below or press Win + H on Windows.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      setRecognitionError(err.message || 'Microphone initialization failed.');
    }
  };

  const stopVoiceInput = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }
    // Auto-parse if text is present
    setTimeout(() => {
      setInputText(prev => {
        if (prev.trim()) {
          handleParse(prev);
        }
        return prev;
      });
    }, 150);
  };

  const handleParse = async (textToParse?: string) => {
    const text = textToParse || inputText;
    if (!text.trim() || !currentSiteId) return;

    setIsProcessing(true);
    setRecognitionError(null);

    try {
      const intent = await parseNaturalLanguageInput(text, currentSiteId);
      setParsedIntent(intent);

      // If incomplete or ambiguous, save to Pending AI Transactions table
      if (!intent.isComplete) {
        const draft: PendingAiTransaction = {
          id: 'ai_draft_' + Date.now(),
          siteId: currentSiteId,
          rawText: intent.rawText,
          parsedType: intent.type,
          structuredData: intent.data,
          missingFields: intent.missingFields,
          clarificationRequired: intent.clarificationRequired,
          clarificationOptions: intent.clarificationOptions,
          status: 'pending_review',
          createdAt: Date.now()
        };
        await db.pendingAiTransactions.put(draft);
        await loadPendingDrafts();
      }
    } catch (err: any) {
      console.error('AI parse error:', err);
      setRecognitionError(err.message || 'Failed to interpret transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // User selects an option for disambiguation (e.g., which Rakesh)
  const handleClarificationSelect = (option: { id: string; label: string }) => {
    if (!parsedIntent) return;
    const updated = { ...parsedIntent };

    if (updated.type === 'payment' || updated.type === 'labour_work') {
      updated.data.accountId = option.id;
      updated.data.accountName = option.label;
    } else if (updated.type === 'purchase') {
      updated.data.accountId = option.id;
      updated.data.accountName = option.label;
    } else if (updated.type === 'material_usage') {
      updated.data.materialId = option.id;
      updated.data.materialName = option.label;
    }

    updated.clarificationRequired = undefined;
    updated.clarificationOptions = undefined;
    updated.missingFields = updated.missingFields.filter(f => f !== 'account' && f !== 'material' && f !== 'supplier');
    updated.isComplete = updated.missingFields.length === 0;

    setParsedIntent(updated);
  };

  // Commit transaction via Business Logic Engine
  const handleConfirmAndSave = async () => {
    if (!parsedIntent || !currentSiteId) return;
    setIsProcessing(true);

    try {
      const { type, data } = parsedIntent;
      const today = new Date().toISOString().split('T')[0];

      switch (type) {
        case 'purchase': {
          // Verify or create supplier
          let supplierId = data.accountId;
          if (!supplierId) {
            // Find or create supplier
            const supp = await db.accounts.add({
              id: 'acc_supp_' + Date.now(),
              siteId: currentSiteId,
              type: 'supplier',
              name: data.accountName || 'Unnamed Supplier',
              openingBalance: 0,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            supplierId = supp;
          }

          // Verify or create material
          let materialId = data.materialId;
          if (!materialId) {
            const mat = await db.materials.add({
              id: 'mat_' + Date.now(),
              siteId: currentSiteId,
              category: data.category || 'Other',
              name: data.materialName || 'Material Item',
              unit: data.unit || 'pcs',
              minimumStock: 10,
              defaultRate: data.rate || 0,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            materialId = mat;
          }

          const qty = data.quantity || 1;
          const rate = data.rate || (data.amount ? data.amount / qty : 0);

          await createPurchase({
            siteId: currentSiteId,
            supplierId,
            date: data.date || today,
            items: [
              {
                materialId,
                quantity: qty,
                rate
              }
            ],
            paidAmount: data.paidAmount || 0,
            paymentMode: data.paymentMode || 'cash',
            notes: data.notes
          });
          break;
        }

        case 'payment': {
          let accountId = data.accountId;
          if (!accountId) {
            const acc = await db.accounts.add({
              id: 'acc_' + Date.now(),
              siteId: currentSiteId,
              type: data.accountType || 'supplier',
              name: data.accountName || 'Unknown Account',
              openingBalance: 0,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            accountId = acc;
          }

          await createPayment({
            siteId: currentSiteId,
            accountId,
            amount: data.amount || 0,
            date: data.date || today,
            paymentMode: data.paymentMode || 'cash',
            notes: data.notes
          });
          break;
        }

        case 'labour_work': {
          let labourId = data.accountId;
          if (!labourId) {
            const lab = await db.accounts.add({
              id: 'acc_lab_' + Date.now(),
              siteId: currentSiteId,
              type: 'labour',
              name: data.accountName || 'Labour Contractor',
              openingBalance: 0,
              status: 'active',
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
            labourId = lab;
          }

          await createLabourWork({
            siteId: currentSiteId,
            labourAccountId: labourId,
            workDescription: data.notes || 'Labour work recorded by AI',
            amount: data.amount || 0,
            date: data.date || today
          });
          break;
        }

        case 'expense': {
          await createSiteExpense({
            siteId: currentSiteId,
            category: data.category || 'Site Expense',
            amount: data.amount || 0,
            date: data.date || today,
            paymentMode: data.paymentMode || 'cash',
            paidTo: data.accountName,
            notes: data.notes
          });
          break;
        }

        case 'material_usage': {
          if (!data.materialId) {
            throw new Error('Please select a material first');
          }
          await recordMaterialUsage({
            siteId: currentSiteId,
            materialId: data.materialId,
            quantity: data.quantity || 1,
            date: data.date || today,
            notes: data.notes
          });
          break;
        }

        case 'material_return': {
          if (!data.materialId) {
            throw new Error('Please select a material first');
          }
          await recordMaterialReturn({
            siteId: currentSiteId,
            materialId: data.materialId,
            quantity: data.quantity || 1,
            date: data.date || today,
            notes: data.notes
          });
          break;
        }

        default:
          throw new Error('Unsupported transaction type');
      }

      // Success! Play celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      showToast('Transaction confirmed and saved to Khata!', 'success');
      triggerRefresh();
      setParsedIntent(null);
      setInputText('');
      setAiModalOpen(false);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving transaction', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAiModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-charcoal-900 border border-charcoal-700 rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-charcoal-800 bg-charcoal-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-construction-500 to-amber-400 text-charcoal-950 flex items-center justify-center shadow-md font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-construction-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Khata Assistant</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Site: {currentSite?.name}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setAiModalOpen(false)}
            className="p-1.5 text-charcoal-400 hover:text-white rounded-lg hover:bg-charcoal-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {/* Natural Language Voice/Text Input Box */}
          <div className="relative">
            <div className="flex items-center justify-between pb-1.5 text-xs text-charcoal-400">
              <span className="font-semibold text-charcoal-300">Speech / Text Prompt</span>
              {/* Language Selector */}
              <div className="flex items-center space-x-1 text-[11px]">
                <span className="text-charcoal-500">Voice:</span>
                {(['hi-IN', 'en-IN', 'en-US'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSpeechLang(lang)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                      speechLang === lang
                        ? 'bg-construction-500 text-charcoal-950'
                        : 'bg-charcoal-800 text-charcoal-400 hover:text-white'
                    }`}
                  >
                    {lang === 'hi-IN' ? 'Hindi' : lang === 'en-IN' ? 'Hinglish' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Bol kar ya likh kar entry karein...&#10;e.g. 'Sharma hardware se plumbing ka samaan 15000 ka aaya' ya 'Rakesh ko 5000 de diye'"
              className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl p-3.5 text-sm text-white placeholder-charcoal-400 focus:outline-none focus:border-construction-500 focus:ring-1 focus:ring-construction-500 transition resize-none"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
              <div className="flex items-center space-x-2">
                {/* Voice Record Toggle */}
                <button
                  type="button"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-md ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-charcoal-750 hover:bg-charcoal-700 text-construction-400 border border-charcoal-600'
                  }`}
                >
                  {isListening ? <MicOff className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4 text-construction-400" />}
                  <span>{isListening ? '🛑 Stop & Process' : '🎙️ Tap to Speak'}</span>
                </button>

                {isListening && (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-950/50 border border-red-800/40 rounded-lg text-[11px] text-red-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                    <span>Listening... speak your transaction</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessing || !inputText.trim()}
                onClick={() => handleParse()}
                className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50 shadow"
              >
                <span>Interpret Entry</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Offline & Keyboard Voice Dictation Note */}
            <div className="text-[11px] text-charcoal-400 mt-2 px-1 flex flex-wrap items-center justify-between gap-1">
              <span>
                💡 <strong>Windows Shortcut:</strong> Press <kbd className="px-1.5 py-0.5 bg-charcoal-800 text-construction-400 border border-charcoal-700 rounded font-mono font-bold">Win + H</kbd> to dictate in Hindi/English anytime offline!
              </span>
              <span className="text-charcoal-500">📱 Mobile: Use keyboard mic icon</span>
            </div>

            {recognitionError && (
              <div className="mt-2.5 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/80 p-3 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-tight">{recognitionError}</span>
                </div>
                <div className="text-[11px] text-charcoal-300 pt-1 border-t border-amber-800/40">
                  <span className="font-bold text-white mr-1.5">Quick Test:</span>
                  Tap any common transaction to autofill:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Sharma hardware se plumbing ka samaan 15000 ka aaya',
                    'Rakesh plumber ko 5000 de diye',
                    '20 cement bags aaye 420 ke'
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setInputText(phrase);
                        setRecognitionError(null);
                        handleParse(phrase);
                      }}
                      className="bg-charcoal-900 hover:bg-charcoal-800 text-slate-200 border border-amber-700/50 px-2 py-1 rounded text-[11px] font-medium transition"
                    >
                      "{phrase}"
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Examples for Contractor */}
          {!parsedIntent && (
            <div className="bg-charcoal-950/60 border border-charcoal-800 rounded-xl p-3">
              <div className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider mb-2">
                Try these examples:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Sharma hardware se plumbing ka samaan 15000 ka aaya',
                  'Rakesh plumber ko 5000 de diye',
                  '20 cement bags aaye 420 ke',
                  '10 CPVC pipe use ho gaye',
                  'Rakesh ka 8000 ka kaam add karo',
                  'Diesel ka 1200 kharcha hua'
                ].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => {
                      setInputText(sample);
                      handleParse(sample);
                    }}
                    className="text-left text-[11px] bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-white px-2.5 py-1 rounded-lg border border-charcoal-700/60 transition"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clarification prompt (Requirement 23 & Test 7) */}
          {parsedIntent?.clarificationRequired && (
            <div className="p-4 bg-amber-950/50 border border-amber-700/60 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
                <HelpCircle className="w-4 h-4" />
                <span>{parsedIntent.clarificationRequired}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {parsedIntent.clarificationOptions?.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleClarificationSelect(opt)}
                    className="p-2.5 text-left rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-amber-600/40 text-xs transition"
                  >
                    <div className="font-bold text-white">{opt.label}</div>
                    {opt.subtext && <div className="text-[10px] text-charcoal-400">{opt.subtext}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Missing Information Notice (Requirement 26 & Test 8) */}
          {parsedIntent && parsedIntent.missingFields.length > 0 && !parsedIntent.clarificationRequired && (
            <div className="p-4 bg-charcoal-950 border border-amber-700/40 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Missing Information (Incomplete AI Transaction)</span>
              </div>
              <p className="text-xs text-charcoal-300">
                AI did not invent the missing details. Please provide:
                <span className="font-bold text-white ml-1">
                  {parsedIntent.missingFields.join(', ')}
                </span>
              </p>

              {/* Editable inputs for missing fields */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {parsedIntent.missingFields.includes('supplier') && (
                  <div>
                    <label className="text-[10px] text-charcoal-400">Supplier Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma Hardware"
                      value={parsedIntent.data.accountName || ''}
                      onChange={(e) => {
                        const updated = { ...parsedIntent };
                        updated.data.accountName = e.target.value;
                        if (e.target.value) {
                          updated.missingFields = updated.missingFields.filter(f => f !== 'supplier');
                        }
                        setParsedIntent(updated);
                      }}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                )}

                {parsedIntent.missingFields.includes('material') && (
                  <div>
                    <label className="text-[10px] text-charcoal-400">Material Name</label>
                    <input
                      type="text"
                      placeholder="e.g. CPVC Pipe 1&quot;"
                      value={parsedIntent.data.materialName || ''}
                      onChange={(e) => {
                        const updated = { ...parsedIntent };
                        updated.data.materialName = e.target.value;
                        if (e.target.value) {
                          updated.missingFields = updated.missingFields.filter(f => f !== 'material');
                        }
                        setParsedIntent(updated);
                      }}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                )}

                {parsedIntent.missingFields.includes('quantity') && (
                  <div>
                    <label className="text-[10px] text-charcoal-400">Quantity</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={parsedIntent.data.quantity || ''}
                      onChange={(e) => {
                        const updated = { ...parsedIntent };
                        const q = parseFloat(e.target.value);
                        updated.data.quantity = q;
                        if (q > 0) {
                          updated.missingFields = updated.missingFields.filter(f => f !== 'quantity');
                        }
                        setParsedIntent(updated);
                      }}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                )}

                {parsedIntent.missingFields.includes('amount') && (
                  <div>
                    <label className="text-[10px] text-charcoal-400">Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={parsedIntent.data.amount || ''}
                      onChange={(e) => {
                        const updated = { ...parsedIntent };
                        const a = parseFloat(e.target.value);
                        updated.data.amount = a;
                        if (a > 0) {
                          updated.missingFields = updated.missingFields.filter(f => f !== 'amount');
                        }
                        setParsedIntent(updated);
                      }}
                      className="w-full bg-charcoal-800 border border-charcoal-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI CONFIRMATION CARD (Requirement 24) */}
          {parsedIntent && !parsedIntent.clarificationRequired && (
            <div className="bg-charcoal-950 border-2 border-construction-500/80 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-charcoal-800">
                <span className="text-xs font-black uppercase tracking-wider text-construction-400">
                  CONFIRMATION CARD • {parsedIntent.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-[11px] text-charcoal-400">
                  {currentSite?.name}
                </span>
              </div>

              {/* Transaction details display */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Site:</span>
                  <span className="font-bold text-white">{currentSite?.name}</span>
                </div>

                {parsedIntent.data.accountName && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">
                      {parsedIntent.type === 'purchase' ? 'Supplier:' : 'Account / Labour:'}
                    </span>
                    <span className="font-bold text-white">{parsedIntent.data.accountName}</span>
                  </div>
                )}

                {parsedIntent.data.materialName && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">Material:</span>
                    <span className="font-bold text-white">{parsedIntent.data.materialName}</span>
                  </div>
                )}

                {parsedIntent.data.quantity !== undefined && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">Quantity:</span>
                    <span className="font-bold text-white">
                      {parsedIntent.data.quantity} {parsedIntent.data.unit || 'pcs'}
                    </span>
                  </div>
                )}

                {parsedIntent.data.rate !== undefined && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">Rate:</span>
                    <span className="font-bold text-white">₹{parsedIntent.data.rate}</span>
                  </div>
                )}

                {parsedIntent.data.amount !== undefined && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">Total Amount:</span>
                    <span className="font-black text-emerald-400 text-sm">
                      {formatCurrency(parsedIntent.data.amount)}
                    </span>
                  </div>
                )}

                {parsedIntent.data.paymentMode && (
                  <div>
                    <span className="text-charcoal-400 block text-[10px]">Payment Mode:</span>
                    <span className="font-bold text-white uppercase">
                      {parsedIntent.data.paymentMode}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmation Actions */}
              <div className="pt-3 border-t border-charcoal-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setParsedIntent(null)}
                  className="px-3 py-1.5 text-xs text-charcoal-400 hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={parsedIntent.missingFields.length > 0}
                  onClick={handleConfirmAndSave}
                  className="bg-construction-500 hover:bg-construction-400 text-charcoal-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Incomplete Transactions Drawer Trigger */}
          {pendingDrafts.length > 0 && (
            <div className="pt-2 border-t border-charcoal-800">
              <button
                onClick={() => setShowDraftsList(!showDraftsList)}
                className="w-full flex items-center justify-between text-xs text-charcoal-400 hover:text-white p-2 rounded-lg bg-charcoal-950/40"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pending / Incomplete Drafts ({pendingDrafts.length})</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {showDraftsList && (
                <div className="mt-2 space-y-2">
                  {pendingDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-3 bg-charcoal-800/60 rounded-xl border border-charcoal-700 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">"{draft.rawText}"</div>
                        <div className="text-[10px] text-amber-400 mt-0.5">
                          Missing: {draft.missingFields.join(', ')}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setInputText(draft.rawText);
                          handleParse(draft.rawText);
                        }}
                        className="text-[11px] text-construction-400 hover:underline font-bold"
                      >
                        Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
