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

type GeneratedUUID = Generated<string>;

type GeneratedTimestamp = ColumnType<Date, Date | string | undefined, Date | string>;

// ============================================================
// Enums
// ============================================================

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export type MeetingStatus =
  | 'uploading'
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'analyzing'
  | 'analyzed'
  | 'embedding'
  | 'complete'
  | 'failed';

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
  plan: ColumnType<string, string | undefined, string>;
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

export type MeetingsTable = {
  id: GeneratedUUID;
  organization_id: string;
  uploaded_by: string;

  title: string;
  status: ColumnType<MeetingStatus, MeetingStatus | undefined, MeetingStatus>;

  file_name: string;
  file_size_bytes: ColumnType<string, number | string, number | string>;
  file_mime_type: string;
  storage_path: string;

  duration_seconds: number | null;
  error_message: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: ColumnType<Record<string, any>, Record<string, any> | undefined, Record<string, any>>;

  uploaded_at: GeneratedTimestamp | null;
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
  meetings: MeetingsTable;
};