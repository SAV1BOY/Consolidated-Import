import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import ExcelJS from 'exceljs';
import { app } from '../../src/index';
import { prisma } from '../../src/db';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/sample-consolidado.xlsx');

const MAPPING = JSON.stringify({
  code: 'B', description: 'D', supplier: 'C',
  costFobUsd: 'L', suggestedQty: 'I',
  stockPhysical: 'E', stockAvailable: 'F',
  monthlyAvg: 'G', stockDuration: 'H',
  totalFobUsd: 'M', totalFobBrl: 'N',
  totalNationalized: 'O',
});

// Track IDs created in this test suite for cleanup
const createdConsolidationIds: number[] = [];

async function createConsolidationWithData() {
  const meetingNumber = 900 + Math.floor(Math.random() * 100);
  const createRes = await request(app)
    .post('/api/consolidations')
    .send({
      meetingNumber,
      meetingDate: '2026-03-01',
      description: 'Export Test',
      exchangeRate: 5.3232,
    })
    .expect(201);

  createdConsolidationIds.push(createRes.body.id);

  await request(app)
    .post(`/api/upload/consolidations/${createRes.body.id}/import`)
    .attach('file', FIXTURE_PATH)
    .field('mapping', MAPPING)
    .expect(200);

  return createRes.body.id;
}

describe('Export Integration', () => {
  afterAll(async () => {
    // Clean up only what we created
    for (const id of createdConsolidationIds) {
      await prisma.auditLog.deleteMany({ where: { consolidationId: id } });
      await prisma.consolidationLineItem.deleteMany({ where: { consolidationId: id } });
      await prisma.consolidation.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/consolidations/:id/export/excel', () => {
    it('should return an XLSX file download', async () => {
      const id = await createConsolidationWithData();

      const response = await request(app)
        .get(`/api/consolidations/${id}/export/excel`)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
      expect(response.headers['content-disposition']).toContain(`consolidacao-${id}.xlsx`);
      expect(response.body).toBeDefined();
    });

    it('should generate valid XLSX with 4 sheets', async () => {
      const id = await createConsolidationWithData();

      const response = await request(app)
        .get(`/api/consolidations/${id}/export/excel`)
        .expect(200)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(response.body);
      expect(wb.worksheets.length).toBe(4);
      expect(wb.worksheets.map(ws => ws.name)).toEqual([
        'Resumo', 'Itens', 'Pareto ABC', 'Riscos',
      ]);
    });

    it('should include imported items in Itens sheet', async () => {
      const id = await createConsolidationWithData();

      const response = await request(app)
        .get(`/api/consolidations/${id}/export/excel`)
        .expect(200)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(response.body);
      const itens = wb.getWorksheet('Itens')!;
      // Header row + at least 1 data row
      expect(itens.rowCount).toBeGreaterThan(1);
    });

    it('should return 404 for non-existent consolidation', async () => {
      const response = await request(app)
        .get('/api/consolidations/99999/export/excel')
        .expect(404);

      expect(response.body.error).toBe('Consolidation not found');
    });

    it('should work with empty consolidation (no line items)', async () => {
      const meetingNumber = 800 + Math.floor(Math.random() * 100);
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      createdConsolidationIds.push(createRes.body.id);

      const response = await request(app)
        .get(`/api/consolidations/${createRes.body.id}/export/excel`)
        .expect(200);

      expect(response.headers['content-type']).toContain('spreadsheetml');
    });
  });

  describe('GET /api/consolidations/:id/export/pdf', () => {
    it('should return a PDF file download', async () => {
      const id = await createConsolidationWithData();

      const response = await request(app)
        .get(`/api/consolidations/${id}/export/pdf`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain(`consolidacao-${id}.pdf`);
    });

    it('should generate valid PDF (starts with %PDF header)', async () => {
      const id = await createConsolidationWithData();

      const response = await request(app)
        .get(`/api/consolidations/${id}/export/pdf`)
        .expect(200)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      const header = response.body.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('should return 404 for non-existent consolidation', async () => {
      const response = await request(app)
        .get('/api/consolidations/99999/export/pdf')
        .expect(404);

      expect(response.body.error).toBe('Consolidation not found');
    });

    it('should work with empty consolidation (no line items)', async () => {
      const meetingNumber = 700 + Math.floor(Math.random() * 100);
      const createRes = await request(app)
        .post('/api/consolidations')
        .send({ meetingNumber, meetingDate: '2026-03-01', exchangeRate: 5.3232 })
        .expect(201);

      createdConsolidationIds.push(createRes.body.id);

      const response = await request(app)
        .get(`/api/consolidations/${createRes.body.id}/export/pdf`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });
});
