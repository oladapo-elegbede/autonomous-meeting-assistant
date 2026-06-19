import { Kysely, PostgresDialect } from 'kysely';
import type { DatabasePool } from './connection.js';
import type { Database } from './types.js';

/**
 * Creates a Kysely client bound to our database schema types.
 *
 * Kysely is a type-safe SQL query builder. Unlike an ORM, it produces
 * plain SQL queries and has zero runtime overhead. The TypeScript
 * compiler enforces that every query matches the schema defined in types.ts.
 *
 * Example usage:
 *
 *   const user = await db
 *     .selectFrom('users')
 *     .where('clerk_user_id', '=', clerkId)
 *     .selectAll()
 *     .executeTakeFirst();
 *
 * If you misspell a column, TypeScript will error before you even run it.
 */
export function createDatabaseClient(pool: DatabasePool): Kysely<Database> {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  });
}

export type DatabaseClient = Kysely<Database>;