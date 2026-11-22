import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { calculateInvoiceTotals, isInterstateTransaction } from '../services/gst.service.js';
import { numberToIndianWords } from '../services/numberToWords.service.js';
import { compileInvoiceHtml, generateInvoicePdf } from '../services/pdf.service.js';
import { sendInvoiceEmail } from '../services/email.service.js';
import { config } from '../config.js';

const router = Router();

// Next Suggested Invoice Number
router.get('/next-number', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = settings?.invoicePrefix || 'INV';
    const fy = settings?.financialYear || '2026-27';
    let nextNum = settings?.invoiceNextNumber || 1;

    let proposedNumber = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
    let exists = await prisma.invoice.findUnique({ where: { invoiceNumber: proposedNumber } });

    while (exists) {
      nextNum += 1;
      proposedNumber = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
      exists = await prisma.invoice.findUnique({ where: { invoiceNumber: proposedNumber } });
    }

    return res.json({
      invoiceNumber: proposedNumber,
      prefix,
      financialYear: fy,
      sequence: nextNum,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to determine next invoice number' });
  }
});

// List All Invoices
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, customerId, fromDate, toDate } = req.query;

    const where: any = {};

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (customerId && typeof customerId === 'string') {
      where.customerId = customerId;
    }

    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) where.invoiceDate.gte = new Date(fromDate as string);
      if (toDate) where.invoiceDate.lte = new Date(toDate as string);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { customer: { companyName: { contains: q } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, companyName: true, email: true, phone: true },
        },
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return res.json(invoices);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch invoices' });
  }
});

// Create Invoice
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      status = 'DRAFT',
      customerId,
      newCustomer,
      deliveryNote,
      paymentTerms,
      supplierRef,
      otherRef,
      buyersOrderNo,
      orderDate,
      despatchDocNo,
      despatchDate,
      despatchedThrough,
      destination,
      placeOfSupply,
      termsOfDelivery,
      isInterstateOverride,
      discount = 0,
      otherCharges = 0,
      items = [],
      notes,
      termsAndConditions,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one invoice item/service is required.' });
    }

    let settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'default',
          companyName: 'Cogniviz Technologies',
          tagline: '"AI TO SIMPLIFY, TECH TO AMPLIFY"',
          gstin: '27ABCDE1234F1Z5',
          address: 'Gurunanak Pura, Nagpur',
          state: 'Maharashtra',
          stateCode: '27',
          country: 'India',
          email: 'contact.cogniviz@gmail.com',
          phone: '+91-9373879915',
        },
      });
    }

    let finalCustomerId = customerId;
    let customerRecord = null;

    if (customerId) {
      customerRecord = await prisma.customer.findUnique({ where: { id: customerId } });
    } else if (newCustomer && newCustomer.name) {
      const count = await prisma.customer.count();
      customerRecord = await prisma.customer.create({
        data: {
          customerCode: `CUST-${String(count + 1).padStart(3, '0')}`,
          name: newCustomer.name.trim(),
          companyName: newCustomer.companyName?.trim() || null,
          gstin: newCustomer.gstin?.trim() || null,
          email: newCustomer.email?.trim() || null,
          phone: newCustomer.phone?.trim() || null,
          whatsapp: newCustomer.whatsapp?.trim() || newCustomer.phone?.trim() || null,
          billingAddress: newCustomer.billingAddress?.trim() || null,
          state: newCustomer.state?.trim() || null,
          stateCode: newCustomer.stateCode?.trim() || null,
          country: newCustomer.country?.trim() || 'India',
        },
      });
      finalCustomerId = customerRecord.id;
    }

    const shouldApplyGst = req.body.applyGst !== false;
    const processedItems = items.map((it: any) => ({
      ...it,
      gstRate: shouldApplyGst ? (Number(it.gstRate) || 0) : 0,
    }));

    const targetPlaceOfSupply = placeOfSupply || customerRecord?.state || settings.state;
    const isInterstate = isInterstateOverride !== undefined
      ? Boolean(isInterstateOverride)
      : isInterstateTransaction(settings.state, targetPlaceOfSupply);

    const calc = calculateInvoiceTotals(processedItems, isInterstate, discount, otherCharges);
    const words = numberToIndianWords(calc.grandTotal);

    let finalInvoiceNumber = (invoiceNumber || '').trim();
    if (!finalInvoiceNumber) {
      const prefix = settings.invoicePrefix || 'INV';
      const fy = settings.financialYear || '2026-27';
      let nextNum = settings.invoiceNextNumber || 1;
      let candidate = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
      while (await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } })) {
        nextNum += 1;
        candidate = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
      }
      finalInvoiceNumber = candidate;
    } else {
      let existing = await prisma.invoice.findUnique({ where: { invoiceNumber: finalInvoiceNumber } });
      if (existing) {
        const prefix = settings.invoicePrefix || 'INV';
        const fy = settings.financialYear || '2026-27';
        let nextNum = (settings.invoiceNextNumber || 1);
        let candidate = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
        while (await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } })) {
          nextNum += 1;
          candidate = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;
        }
        finalInvoiceNumber = candidate;
      }
    }

    const customerSnapshot = customerRecord ? JSON.stringify(customerRecord) : null;
    const supplierSnapshot = JSON.stringify(settings);

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: finalInvoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        status: status === 'ISSUED' ? 'PENDING' : 'DRAFT',
        customerId: finalCustomerId,
        customerSnapshot,
        supplierSnapshot,
        deliveryNote,
        paymentTerms,
        supplierRef,
        otherRef,
        buyersOrderNo,
        orderDate: orderDate ? new Date(orderDate) : null,
        despatchDocNo,
        despatchDate: despatchDate ? new Date(despatchDate) : null,
        despatchedThrough,
        destination,
        placeOfSupply: targetPlaceOfSupply,
        termsOfDelivery,
        isInterstate,
        subtotal: calc.subtotal,
        discount: calc.discount,
        taxableAmount: calc.taxableAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        totalTaxAmount: calc.totalTaxAmount,
        otherCharges: calc.otherCharges,
        roundOff: calc.roundOff,
        grandTotal: calc.grandTotal,
        amountInWords: words,
        amountReceived: 0,
        outstandingBalance: calc.grandTotal,
        notes,
        termsAndConditions,
        items: {
          create: calc.items.map(it => ({
            serialNumber: it.serialNumber,
            description: it.description,
            hsnSac: it.hsnSac,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            cgstRate: it.cgstRate,
            sgstRate: it.sgstRate,
            igstRate: it.igstRate,
            cgstAmount: it.cgstAmount,
            sgstAmount: it.sgstAmount,
            igstAmount: it.igstAmount,
            totalAmount: it.totalAmount,
          })),
        },
        auditLogs: {
          create: {
            action: status === 'ISSUED' ? 'ISSUED' : 'CREATED',
            details: `Invoice created with total ₹${calc.grandTotal}`,
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    await prisma.companySettings.update({
      where: { id: 'default' },
      data: { invoiceNextNumber: { increment: 1 } },
    });

    if (status === 'ISSUED') {
      // Generate in background without delaying response
      generateInvoicePdf(newInvoice, settings).catch((pdfErr) => {
        console.warn('Background PDF generation deferred:', pdfErr?.message || pdfErr);
      });
    }

    return res.status(201).json(newInvoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

// Get Single Invoice
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        communications: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    return res.json(invoice);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch invoice' });
  }
});

// Update Draft Invoice
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft invoices can be edited directly. For issued invoices, use the cancellation workflow.' });
    }

    const {
      customerId,
      deliveryNote,
      paymentTerms,
      supplierRef,
      otherRef,
      buyersOrderNo,
      orderDate,
      despatchDocNo,
      despatchDate,
      despatchedThrough,
      destination,
      placeOfSupply,
      termsOfDelivery,
      isInterstateOverride,
      discount = 0,
      otherCharges = 0,
      items = [],
      notes,
      termsAndConditions,
    } = req.body;

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const targetPlaceOfSupply = placeOfSupply || invoice.placeOfSupply || settings?.state;
    const isInterstate = isInterstateOverride !== undefined
      ? Boolean(isInterstateOverride)
      : isInterstateTransaction(settings?.state, targetPlaceOfSupply);

    const calc = calculateInvoiceTotals(items, isInterstate, discount, otherCharges);
    const words = numberToIndianWords(calc.grandTotal);

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        customerId,
        deliveryNote,
        paymentTerms,
        supplierRef,
        otherRef,
        buyersOrderNo,
        orderDate: orderDate ? new Date(orderDate) : null,
        despatchDocNo,
        despatchDate: despatchDate ? new Date(despatchDate) : null,
        despatchedThrough,
        destination,
        placeOfSupply: targetPlaceOfSupply,
        termsOfDelivery,
        isInterstate,
        subtotal: calc.subtotal,
        discount: calc.discount,
        taxableAmount: calc.taxableAmount,
        cgstAmount: calc.cgstAmount,
        sgstAmount: calc.sgstAmount,
        igstAmount: calc.igstAmount,
        totalTaxAmount: calc.totalTaxAmount,
        otherCharges: calc.otherCharges,
        roundOff: calc.roundOff,
        grandTotal: calc.grandTotal,
        amountInWords: words,
        outstandingBalance: calc.grandTotal - invoice.amountReceived,
        notes,
        termsAndConditions,
        items: {
          create: calc.items.map(it => ({
            serialNumber: it.serialNumber,
            description: it.description,
            hsnSac: it.hsnSac,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            cgstRate: it.cgstRate,
            sgstRate: it.sgstRate,
            igstRate: it.igstRate,
            cgstAmount: it.cgstAmount,
            sgstAmount: it.sgstAmount,
            igstAmount: it.igstAmount,
            totalAmount: it.totalAmount,
          })),
        },
        auditLogs: {
          create: {
            action: 'UPDATED',
            details: `Draft invoice updated with total ₹${calc.grandTotal}`,
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
      include: { items: true, customer: true },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update invoice' });
  }
});

// Issue Draft Invoice
router.post('/:id/issue', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Invoice is already issued.' });
    }

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

    const issued = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.amountReceived >= invoice.grandTotal ? 'PAID' : 'PENDING',
        customerSnapshot: invoice.customer ? JSON.stringify(invoice.customer) : null,
        supplierSnapshot: JSON.stringify(settings),
        auditLogs: {
          create: {
            action: 'ISSUED',
            details: 'Draft invoice finalized and officially issued.',
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
      include: { items: true, customer: true },
    });

    // Generate in background without delaying issue response
    generateInvoicePdf(issued, settings).catch((e) => {
      console.warn('PDF generation deferred on issue:', e?.message || e);
    });

    return res.json(issued);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to issue invoice' });
  }
});

// Cancel Issued Invoice
router.post('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const { reason } = req.body;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Invoice is already cancelled.' });
    }

    const cancelled = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'CANCELLED',
        outstandingBalance: 0,
        auditLogs: {
          create: {
            action: 'CANCELLED',
            details: `Invoice cancelled. Reason: ${reason || 'Not specified'}`,
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
    });

    return res.json(cancelled);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to cancel invoice' });
  }
});

// Duplicate Invoice
router.post('/:id/duplicate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const original = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (!original) return res.status(404).json({ error: 'Invoice not found.' });

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = settings?.invoicePrefix || 'INV';
    const fy = settings?.financialYear || '2026-27';
    let nextNum = (settings?.invoiceNextNumber || 1) + 1;
    let proposedNumber = `${prefix}/${fy}/${String(nextNum).padStart(3, '0')}`;

    const duplicated = await prisma.invoice.create({
      data: {
        invoiceNumber: proposedNumber,
        invoiceDate: new Date(),
        status: 'DRAFT',
        customerId: original.customerId,
        deliveryNote: original.deliveryNote,
        paymentTerms: original.paymentTerms,
        supplierRef: original.supplierRef,
        placeOfSupply: original.placeOfSupply,
        termsOfDelivery: original.termsOfDelivery,
        isInterstate: original.isInterstate,
        subtotal: original.subtotal,
        discount: original.discount,
        taxableAmount: original.taxableAmount,
        cgstAmount: original.cgstAmount,
        sgstAmount: original.sgstAmount,
        igstAmount: original.igstAmount,
        totalTaxAmount: original.totalTaxAmount,
        otherCharges: original.otherCharges,
        roundOff: original.roundOff,
        grandTotal: original.grandTotal,
        amountInWords: original.amountInWords,
        outstandingBalance: original.grandTotal,
        notes: original.notes,
        termsAndConditions: original.termsAndConditions,
        items: {
          create: original.items.map(it => ({
            serialNumber: it.serialNumber,
            description: it.description,
            hsnSac: it.hsnSac,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            taxableAmount: it.taxableAmount,
            gstRate: it.gstRate,
            cgstRate: it.cgstRate,
            sgstRate: it.sgstRate,
            igstRate: it.igstRate,
            cgstAmount: it.cgstAmount,
            sgstAmount: it.sgstAmount,
            igstAmount: it.igstAmount,
            totalAmount: it.totalAmount,
          })),
        },
        auditLogs: {
          create: {
            action: 'CREATED',
            details: `Duplicated from invoice ${original.invoiceNumber}`,
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
      include: { items: true, customer: true },
    });

    await prisma.companySettings.update({
      where: { id: 'default' },
      data: { invoiceNextNumber: nextNum },
    });

    return res.status(201).json(duplicated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to duplicate invoice' });
  }
});

// Render HTML Preview
router.get('/:id/html', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true },
    });

    if (!invoice) return res.status(404).send('Invoice not found');

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const html = compileInvoiceHtml(invoice, settings);

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err: any) {
    return res.status(500).send('Failed to compile invoice HTML');
  }
});

// Download / View PDF
router.get('/:id/pdf', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

    try {
      const { buffer } = await generateInvoicePdf(invoice, settings);
      const safeNum = invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="Invoice_${safeNum}.pdf"`);
      return res.send(buffer);
    } catch (pdfErr: any) {
      // Fallback: render print-ready HTML with auto-print dialog if headless Chromium is not present on host
      console.warn('PDF binary generation fallback to printable HTML:', pdfErr?.message);
      const html = compileInvoiceHtml(invoice, settings);
      const printableHtml = html.replace(
        '</body>',
        '<script>window.onload = function() { window.print(); };</script></body>'
      );
      res.setHeader('Content-Type', 'text/html');
      return res.send(printableHtml);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate PDF' });
  }
});

// Send Email
router.post('/:id/send-email', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const { recipientEmail, subject, message } = req.body;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, items: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });
    const { filePath } = await generateInvoicePdf(invoice, settings);

    const targetEmail = recipientEmail || invoice.customer?.email;
    if (!targetEmail) {
      return res.status(400).json({ error: 'No recipient email specified and customer has no email.' });
    }

    const emailResult = await sendInvoiceEmail({
      to: targetEmail,
      customerName: invoice.customer?.name || 'Valued Customer',
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: invoice.grandTotal,
      pdfPath: filePath,
      customSubject: subject,
      customMessage: message,
    });

    await prisma.invoiceCommunication.create({
      data: {
        invoiceId: invoice.id,
        type: 'EMAIL',
        recipient: targetEmail,
        status: emailResult.success ? 'SENT' : 'FAILED',
        subject: subject || `Invoice ${invoice.invoiceNumber}`,
        message: message || '',
        metadata: emailResult.error || `MessageID: ${emailResult.messageId}`,
      },
    });

    if (emailResult.success) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          emailStatus: 'SENT',
          emailSentAt: new Date(),
        },
      });
      return res.json({ message: 'Email sent successfully!' });
    } else {
      return res.status(400).json({ error: emailResult.error });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
});

// WhatsApp Share Handler
router.post('/:id/share-whatsapp', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });

    const phone = invoice.customer?.whatsapp || invoice.customer?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const downloadUrl = `${config.appUrl}/api/invoices/${invoice.id}/pdf`;
    const messageText = `Hello ${invoice.customer?.name || 'Customer'},\nHere is your Tax Invoice ${invoice.invoiceNumber} for ₹${invoice.grandTotal.toLocaleString('en-IN')}.\nYou can download the official PDF invoice here:\n${downloadUrl}\n\nThank you,\nCogniviz Technologies`;

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { whatsappShareCount: { increment: 1 } },
    });

    await prisma.invoiceCommunication.create({
      data: {
        invoiceId: invoice.id,
        type: 'WHATSAPP',
        recipient: phone || 'Unknown',
        status: 'SENT',
        message: messageText,
      },
    });

    return res.json({
      whatsappUrl,
      messageText,
      phone,
      downloadUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate WhatsApp share link' });
  }
});

export default router;
