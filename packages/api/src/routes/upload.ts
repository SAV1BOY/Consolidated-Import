import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPreview, detectColumns } from '../services/column-mapper.js';
import { parseSpreadsheet } from '../services/spreadsheet-parser.js';
import { mergeItems } from '../services/merge-engine.js';
import { store } from '../store.js';
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

// Multer error handler wrapper
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

// POST /api/upload/preview — Upload XLSX and return preview
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

// POST /api/upload/consolidations/:id/import — Parse and import XLSX
router.post('/consolidations/:id/import', handleUpload('file'), async (req, res) => {
  try {
    const consolidationId = parseInt(req.params.id, 10);
    const consolidation = store.consolidations.find(c => c.id === consolidationId);
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

    // skipExtensionCheck because multer already validated the file extension
    const parsedRows = await parseSpreadsheet(filePath, mapping, { skipExtensionCheck: true });

    const existingCodes = store.items.map(i => i.code);
    const existingSuppliers = store.suppliers.map(s => s.name);

    const result = mergeItems(parsedRows, existingCodes, existingSuppliers);

    // Create line items in store
    for (const row of [...result.newItemRows, ...result.updatedItemRows]) {
      store.addLineItem(consolidationId, row);
    }

    // Save mapping to consolidation
    consolidation.columnMapping = mapping as unknown as Record<string, string>;

    // Audit log
    logAction(consolidationId, 'spreadsheet_uploaded', 'consolidation', consolidationId, null, {
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
