import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { numberToIndianWords } from './numberToWords.service.js';

function formatCurrency(val: number): string {
  return (val || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateVal?: Date | string | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const yr = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${yr}`;
}

export function compileInvoiceHtml(invoiceData: any, supplierSettings: any): string {
  const candidatePaths = [
    path.resolve(__dirname, '../templates/invoice.template.html'),
    path.resolve(__dirname, '../../src/templates/invoice.template.html'),
    path.resolve(process.cwd(), 'src/templates/invoice.template.html'),
    path.resolve(process.cwd(), 'server/src/templates/invoice.template.html'),
    path.resolve(process.cwd(), 'dist/templates/invoice.template.html'),
  ];

  let templatePath = '';
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      templatePath = p;
      break;
    }
  }

  if (!templatePath) {
    throw new Error('Invoice HTML template not found in candidate paths.');
  }

  let html = fs.readFileSync(templatePath, 'utf8');

  const customer = invoiceData.customer || {};
  let totalQty = 0;

  const items = (invoiceData.items || []).map((item: any) => {
    totalQty += Number(item.quantity) || 0;
    return {
      serialNumber: item.serialNumber,
      description: item.description,
      hsnSac: item.hsnSac || '-',
      quantity: item.quantity,
      unit: item.unit || 'Nos',
      rate: item.rate,
      formattedRate: formatCurrency(item.rate),
      taxableAmount: item.taxableAmount,
      formattedTaxable: formatCurrency(item.taxableAmount),
      gstRate: item.gstRate,
      formattedTotal: formatCurrency(item.totalAmount),
    };
  });

  const invoice = {
    invoiceNumber: invoiceData.invoiceNumber,
    formattedDate: formatDate(invoiceData.invoiceDate),
    deliveryNote: invoiceData.deliveryNote || '',
    paymentTerms: invoiceData.paymentTerms || '',
    supplierRef: invoiceData.supplierRef || '',
    otherRef: invoiceData.otherRef || '',
    buyersOrderNo: invoiceData.buyersOrderNo || '',
    formattedOrderDate: formatDate(invoiceData.orderDate),
    despatchDocNo: invoiceData.despatchDocNo || '',
    formattedDespatchDate: formatDate(invoiceData.despatchDate),
    despatchedThrough: invoiceData.despatchedThrough || '',
    destination: invoiceData.destination || '',
    placeOfSupply: invoiceData.placeOfSupply || customer.state || supplierSettings.state,
    termsOfDelivery: invoiceData.termsOfDelivery || '',

    hasDeliveryNoteOrPaymentTerms: !!(invoiceData.deliveryNote || invoiceData.paymentTerms),
    hasSupplierOrOtherRef: !!(invoiceData.supplierRef || invoiceData.otherRef),
    hasBuyersOrder: !!(invoiceData.buyersOrderNo || invoiceData.orderDate),
    hasDespatchDoc: !!(invoiceData.despatchDocNo || invoiceData.despatchDate),
    hasDespatchedThrough: !!(invoiceData.despatchedThrough || invoiceData.destination),

    isInterstate: invoiceData.isInterstate,
    totalQty,
    formattedSubtotal: formatCurrency(invoiceData.subtotal),
    formattedTaxableAmount: formatCurrency(invoiceData.taxableAmount),
    formattedCgst: formatCurrency(invoiceData.cgstAmount),
    formattedSgst: formatCurrency(invoiceData.sgstAmount),
    formattedIgst: formatCurrency(invoiceData.igstAmount),
    formattedTotalTax: formatCurrency(invoiceData.totalTaxAmount),
    formattedGrandTotal: formatCurrency(invoiceData.grandTotal),
    amountInWords: invoiceData.amountInWords || numberToIndianWords(invoiceData.grandTotal),
    taxAmountInWords: numberToIndianWords(invoiceData.totalTaxAmount),
  };

  const supplier = {
    companyName: supplierSettings.companyName || 'Cogniviz Technologies',
    logoUrl: supplierSettings.logoUrl || '',
    address: supplierSettings.address || '',
    gstin: supplierSettings.gstin || '',
    state: supplierSettings.state || 'Karnataka',
    stateCode: supplierSettings.stateCode || '29',
    email: supplierSettings.email || '',
    phone: supplierSettings.phone || '',
    website: supplierSettings.website || '',
    bankName: supplierSettings.bankName || '',
    accountName: supplierSettings.accountName || '',
    accountNumber: supplierSettings.accountNumber || '',
    ifsc: supplierSettings.ifsc || '',
    branch: supplierSettings.branch || '',
    upiId: supplierSettings.upiId || '',
    defaultDeclaration: supplierSettings.defaultDeclaration || '',
    invoiceFooter: supplierSettings.invoiceFooter || 'This is a Computer Generated Invoice',
    signatureUrl: supplierSettings.signatureUrl || '',
  };

  // Replace simple Handlebars style variables
  // 1. Supplier
  html = html.replace(/\{\{supplier\.companyName\}\}/g, supplier.companyName);
  html = html.replace(/\{\{supplier\.address\}\}/g, supplier.address);
  html = html.replace(/\{\{supplier\.gstin\}\}/g, supplier.gstin);
  html = html.replace(/\{\{supplier\.state\}\}/g, supplier.state);
  html = html.replace(/\{\{supplier\.stateCode\}\}/g, supplier.stateCode);
  html = html.replace(/\{\{supplier\.email\}\}/g, supplier.email);
  html = html.replace(/\{\{supplier\.phone\}\}/g, supplier.phone);
  html = html.replace(/\{\{supplier\.bankName\}\}/g, supplier.bankName);
  html = html.replace(/\{\{supplier\.accountName\}\}/g, supplier.accountName);
  html = html.replace(/\{\{supplier\.accountNumber\}\}/g, supplier.accountNumber);
  html = html.replace(/\{\{supplier\.ifsc\}\}/g, supplier.ifsc);
  html = html.replace(/\{\{supplier\.branch\}\}/g, supplier.branch);
  html = html.replace(/\{\{supplier\.upiId\}\}/g, supplier.upiId);
  html = html.replace(/\{\{supplier\.defaultDeclaration\}\}/g, supplier.defaultDeclaration);
  html = html.replace(/\{\{supplier\.invoiceFooter\}\}/g, supplier.invoiceFooter);

  if (supplier.logoUrl) {
    html = html.replace(/\{\{#if supplier\.logoUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, `$1`);
    html = html.replace(/\{\{supplier\.logoUrl\}\}/g, supplier.logoUrl);
  } else {
    html = html.replace(/\{\{#if supplier\.logoUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (supplier.signatureUrl) {
    html = html.replace(/\{\{#if supplier\.signatureUrl\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, `$1`);
    html = html.replace(/\{\{supplier\.signatureUrl\}\}/g, supplier.signatureUrl);
  } else {
    html = html.replace(/\{\{#if supplier\.signatureUrl\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, `$2`);
  }

  // 2. Customer
  html = html.replace(/\{\{customer\.name\}\}/g, customer.name || 'Walk-in Customer');
  html = html.replace(/\{\{customer\.billingAddress\}\}/g, customer.billingAddress || '-');
  html = html.replace(/\{\{customer\.state\}\}/g, customer.state || supplier.state);
  html = html.replace(/\{\{customer\.stateCode\}\}/g, customer.stateCode || supplier.stateCode);
  html = html.replace(/\{\{customer\.country\}\}/g, customer.country || 'India');

  if (customer.companyName) {
    html = html.replace(/\{\{#if customer\.companyName\}\}([\s\S]*?)\{\{\/if\}\}/g, `$1`);
    html = html.replace(/\{\{customer\.companyName\}\}/g, customer.companyName);
  } else {
    html = html.replace(/\{\{#if customer\.companyName\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  if (customer.gstin) {
    html = html.replace(/\{\{#if customer\.gstin\}\}([\s\S]*?)\{\{\/if\}\}/g, `$1`);
    html = html.replace(/\{\{customer\.gstin\}\}/g, customer.gstin);
  } else {
    html = html.replace(/\{\{#if customer\.gstin\}\}([\s\S]*?)\{\{\/if\}\}/g, '');
  }

  // 3. Invoice Metadata
  html = html.replace(/\{\{invoice\.invoiceNumber\}\}/g, invoice.invoiceNumber);
  html = html.replace(/\{\{invoice\.formattedDate\}\}/g, invoice.formattedDate);
  html = html.replace(/\{\{invoice\.placeOfSupply\}\}/g, invoice.placeOfSupply);
  html = html.replace(/\{\{invoice\.totalQty\}\}/g, String(invoice.totalQty));
  html = html.replace(/\{\{invoice\.formattedSubtotal\}\}/g, invoice.formattedSubtotal);
  html = html.replace(/\{\{invoice\.formattedGrandTotal\}\}/g, invoice.formattedGrandTotal);
  html = html.replace(/\{\{invoice\.amountInWords\}\}/g, invoice.amountInWords);
  html = html.replace(/\{\{invoice\.taxAmountInWords\}\}/g, invoice.taxAmountInWords);
  html = html.replace(/\{\{invoice\.formattedTaxableAmount\}\}/g, invoice.formattedTaxableAmount);
  html = html.replace(/\{\{invoice\.formattedTotalTax\}\}/g, invoice.formattedTotalTax);

  // Optional grid rows
  const handleOptionalBlock = (flag: boolean, tag: string) => {
    const reg = new RegExp(`\\{\\{#if invoice\\.${tag}\\}\\}([\\s\\S]*?)\\{\\{/if\\}\\}`, 'g');
    if (flag) {
      html = html.replace(reg, `$1`);
    } else {
      html = html.replace(reg, '');
    }
  };

  handleOptionalBlock(invoice.hasDeliveryNoteOrPaymentTerms, 'hasDeliveryNoteOrPaymentTerms');
  html = html.replace(/\{\{invoice\.deliveryNote\}\}/g, invoice.deliveryNote);
  html = html.replace(/\{\{invoice\.paymentTerms\}\}/g, invoice.paymentTerms);

  handleOptionalBlock(invoice.hasSupplierOrOtherRef, 'hasSupplierOrOtherRef');
  html = html.replace(/\{\{invoice\.supplierRef\}\}/g, invoice.supplierRef);
  html = html.replace(/\{\{invoice\.otherRef\}\}/g, invoice.otherRef);

  handleOptionalBlock(invoice.hasBuyersOrder, 'hasBuyersOrder');
  html = html.replace(/\{\{invoice\.buyersOrderNo\}\}/g, invoice.buyersOrderNo);
  html = html.replace(/\{\{invoice\.formattedOrderDate\}\}/g, invoice.formattedOrderDate);

  handleOptionalBlock(invoice.hasDespatchDoc, 'hasDespatchDoc');
  html = html.replace(/\{\{invoice\.despatchDocNo\}\}/g, invoice.despatchDocNo);
  html = html.replace(/\{\{invoice\.formattedDespatchDate\}\}/g, invoice.formattedDespatchDate);

  handleOptionalBlock(invoice.hasDespatchedThrough, 'hasDespatchedThrough');
  html = html.replace(/\{\{invoice\.despatchedThrough\}\}/g, invoice.despatchedThrough);
  html = html.replace(/\{\{invoice\.destination\}\}/g, invoice.destination);

  handleOptionalBlock(!!invoice.termsOfDelivery, 'termsOfDelivery');
  html = html.replace(/\{\{invoice\.termsOfDelivery\}\}/g, invoice.termsOfDelivery);

  // Interstate vs Intrastate in Tax Summary
  if (invoice.isInterstate) {
    html = html.replace(/\{\{#if invoice\.isInterstate\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, `$1`);
    html = html.replace(/\{\{invoice\.formattedIgst\}\}/g, invoice.formattedIgst);
  } else {
    html = html.replace(/\{\{#if invoice\.isInterstate\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, `$2`);
    html = html.replace(/\{\{invoice\.formattedCgst\}\}/g, invoice.formattedCgst);
    html = html.replace(/\{\{invoice\.formattedSgst\}\}/g, invoice.formattedSgst);
  }

  // 4. Items Table Rows
  const itemsHtml = items.map((it: any) => `
    <tr>
      <td class="col-sl">${it.serialNumber}</td>
      <td class="col-desc">
        <div class="item-desc-title">${it.description}</div>
      </td>
      <td class="col-hsn">${it.hsnSac}</td>
      <td class="col-qty">${it.quantity}</td>
      <td class="col-rate">${it.formattedRate}</td>
      <td class="col-unit">${it.unit}</td>
      <td class="col-taxable">${it.formattedTaxable}</td>
      <td class="col-gst">${it.gstRate}%</td>
      <td class="col-amount"><strong>${it.formattedTotal}</strong></td>
    </tr>
  `).join('');

  html = html.replace(/\{\{#each items\}\}[\s\S]*?\{\{\/each\}\}/, itemsHtml);

  return html;
}

function findChromePath(): string | null {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function generateInvoicePdf(
  invoiceData: any,
  supplierSettings: any
): Promise<{ buffer: Buffer; filePath: string }> {
  const html = compileInvoiceHtml(invoiceData, supplierSettings);

  const uploadsDir = path.resolve(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeNum = invoiceData.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_');
  const fileName = `Invoice_${safeNum}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Chrome/Chromium executable not found on host machine for PDF generation.');
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });

    fs.writeFileSync(filePath, pdfBuffer);
    return { buffer: Buffer.from(pdfBuffer), filePath };
  } finally {
    await browser.close();
  }
}
