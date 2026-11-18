import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Mail,
  MessageSquare,
  CreditCard,
  History,
  FileCheck,
  Ban,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { Invoice } from '../types';
import { useSettings } from '../context/SettingsContext';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import { SendEmailModal } from '../components/invoices/SendEmailModal';
import { ShareWhatsAppModal } from '../components/invoices/ShareWhatsAppModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchInvoice = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {
      console.error('Failed to load invoice details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleIssueInvoice = async () => {
    if (!invoice) return;
    try {
      const res = await api.post(`/invoices/${invoice.id}/issue`);
      setInvoice(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to issue invoice');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const badge = getStatusBadge(invoice.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Issued on {formatDate(invoice.invoiceDate)} to {invoice.customer?.name || 'Customer'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Issue Draft Action */}
          {invoice.status === 'DRAFT' && (
            <button
              onClick={handleIssueInvoice}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Issue Official Tax Invoice</span>
            </button>
          )}

          {/* Record Payment */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Download PDF */}
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>PDF</span>
          </a>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Email */}
          <button
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <Mail className="w-4 h-4 text-slate-500" />
            <span>Email</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={() => setWhatsAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Exact Ref 2 Document, Right = Financial Timeline & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Pixel-Accurate Invoice Preview (7 Cols) */}
        <div className="lg:col-span-8">
          <InvoicePreview
            invoiceNumber={invoice.invoiceNumber}
            invoiceDate={invoice.invoiceDate}
            supplier={settings}
            customer={invoice.customer || null}
            items={invoice.items || []}
            deliveryNote={invoice.deliveryNote || ''}
            paymentTerms={invoice.paymentTerms || ''}
            supplierRef={invoice.supplierRef || ''}
            otherRef={invoice.otherRef || ''}
            buyersOrderNo={invoice.buyersOrderNo || ''}
            orderDate={invoice.orderDate || ''}
            despatchDocNo={invoice.despatchDocNo || ''}
            despatchDate={invoice.despatchDate || ''}
            despatchedThrough={invoice.despatchedThrough || ''}
            destination={invoice.destination || ''}
            placeOfSupply={invoice.placeOfSupply || ''}
            termsOfDelivery={invoice.termsOfDelivery || ''}
            isInterstate={invoice.isInterstate}
            subtotal={invoice.subtotal}
            taxableAmount={invoice.taxableAmount}
            cgstAmount={invoice.cgstAmount}
            sgstAmount={invoice.sgstAmount}
            igstAmount={invoice.igstAmount}
            totalTaxAmount={invoice.totalTaxAmount}
            grandTotal={invoice.grandTotal}
            amountInWords={invoice.amountInWords || ''}
          />
        </div>

        {/* Right: Payment Ledger & Audit Timeline (4 Cols) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          {/* Balance Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Payment Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Grand Total:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Amount Collected:</span>
                <span className="font-mono">{formatCurrency(invoice.amountReceived)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-blue-700 font-bold text-sm">
                <span>Outstanding Balance:</span>
                <span className="font-mono">{formatCurrency(invoice.outstandingBalance)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Recorded Receipts</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {invoice.payments?.length || 0} payment(s)
              </span>
            </div>

            <div className="space-y-2.5">
              {(invoice.payments || []).map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] font-bold text-slate-500">{p.receiptNumber}</span>
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{formatDate(p.paymentDate)}</span>
                    <span className="font-medium text-slate-700">{p.paymentMethod}</span>
                  </div>
                  {p.transactionRef && (
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Ref: {p.transactionRef}
                    </div>
                  )}
                </div>
              ))}
              {(!invoice.payments || invoice.payments.length === 0) && (
                <p className="text-xs text-slate-400 text-center py-3">No payments recorded yet.</p>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Document Audit Trail</span>
            </h3>

            <div className="space-y-2.5">
              {(invoice.auditLogs || []).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      <SendEmailModal
        invoice={invoice}
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={fetchInvoice}
      />

      <ShareWhatsAppModal
        invoice={invoice}
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />

      <RecordPaymentModal
        invoice={invoice}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchInvoice}
      />
    </div>
  );
};
