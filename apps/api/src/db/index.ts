import { createPool, createDatabaseClient } from '@meeting-assistant/database';
import { config } from '../config/index.js';

/**
 * Database singleton.
 *
 * One PostgreSQL connection pool is created when the API process
 * starts and shared across all routes. Importing `db` from this
 * module gives every part of the codebase access to type-safe queries.
 */
const pool = createPool(config.database.url);

export const db = createDatabaseClient(pool);

/**
 * Gracefully closes the pool on shutdown.
 * Call this when the process is exiting to free database connections.
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
}
