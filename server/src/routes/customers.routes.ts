import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// List Customers with search and financial summaries
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, archived } = req.query;

    const whereClause: any = {
      isArchived: archived === 'true',
    };

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { companyName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { gstin: { contains: q } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        invoices: {
          select: {
            id: true,
            grandTotal: true,
            amountReceived: true,
            outstandingBalance: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = customers.map(cust => {
      const activeInvoices = cust.invoices.filter(i => i.status !== 'CANCELLED');
      const totalBilled = activeInvoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
      const totalReceived = activeInvoices.reduce((sum, i) => sum + (i.amountReceived || 0), 0);
      const outstandingBalance = activeInvoices.reduce((sum, i) => sum + (i.outstandingBalance || 0), 0);

      return {
        id: cust.id,
        customerCode: cust.customerCode,
        name: cust.name,
        companyName: cust.companyName,
        gstin: cust.gstin,
        email: cust.email,
        phone: cust.phone,
        whatsapp: cust.whatsapp,
        billingAddress: cust.billingAddress,
        state: cust.state,
        stateCode: cust.stateCode,
        country: cust.country,
        notes: cust.notes,
        isArchived: cust.isArchived,
        totalInvoices: activeInvoices.length,
        totalBilled: Math.round(totalBilled),
        totalReceived: Math.round(totalReceived),
        outstandingBalance: Math.round(outstandingBalance),
        createdAt: cust.createdAt,
      };
    });

    return res.json(enriched);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

// Create Customer
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      companyName,
      gstin,
      email,
      phone,
      whatsapp,
      billingAddress,
      state,
      stateCode,
      country,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    // Auto generate collision-free Customer Code
    const existingCustomers = await prisma.customer.findMany({ select: { customerCode: true } });
    let maxSeq = 0;
    for (const c of existingCustomers) {
      if (c.customerCode && c.customerCode.startsWith('CUST-')) {
        const num = parseInt(c.customerCode.replace('CUST-', ''), 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    let nextSeq = maxSeq + 1;
    let customerCode = `CUST-${String(nextSeq).padStart(3, '0')}`;
    while (await prisma.customer.findUnique({ where: { customerCode } })) {
      nextSeq += 1;
      customerCode = `CUST-${String(nextSeq).padStart(3, '0')}`;
    }

    const newCustomer = await prisma.customer.create({
      data: {
        customerCode,
        name: name.trim(),
        companyName: companyName?.trim() || null,
        gstin: gstin?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || phone?.trim() || null,
        billingAddress: billingAddress?.trim() || null,
        state: state?.trim() || null,
        stateCode: stateCode?.trim() || null,
        country: country?.trim() || 'India',
        notes: notes?.trim() || null,
      },
    });

    return res.status(201).json(newCustomer);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create customer' });
  }
});

// Get Single Customer with Statement & Invoices
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const nonCancelledInvoices = (customer.invoices || []).filter(i => i.status !== 'CANCELLED');
    const totalBilled = nonCancelledInvoices.reduce((sum: number, i: any) => sum + i.grandTotal, 0);
    const totalReceived = (customer.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0);
    const outstandingBalance = Math.max(0, totalBilled - totalReceived);

    return res.json({
      ...customer,
      summary: {
        totalBilled: Math.round(totalBilled),
        totalReceived: Math.round(totalReceived),
        outstandingBalance: Math.round(outstandingBalance),
        invoiceCount: nonCancelledInvoices.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch customer profile' });
  }
});

// Update Customer
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.params.id);
    const {
      name,
      companyName,
      gstin,
      email,
      phone,
      whatsapp,
      billingAddress,
      state,
      stateCode,
      country,
      notes,
    } = req.body;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        companyName: companyName !== undefined ? companyName.trim() : undefined,
        gstin: gstin !== undefined ? gstin.trim() : undefined,
        email: email !== undefined ? email.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        whatsapp: whatsapp !== undefined ? whatsapp.trim() : undefined,
        billingAddress: billingAddress !== undefined ? billingAddress.trim() : undefined,
        state: state !== undefined ? state.trim() : undefined,
        stateCode: stateCode !== undefined ? stateCode.trim() : undefined,
        country: country !== undefined ? country.trim() : undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update customer' });
  }
});

// Archive / Delete Customer
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const customerId = String(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { invoices: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    if (customer.invoices && customer.invoices.length > 0) {
      const archived = await prisma.customer.update({
        where: { id: customerId },
        data: { isArchived: true },
      });
      return res.json({ message: 'Customer has active invoices and has been safely archived.', customer: archived });
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    return res.json({ message: 'Customer deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete customer' });
  }
});

export default router;
