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
  // Public values (also accessible on the server)
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_'),

  // Server-only secrets
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required')
    .startsWith('sk_', 'Clerk secret key must start with sk_'),
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
  clerk: {
    publishableKey: parsed.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: parsed.data.CLERK_SECRET_KEY,
  },
} as const;

export type ServerEnv = typeof serverEnv;
