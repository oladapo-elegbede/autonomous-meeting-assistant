/**
 * Public API of the @meeting-assistant/database package.
 *
 * This is the only file other packages should import from.
 * Internal modules (connection, client, types) are exposed here
 * so consumers do not need to know the internal file structure.
 */

export { createPool, type DatabasePool } from './connection.js';
export { createDatabaseClient, type DatabaseClient } from './client.js';
export type {
  Database,
  UsersTable,
  OrganizationsTable,
  OrganizationMembersTable,
  MeetingsTable,
  OrganizationRole,
  MeetingStatus,
} from './types.js';