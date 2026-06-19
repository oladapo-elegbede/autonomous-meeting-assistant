import 'server-only';
import { z } from 'zod';

/**
 * Server-only environment variables.
 *
 * Importing this file from a client component will cause a build error.
 * This guarantees secrets stay on the server.
 *
 * All client-safe variables are also accessible here for convenience.
 */
const serverEnvSchema = z.object({
  // Public values (also available on the client)
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Server-only secrets will be added here as we build features.
  // Example:
  // CLERK_SECRET_KEY: z.string().min(1),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid server environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid server environment configuration');
}

export const serverEnv = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
} as const;

export type ServerEnv = typeof serverEnv;
