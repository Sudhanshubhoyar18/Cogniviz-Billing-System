import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Mail,
  Phone,
  Building,
  CreditCard,
  Receipt,
} from 'lucide-react';
import api from '../services/api';
import { Customer } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CustomerModal } from '../components/customers/CustomerModal';
import { CustomerStatementModal } from '../components/customers/CustomerStatementModal';

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', {
        params: search.trim() ? { search: search.trim() } : {},
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (searchParams.get('action') === 'new') {
      setEditingCustomer(null);
      setModalOpen(true);
      setSearchParams({});
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete or archive customer "${name}"?`)) return;

    try {
      const res = await api.delete(`/customers/${id}`);
      alert(res.data.message);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Customer CRM</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage client profiles, contact information, GSTIN, and account statements.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, company, GSTIN, email or phone..."
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
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">GSTIN / State</th>
                <th className="py-3.5 px-4 text-right">Total Invoiced</th>
                <th className="py-3.5 px-4 text-right">Outstanding</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                    {c.customerCode || 'CUST'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                    {c.billingAddress && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                        {c.billingAddress}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                    {c.companyName || '-'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {c.email && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.gstin ? (
                      <span className="font-mono text-[10px] font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                        {c.gstin}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{c.state || 'India'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(c.totalBilled)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                    {formatCurrency(c.outstandingBalance)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Statement */}
                      <button
                        onClick={() => setStatementCustomerId(c.id)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="View Statement & History"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingCustomer(c);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete / Archive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No customers found. Click "Add Customer" to register your first client.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CustomerModal
        customer={editingCustomer}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(null);
        }}
        onSuccess={fetchCustomers}
      />

      <CustomerStatementModal
        customerId={statementCustomerId}
        isOpen={!!statementCustomerId}
        onClose={() => setStatementCustomerId(null)}
      />
    </div>
  );
};

