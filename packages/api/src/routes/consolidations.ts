import { Router } from 'express';
import { prisma } from '../db.js';
import { logAction } from '../services/audit.js';

const router = Router();

// POST /api/consolidations
router.post('/', async (req, res) => {
  const { meetingNumber, totalMeetings, meetingDate, description, exchangeRate } = req.body;

  if (!meetingNumber || !meetingDate || !exchangeRate) {
    res.status(400).json({ error: 'meetingNumber, meetingDate, and exchangeRate are required' });
    return;
  }

  const consolidation = await prisma.consolidation.create({
    data: {
      meetingNumber,
      totalMeetings: totalMeetings || 26,
      meetingDate: new Date(meetingDate),
      description: description || null,
      exchangeRate,
      status: 'draft',
    },
  });

  res.status(201).json(consolidation);
});

// GET /api/consolidations
router.get('/', async (_req, res) => {
  const consolidations = await prisma.consolidation.findMany({
    orderBy: { meetingNumber: 'asc' },
  });
  res.json(consolidations);
});

// GET /api/consolidations/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const consolidation = await prisma.consolidation.findUnique({
    where: { id },
    include: {
      lineItems: {
        include: { item: { include: { supplier: true } } },
      },
    },
  });

  if (!consolidation) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  res.json(consolidation);
});

// PATCH /api/consolidations/:id
router.patch('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const existing = await prisma.consolidation.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (req.body.status) data.status = req.body.status;
  if (req.body.description) data.description = req.body.description;

  const updated = await prisma.consolidation.update({ where: { id }, data });
  res.json(updated);
});

// PATCH /api/consolidations/:id/items/:itemId
router.patch('/:id/items/:itemId', async (req, res) => {
  const consolidationId = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const { decidedQty } = req.body;

  const lineItem = await prisma.consolidationLineItem.findFirst({
    where: { consolidationId, itemId },
  });

  if (!lineItem) {
    res.status(404).json({ error: 'Line item not found' });
    return;
  }

  const oldQty = lineItem.decidedQty;

  const updated = await prisma.consolidationLineItem.update({
    where: { id: lineItem.id },
    data: { decidedQty },
  });

  await logAction(consolidationId, 'qty_changed', 'line_item', lineItem.id, oldQty, decidedQty);

  res.json(updated);
});

// GET /api/consolidations/:id/compare/:otherId
router.get('/:id/compare/:otherId', async (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const id2 = parseInt(req.params.otherId, 10);

  const [c1, c2] = await Promise.all([
    prisma.consolidation.findUnique({ where: { id: id1 } }),
    prisma.consolidation.findUnique({ where: { id: id2 } }),
  ]);

  if (!c1 || !c2) {
    res.status(404).json({ error: 'One or both consolidations not found' });
    return;
  }

  const [items1, items2] = await Promise.all([
    prisma.consolidationLineItem.findMany({
      where: { consolidationId: id1 },
      include: { item: true },
    }),
    prisma.consolidationLineItem.findMany({
      where: { consolidationId: id2 },
      include: { item: true },
    }),
  ]);

  const codes1 = new Set(items1.map(i => i.item.code));
  const codes2 = new Set(items2.map(i => i.item.code));

  const added = items2.filter(i => !codes1.has(i.item.code));
  const removed = items1.filter(i => !codes2.has(i.item.code));
  const changed = items2.filter(i => {
    if (!codes1.has(i.item.code)) return false;
    const prev = items1.find(p => p.item.code === i.item.code);
    return prev && (prev.suggestedQty !== i.suggestedQty || prev.decidedQty !== i.decidedQty);
  });

  res.json({ added, removed, changed });
});

export default router;
