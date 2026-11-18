import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Receipt,
  Download,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { Payment, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payment state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    api.get('/invoices')
      .then(res => setInvoices(res.data.filter((i: Invoice) => i.status !== 'PAID' && i.status !== 'CANCELLED')))
      .catch(err => console.error(err));
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payment Collections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track incoming payments, receipts, and client settlement transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200/70 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] text-emerald-600 block uppercase font-bold">Total Collected</span>
            <span className="text-sm font-bold font-mono text-emerald-800">{formatCurrency(totalCollected)}</span>
          </div>

          <button
            onClick={() => {
              if (invoices.length > 0) {
                setSelectedInvoice(invoices[0]);
                setRecordModalOpen(true);
              } else {
                alert('No pending or partially paid invoices found.');
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Reference / UTR</th>
                <th className="py-3.5 px-4 text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                    {p.receiptNumber || 'RCP'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {p.invoice?.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{p.customer?.name || 'Customer'}</div>
                    {p.customer?.companyName && (
                      <div className="text-[10px] text-slate-400">{p.customer.companyName}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {p.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {p.transactionRef || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                    {formatCurrency(p.amount)}
                  </td>
                </tr>
              ))}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment receipts recorded yet. Click "Record Payment" to record a collection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        invoice={selectedInvoice}
        isOpen={recordModalOpen}
        onClose={() => {
          setRecordModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSuccess={fetchPayments}
      />
    </div>
  );
};
