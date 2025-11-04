import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'modelTracking',
  max: 10,
  idleTimeoutMillis: 30_000,
});

// Log pool errors and unexpected client errors
pool.on('error', (err: unknown) => {
  console.error('[DB:Pool] Unexpected error on idle client', err);
});

export default pool;


