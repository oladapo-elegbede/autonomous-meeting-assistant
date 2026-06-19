import type { ColumnType, Generated } from 'kysely';

/**
 * Database schema types.
 *
 * This file is the single source of truth for what tables and columns
 * exist in our database. Kysely uses these types to give us full
 * autocomplete and compile-time validation when writing queries.
 *
 * Rules:
 *  - Add a type here BEFORE creating the migration
 *  - Use Generated<T> for columns the database fills in (id, created_at)
 *  - Use ColumnType<S, I, U> when read/insert/update types differ
 *  - Keep this file in sync with migrations at all times
 */

// ============================================================
// Shared column helpers
// ============================================================

/**
 * A UUID column where the database generates the value on insert.
 * We read it as a string, but never insert or update it manually.
 */
type GeneratedUUID = Generated<string>;

/**
 * A timestamp column where the database fills it in on insert.
 * Reads as a Date object.
 */
type GeneratedTimestamp = ColumnType<Date, Date | string | undefined, Date | string>;

// ============================================================
// Roles (mirrors the role enum we will create in SQL)
// ============================================================

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

// ============================================================
// Tables
// ============================================================

export type UsersTable = {
  id: GeneratedUUID;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
};

export type OrganizationsTable = {
  id: GeneratedUUID;
  clerk_org_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
};

export type OrganizationMembersTable = {
  id: GeneratedUUID;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  invited_by: string | null;
  joined_at: GeneratedTimestamp | null;
  created_at: GeneratedTimestamp;
  updated_at: GeneratedTimestamp;
};

// ============================================================
// Master database type
// ============================================================

/**
 * The Database type ties everything together.
 * Kysely uses this type to know what tables exist.
 *
 * To add a new table:
 *  1. Define a new <TableName>Table type above
 *  2. Add a key here mapping the SQL table name to that type
 *  3. Create the migration
 */
export type Database = {
  users: UsersTable;
  organizations: OrganizationsTable;
  organization_members: OrganizationMembersTable;
};