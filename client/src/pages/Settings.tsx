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
  Sun,
  Moon,
  Laptop,
  Palette,
  Boxes,
  Plus,
  Trash2,
  Edit2,
  Tag,
  X,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { CompanySettings, ServiceItem } from '../types';
import {
  GST_CLASSIFICATIONS,
  getClassificationByCode,
  detectHsnSacType,
} from '../constants/gstClassifications';

export const Settings: React.FC = () => {
  const { settings, refreshSettings } = useSettings();
  const { theme, setTheme, isDark } = useTheme();
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Services Library State
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchServices = async () => {
    setServicesLoading(true);
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
    fetchServices();
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

  // Service CRUD Handlers
  const handleOpenAddService = () => {
    setEditingService({
      name: '',
      description: '',
      hsnSac: '39169090',
      defaultRate: 950,
      unit: 'Spool',
      defaultGstRate: 18,
    });
    setServiceError(null);
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (item: ServiceItem) => {
    setEditingService(item);
    setServiceError(null);
    setServiceModalOpen(true);
  };

  const handleServiceHsnChange = (code: string) => {
    if (!editingService) return;
    const matched = getClassificationByCode(code);
    if (matched) {
      setEditingService({
        ...editingService,
        hsnSac: code,
        defaultGstRate: matched.gstRate,
        unit: editingService.unit && editingService.unit !== 'Nos' ? editingService.unit : matched.defaultUnit,
        name: editingService.name ? editingService.name : matched.description,
        description: editingService.description ? editingService.description : matched.description,
      });
    } else {
      setEditingService({
        ...editingService,
        hsnSac: code,
      });
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the library?`)) return;
    try {
      await api.delete(`/services/${id}`);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete service item');
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name?.trim()) {
      setServiceError('Item name is required.');
      return;
    }

    setServiceSaving(true);
    setServiceError(null);

    try {
      const payload = {
        name: editingService.name.trim(),
        description: editingService.description?.trim() || null,
        hsnSac: editingService.hsnSac?.trim() || null,
        defaultRate: Number(editingService.defaultRate) || 0,
        unit: editingService.unit?.trim() || 'Nos',
        defaultGstRate: Number(editingService.defaultGstRate) || 18,
      };

      if (editingService.id) {
        await api.put(`/services/${editingService.id}`, payload);
      } else {
        await api.post('/services', payload);
      }

      setServiceModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      setServiceError(err.response?.data?.error || 'Failed to save service item');
    } finally {
      setServiceSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings & Branding</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure supplier company profile, bank accounts, 3D printing HSN/SAC codes, appearance, and invoice toggles.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Company profile and invoice settings updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Theme & Appearance Setting Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Theme & Dashboard Appearance</h2>
        </div>

        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Choose your preferred display theme. System mode adapts automatically to your OS settings.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light Mode', desc: 'Crisp & clean daylight interface', icon: Sun, color: 'text-amber-500' },
              { id: 'dark', label: 'Dark Mode', desc: 'High-contrast dark dashboard', icon: Moon, color: 'text-indigo-400' },
              { id: 'system', label: 'System Auto', desc: 'Syncs with device preference', icon: Laptop, color: 'text-blue-500' },
            ].map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id as ThemeMode)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 ${opt.color}`}>
                    <opt.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{opt.label}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3D Printing & Products / HSN-SAC Master Library Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">3D Printing & Products / HSN-SAC Master Library</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Pre-configured statutory HSN (Goods) & SAC (Services) codes with default pricing and units.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddService}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item / Service</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Item / Service Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">HSN / SAC Code</th>
                <th className="py-2.5 px-3">Default Rate</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-center">GST Rate</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {services.map((svc) => {
                const isService = svc.hsnSac?.startsWith('99') || detectHsnSacType(svc.hsnSac) === 'SAC';
                return (
                  <tr key={svc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{svc.name}</div>
                      {svc.description && (
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[280px]">
                          {svc.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isService
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                        }`}
                      >
                        {isService ? 'SAC (Service)' : 'HSN (Goods)'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/80 dark:border-blue-900/50">
                        {svc.hsnSac || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      ₹{svc.defaultRate.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                      /{svc.unit}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {svc.defaultGstRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditService(svc)}
                          className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(svc.id, svc.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && !servicesLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No services in library. Click "Add Item / Service" above to add your first 3D printing item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* A. Company Profile */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">A. Supplier Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Business Name</label>
              <input
                type="text"
                required
                value={formData.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tagline / Motto</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => handleChange('tagline', e.target.value)}
                placeholder='"AI TO SIMPLIFY, TECH TO AMPLIFY"'
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company GSTIN</label>
              <input
                type="text"
                required
                value={formData.gstin || ''}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Business Address</label>
            <input
              type="text"
              required
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier State</label>
              <input
                type="text"
                required
                value={formData.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">State Code</label>
              <input
                type="text"
                required
                value={formData.stateCode || ''}
                onChange={(e) => handleChange('stateCode', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Logo Upload & Preview */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                <img
                  src={formData.logoUrl || '/logo.png'}
                  alt="App Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">App & Header Logo</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Updated application branding & tax invoice header
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Change Custom Logo
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">B. Bank & UPI Settlement Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.accountName || ''}
                onChange={(e) => handleChange('accountName', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifsc || ''}
                onChange={(e) => handleChange('ifsc', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.branch || ''}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">UPI ID / VPA</label>
              <input
                type="text"
                value={formData.upiId || ''}
                onChange={(e) => handleChange('upiId', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* C. Invoice Numbering & Declaration */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">C. Invoice Series & Document Legalities</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix || ''}
                onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Financial Year Format</label>
              <input
                type="text"
                value={formData.financialYear || ''}
                onChange={(e) => handleChange('financialYear', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Sequence Counter</label>
              <input
                type="number"
                value={formData.invoiceNextNumber || 1}
                onChange={(e) => handleChange('invoiceNextNumber', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Invoice Declaration</label>
            <textarea
              rows={2}
              value={formData.defaultDeclaration || ''}
              onChange={(e) => handleChange('defaultDeclaration', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Signature Upload */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Authorized Signatory Signature</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Digital signature for authorized box in Reference 2</span>
            </div>

            <div className="flex items-center gap-3">
              {formData.signatureUrl && (
                <img src={formData.signatureUrl} alt="Signature" className="h-8 max-w-[120px] object-contain border p-0.5 rounded bg-white" />
              )}
              <label className="cursor-pointer px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shadow-sm">
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">D. Invoice Template Visibility Rules</h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
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
              <label key={item.key} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={(formData as any)[item.key] ?? true}
                  onChange={(e) => handleChange(item.key as any, e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </form>

      {/* F. Admin Security */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">F. Admin Account Security</h2>
        </div>

        {passwordMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            passwordMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              {passwordSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Service / Item Add or Edit Modal */}
      {serviceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{editingService.id ? 'Edit Item / Service' : 'Add 3D Service or Product'}</span>
              </div>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              {serviceError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serviceError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3D Printing Service / Custom Key Chains"
                  value={editingService.name || ''}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Specifications
                </label>
                <input
                  type="text"
                  placeholder="e.g. FDM Additive manufacturing in PLA/PETG"
                  value={editingService.description || ''}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      HSN or SAC Code *
                    </label>
                    {editingService.hsnSac && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          detectHsnSacType(editingService.hsnSac) === 'SAC'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {detectHsnSacType(editingService.hsnSac) === 'SAC' ? 'SAC (Service)' : 'HSN (Goods)'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="settings-hsn-sac-datalist"
                    required
                    placeholder="e.g. 39169090 or 998920"
                    value={editingService.hsnSac || ''}
                    onChange={(e) => handleServiceHsnChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <datalist id="settings-hsn-sac-datalist">
                    {GST_CLASSIFICATIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        [{c.type}] {c.code} — {c.description} ({c.gstRate}%)
                      </option>
                    ))}
                  </datalist>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    99XXXX = SAC (Service), 39XXXX = HSN (Goods)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Unit
                  </label>
                  <input
                    type="text"
                    placeholder="Gram, Nos, Spool, Hour, Project"
                    value={editingService.unit || 'Nos'}
                    onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingService.defaultRate ?? 0}
                    onChange={(e) => setEditingService({ ...editingService, defaultRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default GST Rate (%)
                  </label>
                  <select
                    value={editingService.defaultGstRate ?? 18}
                    onChange={(e) => setEditingService({ ...editingService, defaultGstRate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value={18}>18% (Standard GST)</option>
                    <option value={12}>12% (Job work / notified)</option>
                    <option value={5}>5% (Special reduced)</option>
                    <option value={28}>28% (Luxury)</option>
                    <option value={0}>0% (Nil / Exempt)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  disabled={serviceSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={serviceSaving}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{serviceSaving ? 'Saving...' : 'Save Service / Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
