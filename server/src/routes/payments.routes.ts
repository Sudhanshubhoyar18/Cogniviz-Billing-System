import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// List All Payments
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { invoiceId, customerId } = req.query;
    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;
    if (customerId) where.customerId = customerId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            status: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return res.json(payments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch payments' });
  }
});

// Record Payment Against Invoice
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      invoiceId,
      amount,
      paymentDate,
      paymentMethod = 'UPI',
      transactionRef,
      notes,
    } = req.body;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid invoice and positive payment amount are required.' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, payments: true },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot record payment for a cancelled invoice.' });
    }

    const payAmount = Number(amount);
    const newTotalReceived = invoice.amountReceived + payAmount;
    const newOutstanding = Math.max(0, invoice.grandTotal - newTotalReceived);

    // Auto determine new status
    let newStatus = invoice.status;
    if (newOutstanding <= 0.5) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIALLY_PAID';
    }

    // Receipt number: RCP-INVNumber-Sequence
    const pCount = invoice.payments.length + 1;
    const receiptNumber = `RCP-${invoice.invoiceNumber.replace(/[\/\\?%*:|"<>]/g, '')}-${pCount}`;

    // Create payment in a transaction
    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: payAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        transactionRef,
        notes,
        receiptNumber,
      },
    });

    // Update invoice balance & status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        amountReceived: newTotalReceived,
        outstandingBalance: newOutstanding,
        status: newStatus,
        auditLogs: {
          create: {
            action: 'PAYMENT_RECORDED',
            details: `Payment of ₹${payAmount} received via ${paymentMethod} (${receiptNumber}). Remaining balance: ₹${newOutstanding}`,
            performedBy: req.user?.name || 'Admin',
          },
        },
      },
    });

    return res.status(201).json(payment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to record payment' });
  }
});

export default router;
