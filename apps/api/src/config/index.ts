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
});

/**
 * Parses and validates environment variables.
 * Throws an error with detailed messages if validation fails.
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment configuration:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
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
} as const;

export type Config = typeof config;