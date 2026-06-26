import { type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import type { OrganizationRole } from '@meeting-assistant/database';

/**
 * Authorization middleware.
 *
 * Provides three layered helpers:
 *   - requireAuth: user must be signed in
 *   - requireOrg:  user must be signed in AND have an active organization
 *   - requireRole: user must be signed in, in an org, AND have a specific role
 *
 * Roles are hierarchical:
 *   owner > admin > member > viewer
 *
 * Higher roles automatically satisfy lower role requirements.
 * For example, an "admin" passes requireRole('member').
 */

// ============================================================
// Role hierarchy
// ============================================================

const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

/**
 * Maps Clerk's role identifiers to our internal role names.
 * Clerk uses "org:admin" and "org:member" by default.
 *
 * This is duplicated from clerk.webhook.ts — in a later phase
 * we will extract it to a shared utility. For now, simplicity
 * over premature abstraction.
 */
function mapClerkRole(clerkRole: string | null | undefined): OrganizationRole | null {
  if (!clerkRole) {
    return null;
  }
  const normalized = clerkRole.toLowerCase();
  if (normalized.includes('admin')) {
    return 'admin';
  }
  if (normalized.includes('owner')) {
    return 'owner';
  }
  if (normalized.includes('viewer')) {
    return 'viewer';
  }
  return 'member';
}

// ============================================================
// Standard error response helpers
// ============================================================

function unauthorized(res: Response, message = 'Authentication required.'): void {
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHENTICATED',
      message,
    },
  });
}

function forbidden(res: Response, code: string, message: string): void {
  res.status(403).json({
    success: false,
    error: { code, message },
  });
}

// ============================================================
// Middleware
// ============================================================

/**
 * Requires the request to come from an authenticated Clerk user.
 * Responds with 401 if not signed in.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    unauthorized(res);
    return;
  }

  next();
}

/**
 * Requires the request to come from an authenticated user
 * who has an active organization selected.
 *
 * Without an active org, we cannot scope data to a tenant.
 * Responds with 403 if the user has no active org.
 */
export function requireOrg(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    unauthorized(res);
    return;
  }

  if (!auth.orgId) {
    forbidden(
      res,
      'NO_ACTIVE_ORGANIZATION',
      'You must select an active organization to perform this action.',
    );
    return;
  }

  next();
}

/**
 * Requires the user to have at least one of the specified roles
 * in their active organization.
 *
 * Roles follow a hierarchy:
 *   owner (4) > admin (3) > member (2) > viewer (1)
 *
 * Passing a single role means "this role OR higher".
 * Example: requireRole('admin') allows admin and owner.
 *
 * Pass multiple roles for explicit allow-lists:
 * Example: requireRole('owner', 'admin') is identical to requireRole('admin').
 */
export function requireRole(...allowedRoles: OrganizationRole[]) {
  // The lowest-ranked role becomes our minimum bar
  const minimumRank = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r]));

  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = getAuth(req);

    if (!auth.userId) {
      unauthorized(res);
      return;
    }

    if (!auth.orgId) {
      forbidden(
        res,
        'NO_ACTIVE_ORGANIZATION',
        'You must select an active organization to perform this action.',
      );
      return;
    }

    const role = mapClerkRole(auth.orgRole);
    const userRank = role ? ROLE_HIERARCHY[role] : 0;

    if (userRank < minimumRank) {
      forbidden(
        res,
        'INSUFFICIENT_PERMISSIONS',
        `This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      );
      return;
    }

    next();
  };
}
