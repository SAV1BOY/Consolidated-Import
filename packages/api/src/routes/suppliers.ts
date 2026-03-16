import { Router } from 'express';
import { store } from '../store.js';

const router = Router();

// GET /api/suppliers
router.get('/', (_req, res) => {
  res.json(store.suppliers);
});

export default router;
