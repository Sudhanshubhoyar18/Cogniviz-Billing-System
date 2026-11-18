import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// List Services Library
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const services = await prisma.serviceItem.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(services);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch services library' });
  }
});

// Add Service Item
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, hsnSac, defaultRate = 0, unit = 'Nos', defaultGstRate = 18 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Service/Item name is required.' });
    }

    const item = await prisma.serviceItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        hsnSac: hsnSac?.trim() || null,
        defaultRate: Number(defaultRate) || 0,
        unit: unit?.trim() || 'Nos',
        defaultGstRate: Number(defaultGstRate) || 18,
      },
    });

    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save service item' });
  }
});

// Update Service Item
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const { name, description, hsnSac, defaultRate, unit, defaultGstRate } = req.body;
    const item = await prisma.serviceItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description.trim() : undefined,
        hsnSac: hsnSac !== undefined ? hsnSac.trim() : undefined,
        defaultRate: defaultRate !== undefined ? Number(defaultRate) : undefined,
        unit: unit !== undefined ? unit.trim() : undefined,
        defaultGstRate: defaultGstRate !== undefined ? Number(defaultGstRate) : undefined,
      },
    });

    return res.json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update service item' });
  }
});

// Delete Service Item
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.serviceItem.delete({ where: { id } });
    return res.json({ message: 'Item deleted from library.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete service item' });
  }
});

export default router;
