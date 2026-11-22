import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Building,
  User,
  Package,
  Calculator,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Customer, InvoiceItem, ServiceItem } from '../types';
import { useSettings } from '../context/SettingsContext';
import { InvoicePreview } from '../components/invoices/InvoicePreview';
import { numberToIndianWords } from '../utils/numberToWords';
import { formatCurrency } from '../utils/formatters';
import {
  GST_CLASSIFICATIONS,
  getClassificationByCode,
  detectHsnSacType,
} from '../constants/gstClassifications';

export const CreateInvoice: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Invoice Metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [supplierRef, setSupplierRef] = useState('');
  const [otherRef, setOtherRef] = useState('');
  const [buyersOrderNo, setBuyersOrderNo] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [despatchDocNo, setDespatchDocNo] = useState('');
  const [despatchDate, setDespatchDate] = useState('');
  const [despatchedThrough, setDespatchedThrough] = useState('');
  const [destination, setDestination] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('Karnataka');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');

  // Interstate vs Intrastate tax toggle
  const [isInterstateOverride, setIsInterstateOverride] = useState<boolean | null>(null);

  // Apply GST Checkbox & Manual Percentage State
  const [applyGst, setApplyGst] = useState<boolean>(true);
  const [manualGstRate, setManualGstRate] = useState<number>(18);

  // Customer Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerCompany, setNewCustomerCompany] = useState('');
  const [newCustomerGstin, setNewCustomerGstin] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerState, setNewCustomerState] = useState('Karnataka');

  // Services Library
  const [servicesLibrary, setServicesLibrary] = useState<ServiceItem[]>([]);

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      serialNumber: 1,
      description: '3D Printing Service - Standard FDM Additive Manufacturing',
      hsnSac: '998898',
      quantity: 100,
      unit: 'Gram',
      rate: 15,
      taxableAmount: 1500,
      gstRate: 18,
      totalAmount: 1770,
    },
  ]);

  // Adjustments
  const [discount, setDiscount] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // UI States
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load next invoice number, customers, and services library on mount
  useEffect(() => {
    // 1. Next invoice number
    api.get('/invoices/next-number')
      .then(res => setInvoiceNumber(res.data.invoiceNumber))
      .catch(err => console.error(err));

    // 2. Customers
    api.get('/customers')
      .then(res => {
        const list = res.data || [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomerId(prev => prev || list[0].id);
        } else {
          setIsNewCustomer(true);
        }
      })
      .catch(err => console.error(err));

    // 3. Services library
    api.get('/services')
      .then(res => setServicesLibrary(res.data))
      .catch(err => console.error(err));
  }, []);

  // When customer is selected, auto-populate place of supply
  useEffect(() => {
    if (selectedCustomerId) {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found && found.state) {
        setPlaceOfSupply(found.state);
      }
    }
  }, [selectedCustomerId, customers]);

  // Resolve active customer for preview
  const activeCustomer: Partial<Customer> = isNewCustomer
    ? {
        name: newCustomerName || 'New Client',
        companyName: newCustomerCompany,
        gstin: newCustomerGstin,
        email: newCustomerEmail,
        phone: newCustomerPhone,
        billingAddress: newCustomerAddress,
        state: newCustomerState,
        country: 'India',
      }
    : customers.find(c => c.id === selectedCustomerId) || {
        name: 'Select a Customer',
        state: settings?.state || 'Karnataka',
        country: 'India',
      };

  // Determine interstate
  const isInterstate = isInterstateOverride !== null
    ? isInterstateOverride
    : (settings?.state || 'Karnataka').trim().toLowerCase() !== (placeOfSupply || 'Karnataka').trim().toLowerCase();

  // Financial Calculations
  const calculatedItems = items.map((it, idx) => {
    const qty = Number(it.quantity) || 0;
    const rate = Number(it.rate) || 0;
    const effectiveGstRate = applyGst ? (Number(it.gstRate) || 0) : 0;

    const itemTaxable = Math.round((qty * rate) * 100) / 100;
    const taxAmt = Math.round(((itemTaxable * effectiveGstRate) / 100) * 100) / 100;
    const total = Math.round((itemTaxable + taxAmt) * 100) / 100;

    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (applyGst && effectiveGstRate > 0) {
      if (isInterstate) {
        igstRate = effectiveGstRate;
        igstAmount = taxAmt;
      } else {
        cgstRate = effectiveGstRate / 2;
        sgstRate = effectiveGstRate / 2;
        cgstAmount = Math.round((taxAmt / 2) * 100) / 100;
        sgstAmount = Math.round((taxAmt / 2) * 100) / 100;
      }
    }

    return {
      ...it,
      serialNumber: idx + 1,
      gstRate: applyGst ? (Number(it.gstRate) || 0) : 0,
      taxableAmount: itemTaxable,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount: total,
    };
  });

  const subtotal = calculatedItems.reduce((sum, it) => sum + it.taxableAmount, 0);
  const taxableAmount = Math.max(0, subtotal - Number(discount || 0));
  const totalCgst = (applyGst && !isInterstate) ? calculatedItems.reduce((sum, it) => sum + (it.cgstAmount || 0), 0) : 0;
  const totalSgst = (applyGst && !isInterstate) ? calculatedItems.reduce((sum, it) => sum + (it.sgstAmount || 0), 0) : 0;
  const totalIgst = (applyGst && isInterstate) ? calculatedItems.reduce((sum, it) => sum + (it.igstAmount || 0), 0) : 0;
  const totalTaxAmount = applyGst ? (isInterstate ? totalIgst : totalCgst + totalSgst) : 0;
  const rawGrandTotal = taxableAmount + totalTaxAmount + Number(otherCharges || 0);
  const grandTotal = Math.round(rawGrandTotal);
  const amountInWords = numberToIndianWords(grandTotal);

  // Item Table handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    if (field === 'hsnSac') {
      const code = String(value || '');
      const matched = getClassificationByCode(code);
      if (matched) {
        // Automatically populate corresponding GST rate when standard classification is selected
        updated[index] = {
          ...updated[index],
          hsnSac: code,
          gstRate: applyGst ? matched.gstRate : 0,
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        serialNumber: items.length + 1,
        description: '',
        hsnSac: '',
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        taxableAmount: 0,
        gstRate: applyGst ? manualGstRate : 0,
        totalAmount: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectServiceFromLibrary = (index: number, serviceId: string) => {
    const service = servicesLibrary.find(s => s.id === serviceId);
    if (!service) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      description: service.name + (service.description ? ` - ${service.description}` : ''),
      hsnSac: service.hsnSac || '',
      rate: service.defaultRate,
      unit: service.unit,
      gstRate: applyGst ? (service.defaultGstRate ?? manualGstRate) : 0,
    };
    setItems(updated);
  };

  // Submission handler
  const handleSaveInvoice = async (status: 'DRAFT' | 'ISSUED') => {
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isNewCustomer && !selectedCustomerId) {
      setError('Please select an existing customer or click "+ New Customer" above to enter client details.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isNewCustomer && (!newCustomerName || !newCustomerName.trim())) {
      setError('Please enter the customer / client name.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (items.some(it => !it.description.trim())) {
      setError('Please provide a description for all line items.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        status,
        applyGst,
        deliveryNote: deliveryNote.trim() || undefined,
        paymentTerms: paymentTerms.trim() || undefined,
        supplierRef: supplierRef.trim() || undefined,
        otherRef: otherRef.trim() || undefined,
        buyersOrderNo: buyersOrderNo.trim() || undefined,
        orderDate: orderDate || undefined,
        despatchDocNo: despatchDocNo.trim() || undefined,
        despatchDate: despatchDate || undefined,
        despatchedThrough: despatchedThrough.trim() || undefined,
        destination: destination.trim() || undefined,
        placeOfSupply: placeOfSupply.trim() || undefined,
        termsOfDelivery: termsOfDelivery.trim() || undefined,
        isInterstateOverride: isInterstateOverride !== null ? isInterstateOverride : undefined,
        discount: Number(discount) || 0,
        otherCharges: Number(otherCharges) || 0,
        notes: notes.trim() || undefined,
        items: calculatedItems.map(it => ({
          description: it.description,
          hsnSac: it.hsnSac,
          quantity: it.quantity,
          unit: it.unit,
          rate: it.rate,
          gstRate: it.gstRate,
        })),
      };

      if (isNewCustomer) {
        payload.newCustomer = {
          name: newCustomerName.trim(),
          companyName: newCustomerCompany.trim() || undefined,
          gstin: newCustomerGstin.trim() || undefined,
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
          billingAddress: newCustomerAddress.trim() || undefined,
          state: newCustomerState.trim() || undefined,
        };
      } else {
        payload.customerId = selectedCustomerId;
      }

      const res = await api.post('/invoices', payload);
      navigate(`/invoices/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate invoice. Please review all fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Tax Invoice</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Two-column editor with instant Indian GST calculation and live PDF preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveInvoice('DRAFT')}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveInvoice('ISSUED')}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Issuing...' : 'Generate Invoice'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-Column Grid: Left = Form, Right = Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 Columns */}
        <div className="xl:col-span-7 space-y-6">
          {/* SECTION A: Supplier Info Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Supplier (Configured in Settings)</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Edit in Settings
              </button>
            </div>

            <div className="text-xs grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Business Name</span>
                <span className="font-semibold text-slate-900">{settings?.companyName}</span>
                <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
                  {settings?.tagline || '"AI TO SIMPLIFY, TECH TO AMPLIFY"'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">GSTIN</span>
                <span className="font-mono font-medium text-slate-900">{settings?.gstin}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Supplier Address</span>
                <span className="font-medium text-slate-800">{settings?.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">State of Supply</span>
                <span className="font-medium text-slate-800">{settings?.state} ({settings?.stateCode})</span>
              </div>
            </div>
          </div>

          {/* SECTION B: Buyer Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <User className="w-4 h-4 text-blue-600" />
                <span>Buyer / Customer Details</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    !isNewCustomer ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isNewCustomer ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  + New Customer
                </button>
              </div>
            </div>

            {!isNewCustomer ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Registered Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className={`w-full px-3.5 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 bg-white ${
                    !selectedCustomerId
                      ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/20'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.companyName ? `(${c.companyName})` : ''} - {c.state || 'India'}
                    </option>
                  ))}
                </select>
                {!selectedCustomerId && (
                  <p className="text-[11px] text-amber-600 mt-1.5 font-medium flex items-center gap-1">
                    <span>⚠️ Select a customer from the dropdown, or click <strong>"+ New Customer"</strong> above.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer / Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCustomerCompany}
                      onChange={(e) => setNewCustomerCompany(e.target.value)}
                      placeholder="e.g. TechCorp Solutions"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={newCustomerGstin}
                      onChange={(e) => setNewCustomerGstin(e.target.value)}
                      placeholder="29ABCDE1234F1Z5"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomerEmail}
                      onChange={(e) => setNewCustomerEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing Address
                    </label>
                    <input
                      type="text"
                      value={newCustomerAddress}
                      onChange={(e) => setNewCustomerAddress(e.target.value)}
                      placeholder="Street, City, Pincode"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer State
                    </label>
                    <input
                      type="text"
                      value={newCustomerState}
                      onChange={(e) => {
                        setNewCustomerState(e.target.value);
                        setPlaceOfSupply(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: Structured Invoice Information (Reference 2 Grid Fields) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Invoice Information & Transport Metadata
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Optional Ref 2 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Delivery Note (Optional)
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="e.g. DN-1042"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Mode / Terms of Payment
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="e.g. 100% Advance / Net 30"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Supplier's Ref.
                </label>
                <input
                  type="text"
                  value={supplierRef}
                  onChange={(e) => setSupplierRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Other Reference(s)
                </label>
                <input
                  type="text"
                  value={otherRef}
                  onChange={(e) => setOtherRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Buyer's Order No.
                </label>
                <input
                  type="text"
                  value={buyersOrderNo}
                  onChange={(e) => setBuyersOrderNo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Despatch Document No.
                </label>
                <input
                  type="text"
                  value={despatchDocNo}
                  onChange={(e) => setDespatchDocNo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Despatched through / Destination
                </label>
                <input
                  type="text"
                  value={despatchedThrough}
                  onChange={(e) => setDespatchedThrough(e.target.value)}
                  placeholder="e.g. Courier / Bengaluru"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* APPLY GST CHECKBOX & MANUAL PERCENTAGE (WITH / WITHOUT GST) */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyGst}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setApplyGst(enabled);
                      if (enabled) {
                        setItems(items.map(it => ({ ...it, gstRate: manualGstRate || 18 })));
                      } else {
                        setItems(items.map(it => ({ ...it, gstRate: 0 })));
                      }
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Apply GST to this Invoice
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        applyGst
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {applyGst ? 'Tax Invoice (With GST)' : 'Non-GST Bill (Without GST)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {applyGst
                        ? 'CGST/SGST or IGST calculated from manual GST %.'
                        : 'Bill without GST. Zero taxes applied (₹0.00).'}
                    </p>
                  </div>
                </label>

                {applyGst && (
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200/90 shadow-sm shrink-0">
                    <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                      Manual GST %:
                    </span>
                    <div className="relative w-16">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={manualGstRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setManualGstRate(val);
                          setItems(items.map(it => ({ ...it, gstRate: val })));
                        }}
                        className="w-full pl-2 pr-5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="18"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                        %
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => {
                            setManualGstRate(rate);
                            setItems(items.map(it => ({ ...it, gstRate: rate })));
                          }}
                          className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition-all ${
                            manualGstRate === rate
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Place of Supply & Tax Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place of Supply *
                </label>
                <input
                  type="text"
                  required
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST Tax Treatment
                </label>
                {applyGst ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isInterstate ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST + SGST)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsInterstateOverride(!isInterstate)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Toggle Override
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Non-GST (No Tax Applied)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION D & E: Line Items & Reusable Services Library */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Invoice Items & Services</span>
              </div>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>

                    {/* Quick Pick from Services Library */}
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                      <select
                        onChange={(e) => handleSelectServiceFromLibrary(idx, e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="">⚡ Pick 3D Service / Product Library...</option>
                        {servicesLibrary.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} • {s.hsnSac ? `[${s.hsnSac.startsWith('99') ? 'SAC' : 'HSN'}: ${s.hsnSac}]` : ''} (₹{s.defaultRate}/{s.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Description of goods or services *"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[10px] text-slate-500 font-medium">HSN/SAC</label>
                        {item.hsnSac && (
                          <span
                            className={`text-[9px] font-bold px-1 rounded ${
                              detectHsnSacType(item.hsnSac) === 'SAC'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}
                          >
                            {detectHsnSacType(item.hsnSac) === 'SAC' ? 'SAC (Service)' : 'HSN (Goods)'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        list="hsn-sac-datalist"
                        placeholder="e.g. 39169090 or 998920"
                        value={item.hsnSac || ''}
                        onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Unit</label>
                      <input
                        type="text"
                        placeholder="Nos/Month"
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Selling Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono font-bold text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5 font-medium">
                        {applyGst ? 'GST Rate (%)' : 'GST Status'}
                      </label>
                      {applyGst ? (
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                            placeholder="18"
                            className="w-full pl-2 pr-5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold pointer-events-none">
                            %
                          </span>
                        </div>
                      ) : (
                        <div className="py-1 px-1.5 text-[11px] text-center text-slate-400 bg-slate-100 rounded-lg font-semibold border border-slate-200/60">
                          0% (w/o GST)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Datalist for standard HSN/SAC classifications */}
            <datalist id="hsn-sac-datalist">
              {GST_CLASSIFICATIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  [{c.type}] {c.code} — {c.description} ({c.gstRate}%)
                </option>
              ))}
            </datalist>
          </div>

          {/* SECTION F: Summary Adjustments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block border-b border-slate-100 pb-2">
              Discount & Adjustments
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Other Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Notes / Terms
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Payment due within 15 days from issue date."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="text-xs text-slate-500">
              Total Amount:{' '}
              <span className="font-bold font-mono text-slate-900 text-sm">
                ₹{formatCurrency(grandTotal)}
              </span>
              {applyGst && (
                <span className="text-[11px] text-blue-600 ml-1.5 font-medium">
                  (Tax Invoice)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSaveInvoice('DRAFT')}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveInvoice('ISSUED')}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Issuing...' : 'Generate Invoice'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Invoice Preview matching Reference Image 2 (5 Columns) */}
        <div className="xl:col-span-5 space-y-3 sticky top-20">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Live Tax Invoice Preview</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Updates in real-time</span>
          </div>

          <div className="overflow-x-auto rounded-xl">
            <InvoicePreview
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              supplier={settings}
              customer={activeCustomer}
              items={calculatedItems}
              deliveryNote={deliveryNote}
              paymentTerms={paymentTerms}
              supplierRef={supplierRef}
              otherRef={otherRef}
              buyersOrderNo={buyersOrderNo}
              orderDate={orderDate}
              despatchDocNo={despatchDocNo}
              despatchDate={despatchDate}
              despatchedThrough={despatchedThrough}
              destination={destination}
              placeOfSupply={placeOfSupply}
              termsOfDelivery={termsOfDelivery}
              isInterstate={isInterstate}
              applyGst={applyGst}
              subtotal={subtotal}
              taxableAmount={taxableAmount}
              cgstAmount={totalCgst}
              sgstAmount={totalSgst}
              igstAmount={totalIgst}
              totalTaxAmount={totalTaxAmount}
              grandTotal={grandTotal}
              amountInWords={amountInWords}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

