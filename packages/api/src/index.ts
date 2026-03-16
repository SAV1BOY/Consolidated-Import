import express from 'express';
import cors from 'cors';
import consolidationsRouter from './routes/consolidations.js';
import uploadRouter from './routes/upload.js';
import dashboardRouter from './routes/dashboard.js';
import itemsRouter from './routes/items.js';
import suppliersRouter from './routes/suppliers.js';
import { getAuditLog } from './services/audit.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'iluminar-import-api' });
});

app.use('/api/consolidations', consolidationsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/items', itemsRouter);
app.use('/api/suppliers', suppliersRouter);

app.get('/api/audit-log', (req, res) => {
  const consolidationId = req.query.consolidationId
    ? parseInt(req.query.consolidationId as string, 10)
    : undefined;
  res.json(getAuditLog(consolidationId));
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ILUMINAR API running on port ${PORT}`);
  });
}

export { app };
