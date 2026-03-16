import { Router } from 'express';
import { store } from '../store.js';

const router = Router();

// GET /api/items
router.get('/', (_req, res) => {
  res.json(store.items);
});

// GET /api/items/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = store.items.find(i => i.id === id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  res.json(item);
});

export default router;
