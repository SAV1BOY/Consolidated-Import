import { Router } from 'express';
import { store } from '../store.js';
import { calculateKPIs, calculateABC, identifyRiskItems } from '../services/metrics-calculator.js';
import type { LineItemInput } from '../services/metrics-calculator.js';

const router = Router();

function getLineItemInputs(consolidationId: number): LineItemInput[] {
  return store.lineItems
    .filter(li => li.consolidationId === consolidationId)
    .map(li => ({
      itemId: li.itemId,
      code: li.code,
      description: li.description,
      supplier: li.supplier,
      quantity: li.decidedQty ?? li.suggestedQty,
      nationalizedValue: li.totalNationalized,
      costFobUsd: li.costFobUsd,
      totalFobUsd: li.totalFobUsd,
      totalFobBrl: li.totalFobBrl,
      stockAvailable: li.stockAvailable,
      monthlyAvg: li.monthlyAvg,
      stockDuration: li.stockDuration,
      suggestedQty: li.suggestedQty,
    }));
}

// GET /api/dashboard/:consolidationId — KPIs
router.get('/:consolidationId', (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const consolidation = store.consolidations.find(c => c.id === consolidationId);
  if (!consolidation) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  const inputs = getLineItemInputs(consolidationId);
  const kpis = calculateKPIs(inputs, consolidation.exchangeRate);
  res.json(kpis);
});

// GET /api/dashboard/:consolidationId/pareto — ABC classification
router.get('/:consolidationId/pareto', (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const inputs = getLineItemInputs(consolidationId);
  const abc = calculateABC(inputs);
  res.json(abc);
});

// GET /api/dashboard/:consolidationId/risk — Risk items
router.get('/:consolidationId/risk', (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 3;
  const inputs = getLineItemInputs(consolidationId);
  const risks = identifyRiskItems(inputs, threshold);
  res.json(risks);
});

export default router;
