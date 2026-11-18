import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  CreditCard,
  FileText,
  Sliders,
  Lock,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { CompanySettings } from '../types';

export const Settings: React.FC = () => {
  const { settings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put('/settings', formData);
      await refreshSettings();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (category: 'logo' | 'signature' | 'stamp', file: File) => {
    const data = new FormData();
    data.append('file', file);

    try {
      const res = await api.post(`/upload/${category}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshSettings();
      alert(`${category.toUpperCase()} uploaded successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'File upload failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    setPasswordMsg(null);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & Branding</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure supplier company profile, bank accounts, Indian GST series, and invoice template toggles.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Company profile and invoice settings updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* A. Company Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">A. Supplier Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Business Name</label>
              <input
                type="text"
                required
                value={formData.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder='"AI TO SIMPLIFY, TECH TO AMPLIFY"'
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN</label>
              <input
                type="text"
                required
                value={formData.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Business Address</label>
            <input
              type="text"
              required
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier State</label>
              <input
                type="text"
                required
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
              <input
                type="text"
                required
                value={formData.stateCode || ''}
                onChange={(e) => handleChange('stateCode', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Company Logo</span>
              <span className="text-[11px] text-slate-400">PNG or SVG transparent logo for tax invoice header</span>
            </div>

            <div className="flex items-center gap-3">
              {formData.logoUrl && (
                <img src={formData.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain border p-0.5 rounded bg-white" />
              )}
              <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('logo', e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>

        {/* B. Bank Details & UPI */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">B. Bank & UPI Settlement Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountName || ''}
                onChange={(e) => handleChange('accountName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc || ''}
                onChange={(e) => handleChange('ifsc', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.branch || ''}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-blue-700 font-bold"
              />
            </div>
          </div>
        </div>

        {/* C. Invoice Numbering & Declaration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">C. Invoice Series & Document Legalities</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix || ''}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Year Format</label>
              <input
                type="text"
                value={formData.financialYear || ''}
                onChange={(e) => handleChange('financialYear', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Sequence Counter</label>
              <input
                type="number"
                value={formData.invoiceNextNumber || 1}
                onChange={(e) => handleChange('invoiceNextNumber', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Invoice Declaration</label>
            <textarea
              rows={2}
              value={formData.defaultDeclaration || ''}
              onChange={(e) => handleChange('defaultDeclaration', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Signature Upload */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Authorized Signatory Signature</span>
              <span className="text-[11px] text-slate-400">Digital signature for authorized box in Reference 2</span>
            </div>

            <div className="flex items-center gap-3">
              {formData.signatureUrl && (
                <img src={formData.signatureUrl} alt="Signature" className="h-8 max-w-[120px] object-contain border p-0.5 rounded bg-white" />
              )}
              <label className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Upload Signature
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>

        {/* D. Invoice Template Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">D. Invoice Template Visibility Rules</h2>
          </div>
          <p className="text-xs text-slate-400">
            Show or hide optional fields from the tax invoice grid when empty:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'showDeliveryNote', label: 'Delivery Note Field' },
              { key: 'showModeOfPayment', label: 'Mode / Terms of Payment' },
              { key: 'showSupplierRef', label: "Supplier's Reference" },
              { key: 'showOtherRef', label: 'Other Reference(s)' },
              { key: 'showBuyersOrder', label: "Buyer's Order No & Date" },
              { key: 'showDespatchDoc', label: 'Despatch Document No & Date' },
              { key: 'showDespatchedThrough', label: 'Despatched through / Destination' },
              { key: 'showTermsOfDelivery', label: 'Terms of Delivery Section' },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData as any)[item.key] ?? true}
                  onChange={(e) => handleChange(item.key as any, e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>

      {/* E. Admin Security */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">E. Admin Account Security</h2>
        </div>

        {passwordMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            passwordMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {passwordSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

