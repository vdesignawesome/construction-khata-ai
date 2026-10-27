import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2, Calendar, FileText } from 'lucide-react';
import type { SubscriptionInvoice } from '../../types/saas';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BRAND_CONFIG } from '../../config/branding';

interface InvoiceViewModalProps {
  invoice: SubscriptionInvoice | null;
  onClose: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, onClose }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const cgst = Math.round((invoice.gstAmount / 2) * 100) / 100;
  const sgst = Math.round((invoice.gstAmount / 2) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-white text-charcoal-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 border border-charcoal-300 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 bg-charcoal-950 text-white flex items-center justify-between border-b border-charcoal-800 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-300">
              Tax Invoice &amp; Payment Receipt
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition active:scale-95 shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-charcoal-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Area */}
        <div className="p-6 sm:p-8 space-y-6 text-xs bg-white text-slate-800" id="printable-invoice">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-charcoal-950 flex items-center justify-center font-black text-base shadow-sm">
                  CK
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">
                    Construction Khata AI
                  </h2>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">
                    An {BRAND_CONFIG.parentBrand} Ecosystem Product
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                <div>HSN / SAC Code: 998314 (Cloud Software Services)</div>
                <div>Support: {BRAND_CONFIG.supportEmail}</div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1">
                PAID INVOICE
              </span>
              <div className="text-base font-extrabold text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Date: {formatDate(new Date(invoice.issuedAt).toISOString().split('T')[0])}
              </div>
            </div>
          </div>

          {/* Billed To / Contractor Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billed To (Contractor)
              </div>
              <div className="font-extrabold text-sm text-slate-900">{invoice.tenantName}</div>
              <div className="text-slate-600 mt-0.5">Attn: {invoice.userName}</div>
              <div className="text-slate-500 mt-0.5">{invoice.userEmail}</div>
              {invoice.userPhone && (
                <div className="text-slate-500 mt-0.5">Mobile: {invoice.userPhone}</div>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Subscription Validity
              </div>
              <div className="text-slate-900 font-bold text-xs">
                Plan: <span className="text-amber-600 font-extrabold">{invoice.planName}</span>
              </div>
              <div className="text-slate-600 text-[11px]">
                Valid Until:{' '}
                <strong className="text-emerald-700">
                  {formatDate(new Date(invoice.validUntil).toISOString().split('T')[0])}
                </strong>
              </div>
              <div className="text-slate-500 text-[10px]">
                Sites Limit: <strong>Unlimited Sites Allowed</strong>
              </div>
            </div>
          </div>

          {/* Invoice Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">SAC</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">
                      Construction Khata AI — {invoice.planName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Multi-tenant SaaS cloud access, unlimited sites, AI voice khata, materials inventory
                    </div>
                  </td>
                  <td className="p-3 text-center text-slate-600 font-mono">998314</td>
                  <td className="p-3 text-center text-slate-600">
                    {invoice.durationMonths >= 12 ? '1 Year' : `${invoice.durationMonths} Month`}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatCurrency(invoice.baseAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Total */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 w-full sm:w-auto">
              <div>
                Payment Gateway: <strong>Razorpay Online Payment</strong>
              </div>
              <div>
                Payment Ref ID: <strong className="font-mono text-slate-900">{invoice.razorpayPaymentId}</strong>
              </div>
              <div>
                Method: <strong>{invoice.paymentMethod}</strong>
              </div>
              <div className="text-emerald-700 font-bold flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Confirmed &amp; Verified</span>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal (Taxable Amount):</span>
                <span className="font-semibold">{formatCurrency(invoice.baseAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>CGST (9.0%):</span>
                <span>{formatCurrency(cgst)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>SGST (9.0%):</span>
                <span>{formatCurrency(sgst)}</span>
              </div>
              <div className="border-t border-slate-300 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-emerald-700">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            This is a computer-generated tax invoice and payment receipt. No physical signature is required.
            <br />
            Thank you for partnering with Construction Khata AI • Powered by {BRAND_CONFIG.parentBrand} Ecosystem.
          </div>
        </div>
      </div>
    </div>
  );
};
