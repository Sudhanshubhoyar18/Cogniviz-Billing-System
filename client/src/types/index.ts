export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  tagline?: string;
  logoUrl?: string | null;
  address: string;
  gstin: string;
  state: string;
  stateCode: string;
  country: string;
  email: string;
  phone: string;
  website: string;

  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;

  invoicePrefix: string;
  invoiceNextNumber: number;
  financialYear: string;
  defaultCurrency: string;
  currencySymbol: string;
  defaultDeclaration: string;
  invoiceFooter: string;
  signatureUrl?: string | null;
  stampUrl?: string | null;

  showDeliveryNote: boolean;
  showModeOfPayment: boolean;
  showSupplierRef: boolean;
  showOtherRef: boolean;
  showBuyersOrder: boolean;
  showDespatchDoc: boolean;
  showDespatchedThrough: boolean;
  showDestination: boolean;
  showTermsOfDelivery: boolean;
}

export interface Customer {
  id: string;
  customerCode?: string;
  name: string;
  companyName?: string | null;
  gstin?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  billingAddress?: string | null;
  state?: string | null;
  stateCode?: string | null;
  country?: string;
  notes?: string | null;
  isArchived: boolean;
  totalInvoices?: number;
  totalBilled?: number;
  totalReceived?: number;
  outstandingBalance?: number;
  createdAt: string;
}

export interface InvoiceItem {
  id?: string;
  serialNumber: number;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit: string;
  rate: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: 'DRAFT' | 'ISSUED' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  customerId?: string | null;
  customer?: Customer | null;
  customerSnapshot?: string | null;
  supplierSnapshot?: string | null;

  deliveryNote?: string | null;
  paymentTerms?: string | null;
  supplierRef?: string | null;
  otherRef?: string | null;
  buyersOrderNo?: string | null;
  orderDate?: string | null;
  despatchDocNo?: string | null;
  despatchDate?: string | null;
  despatchedThrough?: string | null;
  destination?: string | null;
  placeOfSupply?: string | null;
  termsOfDelivery?: string | null;
  isInterstate: boolean;

  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  otherCharges: number;
  roundOff: number;
  grandTotal: number;
  amountInWords?: string | null;

  amountReceived: number;
  outstandingBalance: number;

  pdfUrl?: string | null;
  emailStatus: string;
  emailSentAt?: string | null;
  whatsappShareCount: number;
  notes?: string | null;
  termsAndConditions?: string | null;

  createdAt: string;
  updatedAt: string;

  items: InvoiceItem[];
  payments?: Payment[];
  auditLogs?: AuditLog[];
  communications?: Communication[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  transactionRef?: string | null;
  notes?: string | null;
  receiptNumber?: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    status: string;
  };
  customer?: {
    id: string;
    name: string;
    companyName?: string | null;
  };
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  hsnSac?: string | null;
  defaultRate: number;
  unit: string;
  defaultGstRate: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string | null;
  performedBy: string;
  createdAt: string;
}

export interface Communication {
  id: string;
  type: string;
  recipient: string;
  status: string;
  subject?: string | null;
  message?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  cards: {
    totalInvoices: number;
    totalSales: number;
    revenueReceived: number;
    outstandingAmount: number;
    totalCustomers: number;
    monthlySales: number;
  };
  revenueOverview: Array<{
    month: string;
    sales: number;
    collections: number;
  }>;
  statusCounts: {
    PAID: number;
    PARTIALLY_PAID: number;
    PENDING: number;
    DRAFT: number;
    OVERDUE: number;
    CANCELLED: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    invoiceDate: string;
    amount: number;
    status: string;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalBilled: number;
    totalPaid: number;
  }>;
}

