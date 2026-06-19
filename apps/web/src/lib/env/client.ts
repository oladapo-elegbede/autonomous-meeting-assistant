import { z } from 'zod';

/**
 * Client-safe environment variables.
 *
 * These values are exposed to the browser. Anything imported
 * from this file will be visible to end users in the bundled
 * JavaScript. NEVER add secrets here.
 *
 * All variables must use the NEXT_PUBLIC_ prefix.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
});

/**
 * Important: We pass the values explicitly rather than process.env.
 *
 * Next.js statically replaces NEXT_PUBLIC_* references at build time.
 * Passing them explicitly ensures the bundler can perform that replacement.
 */
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  console.error('Invalid client environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid client environment configuration');
}

export const clientEnv = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
} as const;

export type ClientEnv = typeof clientEnv;
