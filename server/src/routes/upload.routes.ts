import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

const uploadDir = path.resolve(__dirname, '../../uploads/branding');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, WebP) are allowed.'));
    }
  },
});

router.post(
  '/:category',
  requireAuth,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      const category = String(req.params.category).toLowerCase(); // logo, signature, stamp
      const fileUrl = `/uploads/branding/${req.file.filename}`;

      await prisma.fileRecord.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          path: fileUrl,
          category: category.toUpperCase(),
        },
      });

      if (category === 'logo') {
        await prisma.companySettings.update({
          where: { id: 'default' },
          data: { logoUrl: fileUrl },
        });
      } else if (category === 'signature') {
        await prisma.companySettings.update({
          where: { id: 'default' },
          data: { signatureUrl: fileUrl },
        });
      } else if (category === 'stamp') {
        await prisma.companySettings.update({
          where: { id: 'default' },
          data: { stampUrl: fileUrl },
        });
      }

      return res.json({
        url: fileUrl,
        filename: req.file.filename,
        category,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'File upload failed' });
    }
  }
);

export default router;
