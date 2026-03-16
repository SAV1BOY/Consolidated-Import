import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/suppliers
router.get('/', async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
});

export default router;
