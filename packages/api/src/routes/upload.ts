import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db.js';
import { getPreview, detectColumns } from '../services/column-mapper.js';
import { parseSpreadsheet } from '../services/spreadsheet-parser.js';
import { mergeItems } from '../services/merge-engine.js';
import { logAction } from '../services/audit.js';
import type { ColumnMappingConfig } from '../types.js';

const uploadMiddleware = multer({
  dest: '/tmp/uploads/',
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') {
      cb(new Error('Only .xlsx files are accepted'));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

function handleUpload(fieldName: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    uploadMiddleware.single(fieldName)(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  };
}

// POST /api/upload/preview
router.post('/preview', handleUpload('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filePath = req.file.path;
    const preview = await getPreview(filePath, 5);
    const suggestedMapping = detectColumns(preview.headers);

    res.json({
      ...preview,
      suggestedMapping,
      fileId: path.basename(filePath),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    res.status(400).json({ error: message });
  }
});

// POST /api/upload/consolidations/:id/import
router.post('/consolidations/:id/import', handleUpload('file'), async (req, res) => {
  try {
    const consolidationId = parseInt(req.params.id, 10);
    const consolidation = await prisma.consolidation.findUnique({
      where: { id: consolidationId },
    });

    if (!consolidation) {
      res.status(404).json({ error: 'Consolidation not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const mappingStr = req.body.mapping;
    if (!mappingStr) {
      res.status(400).json({ error: 'Column mapping is required' });
      return;
    }

    const mapping: ColumnMappingConfig = JSON.parse(mappingStr);
    const filePath = req.file.path;

    const parsedRows = await parseSpreadsheet(filePath, mapping, { skipExtensionCheck: true });

    // Get existing data for merge comparison
    const existingItems = await prisma.item.findMany({ select: { code: true } });
    const existingSuppliers = await prisma.supplier.findMany({ select: { name: true } });

    const existingCodes = existingItems.map(i => i.code);
    const existingSupplierNames = existingSuppliers.map(s => s.name);

    const result = mergeItems(parsedRows, existingCodes, existingSupplierNames);

    // Persist to database in a transaction
    await prisma.$transaction(async (tx) => {
      const allRows = [...result.newItemRows, ...result.updatedItemRows];

      for (const row of allRows) {
        // Upsert supplier
        const supplier = await tx.supplier.upsert({
          where: { code: row.supplier.replace(/\s+/g, '_').toUpperCase().slice(0, 50) },
          create: {
            code: row.supplier.replace(/\s+/g, '_').toUpperCase().slice(0, 50),
            name: row.supplier,
          },
          update: {},
        });

        // Upsert item
        const item = await tx.item.upsert({
          where: { code: row.code },
          create: {
            code: row.code,
            description: row.description,
            supplierId: supplier.id,
            costFobUsd: row.costFobUsd,
          },
          update: { costFobUsd: row.costFobUsd },
        });

        // Create line item
        await tx.consolidationLineItem.create({
          data: {
            consolidationId,
            itemId: item.id,
            stockPhysical: row.stockPhysical,
            stockAvailable: row.stockAvailable,
            monthlyAvg: row.monthlyAvg,
            stockDuration: row.stockDuration,
            suggestedQty: row.suggestedQty,
            totalFobUsd: row.totalFobUsd,
            totalFobBrl: row.totalFobBrl,
            totalNationalized: row.totalNationalized,
          },
        });
      }

      // Save mapping to consolidation
      await tx.consolidation.update({
        where: { id: consolidationId },
        data: { columnMapping: mapping as any },
      });
    });

    // Audit log
    await logAction(consolidationId, 'spreadsheet_uploaded', 'consolidation', consolidationId, null, {
      filename: req.file.originalname,
      rowsParsed: parsedRows.length,
      newItems: result.report.newItems,
      updatedItems: result.report.updatedItems,
    });

    // Clean up temp file
    fs.unlink(filePath, () => {});

    res.json({ report: result.report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Import failed';
    res.status(400).json({ error: message });
  }
});

export default router;
