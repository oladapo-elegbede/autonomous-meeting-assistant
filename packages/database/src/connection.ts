import pg from 'pg';

const { Pool } = pg;

/**
 * Creates a PostgreSQL connection pool.
 *
 * The pool is the single source of database connections for the entire API.
 * We create one pool per process — never create new pools per request.
 *
 * Pool sizing rules of thumb:
 *  - min: 2 (keep a couple of warm connections ready)
 *  - max: 10-20 per Node process (scale horizontally, not vertically)
 *
 * If you exhaust the pool, requests will queue and eventually time out.
 */
export function createPool(databaseUrl: string): pg.Pool {
  const pool = new Pool({
    connectionString: databaseUrl,
    min: 2,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  // Log unexpected errors. These usually mean network issues
  // or the database went away. We log but do not crash —
  // the pool will retry the connection automatically.
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  return pool;
}

export type DatabasePool = pg.Pool;