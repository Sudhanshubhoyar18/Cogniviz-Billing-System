import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

// Get Company & Invoice Settings
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: 'default' },
      });
    }

    return res.json(settings);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch settings' });
  }
});

// Update Settings
router.put('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    // Don't allow changing ID
    delete data.id;

    const updated = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to save settings' });
  }
});

export default router;

