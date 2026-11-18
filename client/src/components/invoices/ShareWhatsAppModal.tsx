import React, { useState } from 'react';
import { MessageSquare, X, ExternalLink, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { Invoice } from '../../types';

interface ShareWhatsAppModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareWhatsAppModal: React.FC<ShareWhatsAppModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);

  const phone = invoice.customer?.whatsapp || invoice.customer?.phone || '';
  const downloadUrl = `${window.location.origin}/api/invoices/${invoice.id}/pdf`;
  const defaultText = `Hello ${invoice.customer?.name || 'Customer'},\nHere is your Tax Invoice ${invoice.invoiceNumber} for ₹${invoice.grandTotal.toLocaleString('en-IN')}.\nYou can download the official PDF invoice here:\n${downloadUrl}\n\nThank you,\nCogniviz Technologies`;

  const [message, setMessage] = useState(defaultText);

  const handleShareWhatsApp = async () => {
    setOpening(true);
    try {
      // Record WhatsApp share in audit log & increment share count
      await api.post(`/invoices/${invoice.id}/share-whatsapp`);
    } catch (e) {
      console.warn('Share track deferred:', e);
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setOpening(false);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <span>Share via WhatsApp</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer WhatsApp Number
            </label>
            <input
              type="text"
              readOnly
              value={phone || 'No phone number provided for customer'}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prefilled Message
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-sans"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={opening}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
