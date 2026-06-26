import { Router, type Request, type Response } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { config } from '../config/index.js';
import { db } from '../db/index.js';

const router = Router();

/**
 * Type definitions for Clerk webhook events we care about.
 * Clerk sends much more data than this — we narrow to what we need.
 */
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

type ClerkUserCreatedEvent = {
  type: 'user.created' | 'user.updated';
  data: ClerkUserData;
};

type ClerkUserDeletedEvent = {
  type: 'user.deleted';
  data: { id: string; deleted: boolean };
};

type ClerkEvent = ClerkUserCreatedEvent | ClerkUserDeletedEvent;

/**
 * Returns the user's primary email address.
 * Clerk allows multiple email addresses per user; we pick the primary one.
 */
function getPrimaryEmail(data: ClerkUserData): string | null {
  if (!data.primary_email_address_id) {
    return data.email_addresses[0]?.email_address ?? null;
  }
  return (
    data.email_addresses.find((e) => e.id === data.primary_email_address_id)?.email_address ?? null
  );
}

/**
 * Builds the full name from first_name and last_name.
 * Returns null if both are missing.
 */
function buildFullName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Upserts a user in our database based on Clerk's user data.
 * "Upsert" means: insert if new, update if existing.
 *
 * We use clerk_user_id as the conflict target because that is the
 * unique identifier linking Clerk to our database.
 */
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

/**
 * Soft handling of user deletion.
 *
 * For now we hard-delete from our users table. When we add features
 * with foreign keys (meetings, action items), we may need to switch
 * to soft-delete to preserve historical data.
 */
async function deleteUser(clerkUserId: string): Promise<void> {
  await db.deleteFrom('users').where('clerk_user_id', '=', clerkUserId).execute();
}

/**
 * POST /api/webhooks/clerk
 *
 * Receives webhook events from Clerk and syncs them to our database.
 *
 * Important: this route uses express.raw() instead of express.json() because
 * svix signature verification requires the raw, unparsed request body.
 */
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    // Verify the webhook signature using svix
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

    // Process the verified event
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

        default:
          // Unknown event type — log and ignore (do not error out)
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
