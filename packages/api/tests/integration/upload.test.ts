import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import { app } from '../../src/index';
import { prisma } from '../../src/db';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/sample-consolidado.xlsx');
const INVALID_PATH = path.join(__dirname, '../fixtures/invalid.txt');

async function cleanDatabase() {
  await prisma.auditLog.deleteMany({});
  await prisma.consolidationLineItem.deleteMany({});
  await prisma.consolidation.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.supplier.deleteMany({});
}

describe('Upload Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/upload/preview', () => {
    it('should accept XLSX upload and return column preview', async () => {
      const response = await request(app)
        .post('/api/upload/preview')
        .attach('file', FIXTURE_PATH)
        .expect(200);

      expect(response.body.headers).toBeInstanceOf(Array);
      expect(response.body.sampleRows).toBeInstanceOf(Array);
      expect(response.body.totalRows).toBeGreaterThan(0);
    });

    it('should reject non-XLSX files', async () => {
      const response = await request(app)
        .post('/api/upload/preview')
        .attach('file', INVALID_PATH)
        .expect(400);

      expect(response.body.error).toMatch(/xlsx/i);
    });

    it('should return suggested column mapping', async () => {
      const response = await request(app)
        .post('/api/upload/preview')
        .attach('file', FIXTURE_PATH)
        .expect(200);

      expect(response.body.suggestedMapping).toBeDefined();
    });
  });

  describe('POST /api/upload/consolidations/:id/import', () => {
    it('should parse XLSX with provided column mapping and create line items', async () => {
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({
          meetingNumber: 1,
          meetingDate: '2026-03-01',
          description: 'Primeira Reuniao (Marco)',
          exchangeRate: 5.3232,
        })
        .expect(201);

      const mapping = JSON.stringify({
        code: 'B', description: 'D', supplier: 'C',
        costFobUsd: 'L', suggestedQty: 'I',
        stockPhysical: 'E', stockAvailable: 'F',
        monthlyAvg: 'G', stockDuration: 'H',
        totalFobUsd: 'M', totalFobBrl: 'N',
        totalNationalized: 'O',
      });

      const response = await request(app)
        .post(`/api/upload/consolidations/${createRes.body.id}/import`)
        .attach('file', FIXTURE_PATH)
        .field('mapping', mapping)
        .expect(200);

      expect(response.body.report.lineItemsCreated).toBeGreaterThan(0);
    });

    it('should auto-detect and create new items', async () => {
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 1, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      const mapping = JSON.stringify({
        code: 'B', description: 'D', supplier: 'C',
        costFobUsd: 'L', suggestedQty: 'I',
      });

      await request(app)
        .post(`/api/upload/consolidations/${createRes.body.id}/import`)
        .attach('file', FIXTURE_PATH)
        .field('mapping', mapping)
        .expect(200);

      const items = await request(app).get('/api/items').expect(200);
      expect(items.body.length).toBeGreaterThan(0);
    });

    it('should create audit log entry for upload', async () => {
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 1, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      const mapping = JSON.stringify({
        code: 'B', description: 'D', supplier: 'C',
        costFobUsd: 'L', suggestedQty: 'I',
      });

      await request(app)
        .post(`/api/upload/consolidations/${createRes.body.id}/import`)
        .attach('file', FIXTURE_PATH)
        .field('mapping', mapping)
        .expect(200);

      const logs = await request(app)
        .get(`/api/audit-log?consolidationId=${createRes.body.id}`)
        .expect(200);

      expect(logs.body.length).toBeGreaterThan(0);
      expect(logs.body[0].action).toBe('spreadsheet_uploaded');
    });
  });

  describe('PATCH /api/consolidations/:id/items/:itemId', () => {
    it('should update decided quantity and create audit log', async () => {
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 1, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      const mapping = JSON.stringify({
        code: 'B', description: 'D', supplier: 'C',
        costFobUsd: 'L', suggestedQty: 'I',
      });

      await request(app)
        .post(`/api/upload/consolidations/${createRes.body.id}/import`)
        .attach('file', FIXTURE_PATH)
        .field('mapping', mapping)
        .expect(200);

      const detail = await request(app)
        .get(`/api/consolidations/${createRes.body.id}`)
        .expect(200);

      const firstItem = detail.body.lineItems[0];

      const response = await request(app)
        .patch(`/api/consolidations/${createRes.body.id}/items/${firstItem.itemId}`)
        .send({ decidedQty: 500 })
        .expect(200);

      expect(response.body.decidedQty).toBe(500);

      const logs = await request(app)
        .get(`/api/audit-log?consolidationId=${createRes.body.id}`)
        .expect(200);

      const qtyLog = logs.body.find((l: { action: string }) => l.action === 'qty_changed');
      expect(qtyLog).toBeDefined();
    });
  });

  describe('GET /api/dashboard/:consolidationId', () => {
    it('should return aggregated KPIs for a consolidation', async () => {
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 1, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      const mapping = JSON.stringify({
        code: 'B', description: 'D', supplier: 'C',
        costFobUsd: 'L', suggestedQty: 'I',
        totalFobUsd: 'M', totalFobBrl: 'N', totalNationalized: 'O',
      });

      await request(app)
        .post(`/api/upload/consolidations/${createRes.body.id}/import`)
        .attach('file', FIXTURE_PATH)
        .field('mapping', mapping)
        .expect(200);

      const response = await request(app)
        .get(`/api/dashboard/${createRes.body.id}`)
        .expect(200);

      expect(response.body.totalItems).toBeGreaterThan(0);
      expect(response.body.exchangeRate).toBe(5.3232);
    });
  });

  describe('GET /api/consolidations/:id/compare/:otherId', () => {
    it('should return diff between two consolidations', async () => {
      const c1 = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 1, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      const c2 = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber: 2, meetingDate: '2026-03-15', exchangeRate: 5.35 })
        .expect(201);

      const response = await request(app)
        .get(`/api/consolidations/${c1.body.id}/compare/${c2.body.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('added');
      expect(response.body).toHaveProperty('removed');
      expect(response.body).toHaveProperty('changed');
    });
  });
});
