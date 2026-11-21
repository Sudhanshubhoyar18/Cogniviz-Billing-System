import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
  ArrowUpRight,
  Plus,
  Receipt,
  Eye,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Building2,
  ChevronRight,
  IndianRupee,
  Activity,
  Award,
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
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { isDark } = useTheme();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading Dashboard Intelligence...</p>
      </div>
    );
  }

  // Calculate Collection Ratio
  const collectionRate =
    stats.cards.totalSales > 0
      ? Math.round((stats.cards.revenueReceived / stats.cards.totalSales) * 100)
      : 0;

  // Total Invoices count for distribution calculation
  const totalTrackedInvoices =
    (stats.statusCounts.PAID || 0) +
    (stats.statusCounts.PARTIALLY_PAID || 0) +
    (stats.statusCounts.PENDING || 0) +
    (stats.statusCounts.OVERDUE || 0) +
    (stats.statusCounts.DRAFT || 0);

  const paidPercent = totalTrackedInvoices > 0 ? ((stats.statusCounts.PAID || 0) / totalTrackedInvoices) * 100 : 0;
  const pendingPercent = totalTrackedInvoices > 0 ? (((stats.statusCounts.PENDING || 0) + (stats.statusCounts.PARTIALLY_PAID || 0)) / totalTrackedInvoices) * 100 : 0;
  const overduePercent = totalTrackedInvoices > 0 ? ((stats.statusCounts.OVERDUE || 0) / totalTrackedInvoices) * 100 : 0;

  const cards = [
    {
      title: 'Total Invoices',
      value: stats.cards.totalInvoices,
      format: (v: number) => String(v),
      icon: FileText,
      subtitle: 'Issued documents',
      colorText: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50',
      tag: 'All Time',
    },
    {
      title: 'Total Sales',
      value: stats.cards.totalSales,
      format: formatCurrency,
      icon: TrendingUp,
      subtitle: 'Gross billed volume',
      colorText: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50',
      tag: 'Billed',
    },
    {
      title: 'Revenue Collected',
      value: stats.cards.revenueReceived,
      format: formatCurrency,
      icon: CheckCircle2,
      subtitle: 'Realized payments',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
      tag: `${collectionRate}% rate`,
    },
    {
      title: 'Outstanding Balance',
      value: stats.cards.outstandingAmount,
      format: formatCurrency,
      icon: Clock,
      subtitle: 'Receivables due',
      colorText: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
      tag: 'Pending',
    },
    {
      title: 'Active Customers',
      value: stats.cards.totalCustomers,
      format: (v: number) => String(v),
      icon: Users,
      subtitle: 'Verified accounts',
      colorText: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50',
      tag: 'Directory',
    },
    {
      title: 'Monthly Sales',
      value: stats.cards.monthlySales,
      format: formatCurrency,
      icon: Calendar,
      subtitle: 'Current billing period',
      colorText: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50',
      tag: 'This Month',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Welcome & Control Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 p-6 md:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900/60">
                GST Intelligence Center
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {user?.name || 'Administrator'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Track invoices, GST billing compliance, revenue collections, and customer balances for{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {settings?.companyName || 'Cogniviz Technologies'}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all ${
                refreshing ? 'animate-spin' : ''
              }`}
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/customers?action=new')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-sm"
            >
              + Customer
            </button>

            <button
              onClick={() => navigate('/invoices/create')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Highlights Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Collection Efficiency
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {collectionRate}%
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold">
                Realized
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Company GSTIN
            </span>
            <p className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
              {settings?.gstin || 'Not Configured'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Active Financial Year
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              FY {settings?.financialYear || '2026-27'}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Next Invoice Ref
            </span>
            <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {settings?.invoicePrefix || 'CV'}/{settings?.financialYear || '26-27'}/{String(settings?.invoiceNextNumber || 1).padStart(3, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c, idx) => (
          <div
            key={idx}
            className="group relative bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-400/50 dark:hover:border-blue-600/50 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl ${c.bgColor} transition-transform group-hover:scale-105`}>
                <c.icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
                {c.format(c.value)}
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <span className="text-slate-400 dark:text-slate-500 truncate">{c.subtitle}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold font-mono text-[9.5px]">
                  {c.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart & Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Collections Trends Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Revenue Overview</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Last 6 Months
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Monthly billed sales vs. realized collections
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">Billed Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">Collections</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={isDark ? 0.35 : 0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.35 : 0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? '#1e293b' : '#f1f5f9'}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.2)',
                  }}
                  itemStyle={{
                    color: isDark ? '#f8fafc' : '#0f172a',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                  name="Sales"
                />
                <Area
                  type="monotone"
                  dataKey="collections"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#collGrad)"
                  name="Collections"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Breakdown & Progress (1 Col) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Payment Status</h2>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                {totalTrackedInvoices} Total
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
              Lifecycle & settlement distribution
            </p>

            {/* Visual Multi-Segment Distribution Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mb-5">
              <div
                style={{ width: `${paidPercent}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Paid: ${paidPercent.toFixed(1)}%`}
              />
              <div
                style={{ width: `${pendingPercent}%` }}
                className="bg-amber-400 h-full transition-all duration-500"
                title={`Pending: ${pendingPercent.toFixed(1)}%`}
              />
              <div
                style={{ width: `${overduePercent}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Overdue: ${overduePercent.toFixed(1)}%`}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Paid In Full</span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {stats.statusCounts.PAID || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">Partially Paid</span>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                {stats.statusCounts.PARTIALLY_PAID || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">Pending</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                {stats.statusCounts.PENDING || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Draft Invoices</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                {stats.statusCounts.DRAFT || 0}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-xs font-semibold text-rose-900 dark:text-rose-300">Overdue Invoices</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                {stats.statusCounts.OVERDUE || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices & Top Customers Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Invoices</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Latest transactions and tax documents</p>
            </div>
            <button
              onClick={() => navigate('/invoices')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stats.recentInvoices.map((inv) => {
                  const badge = getStatusBadge(inv.status);
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {inv.customerName ? inv.customerName.slice(0, 1).toUpperCase() : 'C'}
                          </div>
                          <span className="truncate">{inv.customerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${inv.id}`);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
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
                    <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                      No invoices recorded yet. Click "Create Invoice" above to issue your first invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers Leaderboard (1 Col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top Clients</h2>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
              Ranked by total billed volume
            </p>

            <div className="space-y-3">
              {stats.topCustomers.map((cust, idx) => (
                <div
                  key={cust.id}
                  onClick={() => navigate(`/customers`)}
                  className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                        {cust.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        Paid: {formatCurrency(cust.totalPaid)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {formatCurrency(cust.totalBilled)}
                    </span>
                  </div>
                </div>
              ))}
              {stats.topCustomers.length === 0 && (
                <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-8">
                  No customer transactions recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate('/customers')}
              className="w-full py-2 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors"
            >
              Manage All Customers →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
