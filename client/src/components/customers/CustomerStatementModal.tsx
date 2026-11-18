import React, { useState, useEffect } from 'react';
import { FileText, X, Download, Printer, CreditCard, Receipt } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CustomerStatementModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customerId,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !customerId) return null;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customers/${customerId}`)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center text-xs text-slate-500">
          Loading Statement...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Customer Statement & Account Ledger</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Statement Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Customer Bio */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                {data.customerCode || 'CUST'}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-1">{data.name}</h3>
              {data.companyName && <p className="text-xs font-medium text-slate-600">{data.companyName}</p>}
              <p className="text-xs text-slate-500 mt-1">{data.billingAddress || '-'}</p>
              <p className="text-xs text-slate-500">
                {data.state} {data.gstin ? `| GSTIN: ${data.gstin}` : ''}
              </p>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 sm:flex gap-3 text-right">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm">
                <span className="text-[10px] text-slate-400 block uppercase">Total Billed</span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {formatCurrency(data.summary?.totalBilled)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm">
                <span className="text-[10px] text-slate-400 block uppercase">Collected</span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {formatCurrency(data.summary?.totalReceived)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-sm">
                <span className="text-[10px] text-slate-400 block uppercase">Balance Due</span>
                <span className="text-xs font-mono font-bold text-blue-700">
                  {formatCurrency(data.summary?.outstandingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              <span>Invoices Issued ({data.invoices?.length || 0})</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">Total</th>
                    <th className="p-2.5 text-right">Paid</th>
                    <th className="p-2.5 text-right">Outstanding</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.invoices || []).map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(inv.invoiceDate)}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(inv.taxableAmount)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600">{formatCurrency(inv.amountReceived)}</td>
                      <td className="p-2.5 text-right font-mono font-semibold text-blue-700">{formatCurrency(inv.outstandingBalance)}</td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-medium">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!data.invoices || data.invoices.length === 0) && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">No invoices recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Ledger */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payments Received ({data.payments?.length || 0})</span>
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="p-2.5">Receipt #</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Method</th>
                    <th className="p-2.5">Reference</th>
                    <th className="p-2.5 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data.payments || []).map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-slate-700">{p.receiptNumber || '-'}</td>
                      <td className="p-2.5 text-slate-500">{formatDate(p.paymentDate)}</td>
                      <td className="p-2.5 font-medium text-slate-700">{p.paymentMethod}</td>
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">{p.transactionRef || '-'}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                  {(!data.payments || data.payments.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">No payment receipts recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
