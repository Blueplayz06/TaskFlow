import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { checkConnection, runMigrations } from './db/pool.js';

// Routes
import authRoutes     from './routes/auth.js';
import tasksRoutes    from './routes/tasks.js';
import projectsRoutes from './routes/projects.js';

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security
app.use(helmet());

// ── CORS  — allow frontend origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// ── Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check (used by Docker, ALB, CI)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes
app.use('/api/auth',     authRoutes);
app.use('/api/tasks',    tasksRoutes);
app.use('/api/projects', projectsRoutes);

// ── 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  if (process.env.NODE_ENV === 'development') console.error(err.stack);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ message: 'Duplicate entry' });
  }
  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record not found' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Boot
async function start() {
  try {
    await checkConnection();
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`[server] TaskFlow API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();

export default app; // for testing
