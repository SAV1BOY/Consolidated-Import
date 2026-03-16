import { Router } from 'express';
import { prisma } from '../db.js';
import { calculateKPIs, calculateABC, identifyRiskItems } from '../services/metrics-calculator.js';
import type { LineItemInput } from '../services/metrics-calculator.js';

const router = Router();

async function getLineItemInputs(consolidationId: number): Promise<LineItemInput[]> {
  const lineItems = await prisma.consolidationLineItem.findMany({
    where: { consolidationId },
    include: { item: { include: { supplier: true } } },
  });

  return lineItems.map(li => ({
    itemId: li.itemId,
    code: li.item.code,
    description: li.item.description,
    supplier: li.item.supplier.name,
    quantity: li.decidedQty ?? li.suggestedQty,
    nationalizedValue: li.totalNationalized,
    costFobUsd: li.item.costFobUsd,
    totalFobUsd: li.totalFobUsd,
    totalFobBrl: li.totalFobBrl,
    stockAvailable: li.stockAvailable,
    monthlyAvg: li.monthlyAvg,
    stockDuration: li.stockDuration,
    suggestedQty: li.suggestedQty,
  }));
}

// GET /api/dashboard/:consolidationId
router.get('/:consolidationId', async (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const consolidation = await prisma.consolidation.findUnique({
    where: { id: consolidationId },
  });

  if (!consolidation) {
    res.status(404).json({ error: 'Consolidation not found' });
    return;
  }

  const inputs = await getLineItemInputs(consolidationId);
  const kpis = calculateKPIs(inputs, consolidation.exchangeRate);
  res.json(kpis);
});

// GET /api/dashboard/:consolidationId/pareto
router.get('/:consolidationId/pareto', async (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const inputs = await getLineItemInputs(consolidationId);
  const abc = calculateABC(inputs);
  res.json(abc);
});

// GET /api/dashboard/:consolidationId/risk
router.get('/:consolidationId/risk', async (req, res) => {
  const consolidationId = parseInt(req.params.consolidationId, 10);
  const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 3;
  const inputs = await getLineItemInputs(consolidationId);
  const risks = identifyRiskItems(inputs, threshold);
  res.json(risks);
});

export default router;
