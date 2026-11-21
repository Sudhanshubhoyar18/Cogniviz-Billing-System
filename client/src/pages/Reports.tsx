import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Percent,
  Users,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

export const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await api.get('/reports/summary', { params });
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate]);

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { sales, payments, gstBreakdown, customerBreakdown } = reportData;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Financial & Tax Reports</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sales summaries, payment collections, customer account balances, and GST breakdown.
          </p>
        </div>

        {/* Date Filter & Export CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <a
            href="/api/reports/export-csv?type=invoices"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Invoices CSV</span>
          </a>

          <a
            href="/api/reports/export-csv?type=payments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Payments CSV</span>
          </a>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block uppercase">Total Invoiced Sales</span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatCurrency(sales.totalInvoiceValue)}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{sales.totalInvoices} invoice documents</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block uppercase">Taxable Sales</span>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatCurrency(sales.totalTaxableSales)}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Net assessable turnover</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block uppercase">Total GST Collected</span>
          <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{formatCurrency(sales.totalGst)}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">CGST + SGST + IGST</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block uppercase">Total Payments Collected</span>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(payments.totalCollected)}</div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
            Outstanding: {formatCurrency(payments.totalOutstanding)}
          </span>
        </div>
      </div>

      {/* Indian GST Tax Breakdown by Rate Slab */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">GST Summary by Tax Slab</h2>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">Indian GST Statutory Breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Tax Slab Rate (%)</th>
                <th className="py-3 px-4 text-right">Taxable Turnover (₹)</th>
                <th className="py-3 px-4 text-right">CGST (₹)</th>
                <th className="py-3 px-4 text-right">SGST (₹)</th>
                <th className="py-3 px-4 text-right">IGST (₹)</th>
                <th className="py-3 px-4 text-right">Total GST Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {gstBreakdown.map((slab: any) => (
                <tr key={slab.rate} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 font-mono">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 font-sans">
                    {slab.rate}% GST
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(slab.taxable)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(slab.cgst)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                    {formatCurrency(slab.sgst)}
                  </td>
                  <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                    {formatCurrency(slab.igst)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(slab.totalTax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Balances & Revenue Share */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Customer Revenue & Receivables Ledger</h2>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">All registered clients</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">Invoices</th>
                <th className="py-3 px-4 text-right">Total Billed</th>
                <th className="py-3 px-4 text-right">Total Collected</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customerBreakdown.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-600 dark:text-slate-400">
                    {c.invoiceCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(c.billed)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(c.received)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(c.outstanding)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

