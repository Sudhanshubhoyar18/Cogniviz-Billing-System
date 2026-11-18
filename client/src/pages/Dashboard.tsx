import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Users,
  Calendar,
  ArrowUpRight,
  Plus,
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { DashboardStats } from '../types';
import { formatCurrency, formatDate, getStatusBadge } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Invoices',
      value: stats.cards.totalInvoices,
      format: (v: number) => String(v),
      icon: FileText,
      subtitle: 'Issued documents',
      color: 'blue',
      bg: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Total Sales',
      value: stats.cards.totalSales,
      format: formatCurrency,
      icon: TrendingUp,
      subtitle: 'All active invoices',
      color: 'indigo',
      bg: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Revenue Received',
      value: stats.cards.revenueReceived,
      format: formatCurrency,
      icon: CheckCircle2,
      subtitle: 'Collected payments',
      color: 'emerald',
      bg: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Outstanding Balance',
      value: stats.cards.outstandingAmount,
      format: formatCurrency,
      icon: Clock,
      subtitle: 'Pending collections',
      color: 'amber',
      bg: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Total Customers',
      value: stats.cards.totalCustomers,
      format: (v: number) => String(v),
      icon: Users,
      subtitle: 'Registered clients',
      color: 'purple',
      bg: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Monthly Sales',
      value: stats.cards.monthlySales,
      format: formatCurrency,
      icon: Calendar,
      subtitle: 'Current month total',
      color: 'sky',
      bg: 'bg-sky-50 text-sky-600',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Billing & Financial Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Indian GST billing records, collections, and client metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
          >
            View Invoices
          </button>
          <button
            onClick={() => navigate('/invoices/create')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-slate-500">{c.title}</span>
              <div className={`p-2 rounded-xl ${c.bg}`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-slate-900 tracking-tight">
                {c.format(c.value)}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{c.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Overview Chart & Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Collections Trends Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Overview</h2>
              <p className="text-[11px] text-slate-400">Monthly sales vs. payment collections</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <span className="text-slate-600 font-medium">Billed Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600 font-medium">Collections</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collections" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#collGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Payment Status</h2>
            <p className="text-[11px] text-slate-400">Invoice lifecycle breakdown</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-emerald-900">Paid In Full</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700">{stats.statusCounts.PAID}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-900">Partially Paid</span>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700">{stats.statusCounts.PARTIALLY_PAID}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-semibold text-amber-900">Pending Payment</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-700">{stats.statusCounts.PENDING}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs font-semibold text-slate-700">Draft Invoices</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700">{stats.statusCounts.DRAFT}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-semibold text-rose-900">Overdue Invoices</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-700">{stats.statusCounts.OVERDUE}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices</h2>
              <p className="text-[11px] text-slate-400">Latest transactions and tax documents</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentInvoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 truncate max-w-[150px]">
                        {inv.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {stats.recentInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices recorded yet. Click "New Invoice" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Top Customers</h2>
            <p className="text-[11px] text-slate-400">Ranked by total billed invoice value</p>
          </div>

          <div className="space-y-3">
            {stats.topCustomers.map((cust, idx) => (
              <div
                key={cust.id}
                onClick={() => navigate(`/customers`)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                      {cust.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Paid: {formatCurrency(cust.totalPaid)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900 block">
                    {formatCurrency(cust.totalBilled)}
                  </span>
                </div>
              </div>
            ))}
            {stats.topCustomers.length === 0 && (
              <p className="text-xs text-center text-slate-400 py-6">
                No customer transactions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
