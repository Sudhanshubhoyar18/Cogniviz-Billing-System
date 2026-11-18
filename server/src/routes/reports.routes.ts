import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// General Reporting Aggregate
router.get('/summary', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate as string);
    if (toDate) dateFilter.lte = new Date(toDate as string);

    const where: any = { status: { not: 'CANCELLED' } };
    if (fromDate || toDate) where.invoiceDate = dateFilter;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true, customer: true, payments: true },
      orderBy: { invoiceDate: 'desc' },
    });

    const payments = await prisma.payment.findMany({
      where: fromDate || toDate ? { paymentDate: dateFilter } : {},
      include: { customer: true, invoice: true },
    });

    // 1. Sales Report Metrics
    const totalInvoices = invoices.length;
    const totalTaxableSales = invoices.reduce((sum, i) => sum + i.taxableAmount, 0);
    const totalGst = invoices.reduce((sum, i) => sum + i.totalTaxAmount, 0);
    const totalInvoiceValue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);

    // 2. Payment Report Metrics
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.outstandingBalance, 0);
    const partiallyPaidCount = invoices.filter(i => i.status === 'PARTIALLY_PAID').length;
    const fullyPaidCount = invoices.filter(i => i.status === 'PAID').length;

    // 3. GST Breakdown by Slab (0%, 5%, 12%, 18%, 28%)
    const gstSlabs: { [rate: number]: { rate: number; taxable: number; cgst: number; sgst: number; igst: number; totalTax: number } } = {
      0: { rate: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      5: { rate: 5, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      12: { rate: 12, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      18: { rate: 18, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
      28: { rate: 28, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 },
    };

    invoices.forEach(inv => {
      inv.items.forEach(it => {
        const rate = Math.round(it.gstRate);
        if (!gstSlabs[rate]) {
          gstSlabs[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
        }
        gstSlabs[rate].taxable += it.taxableAmount;
        gstSlabs[rate].cgst += it.cgstAmount;
        gstSlabs[rate].sgst += it.sgstAmount;
        gstSlabs[rate].igst += it.igstAmount;
        gstSlabs[rate].totalTax += (it.cgstAmount + it.sgstAmount + it.igstAmount);
      });
    });

    // 4. Customer Breakdown
    const customerMap: { [id: string]: { id: string; name: string; billed: number; received: number; outstanding: number; invoiceCount: number } } = {};
    invoices.forEach(inv => {
      const cid = inv.customerId || 'walkin';
      const cname = inv.customer?.companyName || inv.customer?.name || 'Walk-in';
      if (!customerMap[cid]) {
        customerMap[cid] = { id: cid, name: cname, billed: 0, received: 0, outstanding: 0, invoiceCount: 0 };
      }
      customerMap[cid].billed += inv.grandTotal;
      customerMap[cid].received += inv.amountReceived;
      customerMap[cid].outstanding += inv.outstandingBalance;
      customerMap[cid].invoiceCount += 1;
    });

    return res.json({
      sales: {
        totalInvoices,
        totalTaxableSales: Math.round(totalTaxableSales),
        totalGst: Math.round(totalGst),
        totalInvoiceValue: Math.round(totalInvoiceValue),
      },
      payments: {
        totalCollected: Math.round(totalCollected),
        totalOutstanding: Math.round(totalOutstanding),
        partiallyPaidCount,
        fullyPaidCount,
      },
      gstBreakdown: Object.values(gstSlabs).filter(s => s.taxable > 0 || s.rate === 18),
      customerBreakdown: Object.values(customerMap).sort((a, b) => b.billed - a.billed),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});

// Export CSV for any category
router.get('/export-csv', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type = 'invoices' } = req.query;

    if (type === 'invoices') {
      const invoices = await prisma.invoice.findMany({
        include: { customer: true },
        orderBy: { invoiceDate: 'desc' },
      });

      let csv = 'Invoice Number,Date,Customer,GSTIN,Status,Taxable Amount,CGST,SGST,IGST,Total Tax,Grand Total,Received,Outstanding\n';
      invoices.forEach(i => {
        const cName = (i.customer?.companyName || i.customer?.name || '').replace(/,/g, ' ');
        const dateStr = new Date(i.invoiceDate).toISOString().split('T')[0];
        csv += `"${i.invoiceNumber}",${dateStr},"${cName}","${i.customer?.gstin || ''}",${i.status},${i.taxableAmount},${i.cgstAmount},${i.sgstAmount},${i.igstAmount},${i.totalTaxAmount},${i.grandTotal},${i.amountReceived},${i.outstandingBalance}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="invoices_report.csv"');
      return res.send(csv);
    }

    if (type === 'payments') {
      const payments = await prisma.payment.findMany({
        include: { customer: true, invoice: true },
        orderBy: { paymentDate: 'desc' },
      });

      let csv = 'Receipt No,Date,Invoice Number,Customer,Payment Method,Amount,Reference,Notes\n';
      payments.forEach(p => {
        const cName = (p.customer?.companyName || p.customer?.name || '').replace(/,/g, ' ');
        const dateStr = new Date(p.paymentDate).toISOString().split('T')[0];
        csv += `"${p.receiptNumber || ''}",${dateStr},"${p.invoice?.invoiceNumber || ''}","${cName}",${p.paymentMethod},${p.amount},"${p.transactionRef || ''}","${(p.notes || '').replace(/,/g, ' ')}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payments_report.csv"');
      return res.send(csv);
    }

    return res.status(400).json({ error: 'Unsupported export type' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to export CSV' });
  }
});

export default router;

