import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

/**
 * Supabase storage client (singleton).
 *
 * Created once when the API process starts and shared by every
 * route handler. We use the service_role key here, which gives
 * full admin access to Supabase storage.
 *
 * IMPORTANT: this client must NEVER be imported by frontend code.
 * The service_role key bypasses all storage security policies —
 * exposing it to browsers would let anyone read or delete any file.
 *
 * The frontend never talks to Supabase directly. It calls our API,
 * which generates short-lived signed URLs for uploads.
 */
export const supabase: SupabaseClient = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Returns the storage bucket interface bound to our configured bucket.
 * Use this for all file operations.
 *
 * The explicit return type annotation prevents TypeScript from trying
 * to emit declarations for Supabase's internal classes, which would
 * otherwise produce warnings about private members.
 *
 * Example:
 *   const bucket = getStorageBucket();
 *   await bucket.createSignedUploadUrl(...);
 */
export function getStorageBucket(): ReturnType<typeof supabase.storage.from> {
  return supabase.storage.from(config.supabase.storageBucket);
}
