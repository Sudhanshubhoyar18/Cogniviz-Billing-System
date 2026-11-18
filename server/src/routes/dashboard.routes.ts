import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/stats', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total Invoices
    const totalInvoicesCount = await prisma.invoice.count();

    // 2. All Invoices for calculation
    const allInvoices = await prisma.invoice.findMany({
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        status: true,
        grandTotal: true,
        amountReceived: true,
        outstandingBalance: true,
        customerId: true,
        customer: {
          select: { name: true, companyName: true },
        },
      },
      orderBy: { invoiceDate: 'desc' },
    });

    // 3. Customers
    const totalCustomersCount = await prisma.customer.count({
      where: { isArchived: false },
    });

    // 4. Payments
    const allPayments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMethod: true,
      },
    });

    // Calculations
    const nonCancelledInvoices = allInvoices.filter(i => i.status !== 'CANCELLED');
    const totalSales = nonCancelledInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const revenueReceived = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingAmount = nonCancelledInvoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);

    // Monthly Sales (current month)
    const currentMonthInvoices = nonCancelledInvoices.filter(inv => new Date(inv.invoiceDate) >= startOfMonth);
    const monthlySales = currentMonthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Payment Status Breakdown
    const statusCounts = {
      PAID: allInvoices.filter(i => i.status === 'PAID').length,
      PARTIALLY_PAID: allInvoices.filter(i => i.status === 'PARTIALLY_PAID').length,
      PENDING: allInvoices.filter(i => i.status === 'ISSUED' || i.status === 'PENDING').length,
      DRAFT: allInvoices.filter(i => i.status === 'DRAFT').length,
      OVERDUE: allInvoices.filter(i => i.status === 'OVERDUE').length,
      CANCELLED: allInvoices.filter(i => i.status === 'CANCELLED').length,
    };

    // Monthly Sales & Collection Chart (Last 6-12 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyChartMap: { [key: string]: { month: string; sales: number; collections: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyChartMap[key] = { month: key, sales: 0, collections: 0 };
    }

    nonCancelledInvoices.forEach(inv => {
      const d = new Date(inv.invoiceDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyChartMap[key]) {
        monthlyChartMap[key].sales += inv.grandTotal || 0;
      }
    });

    allPayments.forEach(p => {
      const d = new Date(p.paymentDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyChartMap[key]) {
        monthlyChartMap[key].collections += p.amount || 0;
      }
    });

    const revenueOverview = Object.values(monthlyChartMap);

    // Top Customers by Invoiced Amount
    const customerSalesMap: { [id: string]: { id: string; name: string; totalBilled: number; totalPaid: number } } = {};
    nonCancelledInvoices.forEach(inv => {
      if (!inv.customerId) return;
      if (!customerSalesMap[inv.customerId]) {
        customerSalesMap[inv.customerId] = {
          id: inv.customerId,
          name: inv.customer?.companyName || inv.customer?.name || 'Customer',
          totalBilled: 0,
          totalPaid: 0,
        };
      }
      customerSalesMap[inv.customerId].totalBilled += inv.grandTotal || 0;
      customerSalesMap[inv.customerId].totalPaid += inv.amountReceived || 0;
    });

    const topCustomers = Object.values(customerSalesMap)
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 5);

    // Recent 5 Invoices
    const recentInvoices = allInvoices.slice(0, 5).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.companyName || inv.customer?.name || 'Walk-in',
      invoiceDate: inv.invoiceDate,
      amount: inv.grandTotal,
      status: inv.status,
    }));

    return res.json({
      cards: {
        totalInvoices: totalInvoicesCount,
        totalSales: Math.round(totalSales),
        revenueReceived: Math.round(revenueReceived),
        outstandingAmount: Math.round(outstandingAmount),
        totalCustomers: totalCustomersCount,
        monthlySales: Math.round(monthlySales),
      },
      revenueOverview,
      statusCounts,
      recentInvoices,
      topCustomers,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch dashboard stats' });
  }
});

export default router;
