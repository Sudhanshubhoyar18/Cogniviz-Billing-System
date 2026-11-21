import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  MessageSquare,
  CreditCard,
  Copy,
  Plus,
  Ban,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import api from '../services/api';
import { Invoice, Customer } from '../types';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';
import { SendEmailModal } from '../components/invoices/SendEmailModal';
import { ShareWhatsAppModal } from '../components/invoices/ShareWhatsAppModal';
import { RecordPaymentModal } from '../components/payments/RecordPaymentModal';

export const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('');

  // Modals state
  const [activeInvoiceForEmail, setActiveInvoiceForEmail] = useState<Invoice | null>(null);
  const [activeInvoiceForWhatsApp, setActiveInvoiceForWhatsApp] = useState<Invoice | null>(null);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (customerFilter) params.customerId = customerFilter;

      const res = await api.get('/invoices', { params });
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/customers').then(res => setCustomers(res.data)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, customerFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleDuplicate = async (id: string) => {
    if (!window.confirm('Do you want to create a duplicated draft copy of this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/duplicate`);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to duplicate invoice');
    }
  };

  const handleCancelInvoice = async (id: string) => {
    const reason = window.prompt('Please enter the reason for cancelling this issued tax invoice:');
    if (!reason) return;

    try {
      await api.post(`/invoices/${id}/cancel`, { reason });
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Invoice Records</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage tax invoices, monitor payments, download PDFs, and dispatch notifications.
          </p>
        </div>

        <button
          onClick={() => navigate('/invoices/create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Invoice</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between transition-colors">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending / Issued</option>
            <option value="DRAFT">Draft</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[200px] truncate"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.companyName ? `(${c.companyName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Taxable</th>
                <th className="py-3.5 px-4 text-right">Total (INR)</th>
                <th className="py-3.5 px-4 text-right">Received</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => {
                const badge = getStatusBadge(inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                      <button
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{inv.customer?.name || 'Walk-in'}</div>
                      {inv.customer?.companyName && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{inv.customer.companyName}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatCurrency(inv.taxableAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(inv.amountReceived)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-700 dark:text-blue-400 font-semibold">
                      {formatCurrency(inv.outstandingBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Download PDF */}
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Record Payment */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setActiveInvoiceForPayment(inv)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Send Email */}
                        <button
                          onClick={() => setActiveInvoiceForEmail(inv)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Share WhatsApp */}
                        <button
                          onClick={() => setActiveInvoiceForWhatsApp(inv)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                          title="Share via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(inv.id)}
                          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                          title="Duplicate Invoice"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Invoice */}
                        {inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Cancel Invoice"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching invoices found. Click "Create New Invoice" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      <SendEmailModal
        invoice={activeInvoiceForEmail}
        isOpen={!!activeInvoiceForEmail}
        onClose={() => setActiveInvoiceForEmail(null)}
        onSuccess={fetchInvoices}
      />

      <ShareWhatsAppModal
        invoice={activeInvoiceForWhatsApp}
        isOpen={!!activeInvoiceForWhatsApp}
        onClose={() => setActiveInvoiceForWhatsApp(null)}
      />

      <RecordPaymentModal
        invoice={activeInvoiceForPayment}
        isOpen={!!activeInvoiceForPayment}
        onClose={() => setActiveInvoiceForPayment(null)}
        onSuccess={fetchInvoices}
      />
    </div>
  );
};

