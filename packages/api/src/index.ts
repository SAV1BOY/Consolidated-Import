import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'iluminar-import-api' });
});

// Routes will be added in Sprint 1
// app.use('/api/consolidations', consolidationsRouter);
// app.use('/api/items', itemsRouter);
// app.use('/api/suppliers', suppliersRouter);
// app.use('/api/upload', uploadRouter);
// app.use('/api/dashboard', dashboardRouter);
// app.use('/api/audit-log', auditLogRouter);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ILUMINAR API running on port ${PORT}`);
  });
}

export { app };
