import { Router } from 'express';
import { store } from '../store.js';
import { logAction, getAuditLog } from '../services/audit.js';

const router = Router();

// POST /api/consolidations — Create new consolidation
router.post('/', (req, res) => {
  const { meetingNumber, totalMeetings, meetingDate, description, exchangeRate } = req.body;

  if (!meetingNumber || !meetingDate || !exchangeRate) {
    res.status(400).json({ error: 'meetingNumber, meetingDate, and exchangeRate are required' });
    return;
  }

  const consolidation = store.createConsolidation({
    meetingNumber,
    totalMeetings: totalMeetings || 26,
    meetingDate,
    description: description || null,
    exchangeRate,
    status: 'draft',
    columnMapping: null,
  });

  res.status(201).json(consolidation);
});

// GET /api/consolidations — List all
router.get('/', (_req, res) => {
  res.json(store.consolidations);
});

// GET /api/consolidations/:id — Detail with line items
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const consolidation = store.consolidations.find(c => c.id === id);
  if (!consolidation) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  const lineItems = store.lineItems.filter(li => li.consolidationId === id);
  res.json({ ...consolidation, lineItems });
});

// PATCH /api/consolidations/:id — Update status
router.patch('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const consolidation = store.consolidations.find(c => c.id === id);
  if (!consolidation) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  if (req.body.status) consolidation.status = req.body.status;
  if (req.body.description) consolidation.description = req.body.description;
  consolidation.updatedAt = new Date();

  res.json(consolidation);
});

// PATCH /api/consolidations/:id/items/:itemId — Edit decidedQty
router.patch('/:id/items/:itemId', (req, res) => {
  const consolidationId = parseInt(req.params.id, 10);
  const itemId = parseInt(req.params.itemId, 10);
  const { decidedQty } = req.body;

  const lineItem = store.lineItems.find(
    li => li.consolidationId === consolidationId && li.itemId === itemId
  );

  if (!lineItem) {
    res.status(404).json({ error: 'Line item not found' });
    return;
  }

  const oldQty = lineItem.decidedQty;
  lineItem.decidedQty = decidedQty;

  logAction(consolidationId, 'qty_changed', 'line_item', lineItem.id, oldQty, decidedQty);

  res.json(lineItem);
});

// GET /api/consolidations/:id/compare/:otherId — Compare two consolidations
router.get('/:id/compare/:otherId', (req, res) => {
  const id1 = parseInt(req.params.id, 10);
  const id2 = parseInt(req.params.otherId, 10);

  const c1 = store.consolidations.find(c => c.id === id1);
  const c2 = store.consolidations.find(c => c.id === id2);

  if (!c1 || !c2) {
    res.status(404).json({ error: 'One or both consolidations not found' });
    return;
  }

  const items1 = store.lineItems.filter(li => li.consolidationId === id1);
  const items2 = store.lineItems.filter(li => li.consolidationId === id2);

  const codes1 = new Set(items1.map(i => i.code));
  const codes2 = new Set(items2.map(i => i.code));

  const added = items2.filter(i => !codes1.has(i.code));
  const removed = items1.filter(i => !codes2.has(i.code));
  const changed = items2.filter(i => {
    if (!codes1.has(i.code)) return false;
    const prev = items1.find(p => p.code === i.code);
    return prev && (prev.suggestedQty !== i.suggestedQty || prev.decidedQty !== i.decidedQty);
  });

  res.json({ added, removed, changed });
});

export default router;
