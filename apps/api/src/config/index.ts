import { z } from 'zod';

/**
 * Environment variable schema.
 *
 * All environment variables the API needs are defined here.
 * Validation runs at startup. Missing or invalid values cause
 * the server to crash immediately with a clear error message.
 *
 * This is intentional: it is far better to crash on boot than
 * to discover misconfiguration in production at 3 AM.
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim())),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Clerk Authentication
  CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'CLERK_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'Clerk publishable key must start with pk_'),
  CLERK_SECRET_KEY: z
    .string()
    .min(1, 'CLERK_SECRET_KEY is required')
    .startsWith('sk_', 'Clerk secret key must start with sk_'),
  CLERK_WEBHOOK_SECRET: z
    .string()
    .min(1, 'CLERK_WEBHOOK_SECRET is required')
    .startsWith('whsec_', 'Clerk webhook secret must start with whsec_'),

  // Supabase Storage
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid HTTPS URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .startsWith('eyJ', 'Service role key must be a valid JWT (starts with eyJ)'),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('meetings'),

  // Upload limits
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(50),
});

/**
 * Parses and validates environment variables.
 * Throws an error with detailed messages if validation fails.
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, messages]) => `  ${key}: ${messages?.join(', ')}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${formatted}`);
  }

  return result.data;
}

const env = loadConfig();

/**
 * Type-safe, validated application configuration.
 *
 * Import this anywhere in the API instead of accessing
 * process.env directly. This guarantees:
 *  - Values are always defined
 *  - Values are correctly typed
 *  - Refactoring is safe
 */
export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
  },

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  cors: {
    origins: env.CORS_ORIGINS,
  },

  logging: {
    level: env.LOG_LEVEL,
  },

  clerk: {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    webhookSecret: env.CLERK_WEBHOOK_SECRET,
  },

  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: env.SUPABASE_STORAGE_BUCKET,
  },

  upload: {
    maxSizeMb: env.MAX_UPLOAD_SIZE_MB,
    maxSizeBytes: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
} as const;

export type Config = typeof config;
