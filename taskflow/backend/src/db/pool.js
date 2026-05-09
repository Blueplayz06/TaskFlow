import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Connection pool
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'taskflow',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max:      10,              // max pool connections
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // SSL for AWS RDS in production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

// Log pool errors (keeps process alive)
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

// ── Helpers
export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

// ── Health check
export async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] Connected to PostgreSQL ✓');
  } finally {
    client.release();
  }
}

// ── Run migrations on startup
export async function runMigrations() {
  const migDir = path.join(__dirname, 'migrations');
  const files  = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort();

  // Create migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
    if (rows.length) continue; // already applied

    const sql = fs.readFileSync(path.join(migDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`[DB] Migration applied: ${file}`);
  }
}

export default pool;
