import { Router, type Request, type Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import type { OrganizationRole } from '@meeting-assistant/database';
import { config } from '../config/index.js';
import { db } from '../db/index.js';

const router = Router();

// ============================================================
// Clerk webhook event types
// ============================================================

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserData = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

type ClerkOrganizationData = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  logo_url: string | null;
};

type ClerkOrganizationMembershipData = {
  id: string;
  organization: { id: string };
  public_user_data: { user_id: string };
  role: string;
};

type ClerkUserEvent = {
  type: 'user.created' | 'user.updated';
  data: ClerkUserData;
};

type ClerkUserDeletedEvent = {
  type: 'user.deleted';
  data: { id: string; deleted: boolean };
};

type ClerkOrganizationEvent = {
  type: 'organization.created' | 'organization.updated';
  data: ClerkOrganizationData;
};

type ClerkOrganizationDeletedEvent = {
  type: 'organization.deleted';
  data: { id: string; deleted: boolean };
};

type ClerkMembershipEvent = {
  type: 'organizationMembership.created' | 'organizationMembership.updated';
  data: ClerkOrganizationMembershipData;
};

type ClerkMembershipDeletedEvent = {
  type: 'organizationMembership.deleted';
  data: ClerkOrganizationMembershipData;
};

type ClerkEvent =
  | ClerkUserEvent
  | ClerkUserDeletedEvent
  | ClerkOrganizationEvent
  | ClerkOrganizationDeletedEvent
  | ClerkMembershipEvent
  | ClerkMembershipDeletedEvent;

// ============================================================
// User helpers
// ============================================================

function getPrimaryEmail(data: ClerkUserData): string | null {
  if (!data.primary_email_address_id) {
    return data.email_addresses[0]?.email_address ?? null;
  }
  return (
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address ?? null
  );
}

function buildFullName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

async function syncUser(data: ClerkUserData): Promise<void> {
  const email = getPrimaryEmail(data);

  if (!email) {
    throw new Error(`Clerk user ${data.id} has no email address`);
  }

  await db
    .insertInto('users')
    .values({
      clerk_user_id: data.id,
      email,
      full_name: buildFullName(data),
      avatar_url: data.image_url,
    })
    .onConflict((oc) =>
      oc.column('clerk_user_id').doUpdateSet({
        email,
        full_name: buildFullName(data),
        avatar_url: data.image_url,
        updated_at: new Date(),
      }),
    )
    .execute();
}

async function deleteUser(clerkUserId: string): Promise<void> {
  await db.deleteFrom('users').where('clerk_user_id', '=', clerkUserId).execute();
}

// ============================================================
// Organization helpers
// ============================================================

async function syncOrganization(data: ClerkOrganizationData): Promise<void> {
  if (!data.slug) {
    throw new Error(`Clerk organization ${data.id} has no slug`);
  }

  // Hoist into a local so TypeScript narrows the type for the entire function
  const slug = data.slug;
  const logoUrl = data.logo_url ?? data.image_url;

  await db
    .insertInto('organizations')
    .values({
      clerk_org_id: data.id,
      name: data.name,
      slug,
      logo_url: logoUrl,
    })
    .onConflict((oc) =>
      oc.column('clerk_org_id').doUpdateSet({
        name: data.name,
        slug,
        logo_url: logoUrl,
        updated_at: new Date(),
      }),
    )
    .execute();
}

async function deleteOrganization(clerkOrgId: string): Promise<void> {
  await db.deleteFrom('organizations').where('clerk_org_id', '=', clerkOrgId).execute();
}

// ============================================================
// Membership helpers
// ============================================================

/**
 * Maps Clerk's role identifiers to our internal role names.
 * Clerk uses "org:admin" and "org:member" by default.
 */
function mapClerkRole(clerkRole: string): OrganizationRole {
  const normalized = clerkRole.toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('owner')) return 'owner';
  if (normalized.includes('viewer')) return 'viewer';
  return 'member';
}

async function syncMembership(data: ClerkOrganizationMembershipData): Promise<void> {
  // Resolve internal IDs from Clerk IDs
  const org = await db
    .selectFrom('organizations')
    .select('id')
    .where('clerk_org_id', '=', data.organization.id)
    .executeTakeFirst();

  const user = await db
    .selectFrom('users')
    .select('id')
    .where('clerk_user_id', '=', data.public_user_data.user_id)
    .executeTakeFirst();

  if (!org || !user) {
    // The org or user webhook may not have arrived yet. Skip silently —
    // Clerk will retry, and by then the dependency should exist.
    console.warn(
      `Skipping membership sync: missing org (${data.organization.id}) or user (${data.public_user_data.user_id})`,
    );
    return;
  }

  const role = mapClerkRole(data.role);

  await db
    .insertInto('organization_members')
    .values({
      organization_id: org.id,
      user_id: user.id,
      role,
      joined_at: new Date(),
    })
    .onConflict((oc) =>
      oc.columns(['organization_id', 'user_id']).doUpdateSet({
        role,
        updated_at: new Date(),
      }),
    )
    .execute();
}

async function deleteMembership(data: ClerkOrganizationMembershipData): Promise<void> {
  const org = await db
    .selectFrom('organizations')
    .select('id')
    .where('clerk_org_id', '=', data.organization.id)
    .executeTakeFirst();

  const user = await db
    .selectFrom('users')
    .select('id')
    .where('clerk_user_id', '=', data.public_user_data.user_id)
    .executeTakeFirst();

  if (!org || !user) {
    return;
  }

  await db
    .deleteFrom('organization_members')
    .where('organization_id', '=', org.id)
    .where('user_id', '=', user.id)
    .execute();
}

// ============================================================
// Webhook route
// ============================================================

router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const svixId = req.header('svix-id');
    const svixTimestamp = req.header('svix-timestamp');
    const svixSignature = req.header('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_SVIX_HEADERS',
          message: 'Webhook request is missing required svix headers.',
        },
      });
      return;
    }

    const webhook = new Webhook(config.clerk.webhookSecret);

    let event: ClerkEvent;
    try {
      event = webhook.verify(req.body as Buffer, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkEvent;
    } catch (err) {
      console.error('Clerk webhook signature verification failed', err);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_WEBHOOK_SIGNATURE',
          message: 'Webhook signature could not be verified.',
        },
      });
      return;
    }

    try {
      switch (event.type) {
        case 'user.created':
        case 'user.updated':
          await syncUser(event.data);
          console.log(`Synced Clerk user: ${event.data.id} (${event.type})`);
          break;

        case 'user.deleted':
          await deleteUser(event.data.id);
          console.log(`Deleted Clerk user: ${event.data.id}`);
          break;

        case 'organization.created':
        case 'organization.updated':
          await syncOrganization(event.data);
          console.log(`Synced Clerk organization: ${event.data.id} (${event.type})`);
          break;

        case 'organization.deleted':
          await deleteOrganization(event.data.id);
          console.log(`Deleted Clerk organization: ${event.data.id}`);
          break;

        case 'organizationMembership.created':
        case 'organizationMembership.updated':
          await syncMembership(event.data);
          console.log(
            `Synced Clerk membership: org=${event.data.organization.id} user=${event.data.public_user_data.user_id}`,
          );
          break;

        case 'organizationMembership.deleted':
          await deleteMembership(event.data);
          console.log(
            `Deleted Clerk membership: org=${event.data.organization.id} user=${event.data.public_user_data.user_id}`,
          );
          break;

        default:
          console.log(`Ignoring unknown Clerk event type: ${(event as { type: string }).type}`);
      }
    } catch (err) {
      console.error('Error processing Clerk webhook', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: 'Failed to process webhook event.',
        },
      });
      return;
    }

    res.status(200).json({ success: true, data: { received: true } });
  },
);

export { router as clerkWebhookRouter };
