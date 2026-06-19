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

  // Clerk public configuration
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'Clerk publishable key must start with pk_'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default('/dashboard'),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default('/onboarding'),
});

/**
 * Next.js statically replaces NEXT_PUBLIC_* references at build time.
 * Passing them explicitly ensures the bundler performs that replacement.
 */
const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
});

if (!parsed.success) {
  console.error('Invalid client environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid client environment configuration');
}

export const clientEnv = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  appUrl: parsed.data.NEXT_PUBLIC_APP_URL,
  clerk: {
    publishableKey: parsed.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    signInUrl: parsed.data.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    signUpUrl: parsed.data.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    afterSignInUrl: parsed.data.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
    afterSignUpUrl: parsed.data.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
  },
} as const;

export type ClientEnv = typeof clientEnv;
