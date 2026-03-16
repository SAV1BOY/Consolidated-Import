import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/items
router.get('/', async (_req, res) => {
  const items = await prisma.item.findMany({
    include: { supplier: true },
    orderBy: { code: 'asc' },
  });
  res.json(items);
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = await prisma.item.findUnique({
    where: { id },
    include: { supplier: true },
  });

  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }

  res.json(item);
});

export default router;
