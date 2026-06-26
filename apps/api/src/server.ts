import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { APP_NAME, APP_VERSION, type ApiResponse } from '@meeting-assistant/shared';
import { config } from './config/index.js';
import { clerkWebhookRouter } from './webhooks/clerk.webhook.js';
import { requireAuth, requireOrg, requireRole } from './middleware/auth.middleware.js';

const app = express();

// ============================================================
// CORS — controls which origins can call our API
// ============================================================
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ============================================================
// Webhook routes — MUST be registered BEFORE express.json()
// ============================================================
app.use('/api/webhooks', clerkWebhookRouter);

// ============================================================
// JSON body parsing for all other routes
// ============================================================
app.use(express.json());

// ============================================================
// Clerk middleware — parses Clerk JWT on every request
// ============================================================
app.use(
  clerkMiddleware({
    publishableKey: config.clerk.publishableKey,
    secretKey: config.clerk.secretKey,
  }),
);

// ============================================================
// PUBLIC routes — no authentication required
// ============================================================

type HealthData = {
  status: 'ok';
  timestamp: string;
  service: string;
  version: string;
  environment: string;
};

app.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse<HealthData> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: APP_NAME,
      version: APP_VERSION,
      environment: config.env,
    },
  };

  res.status(200).json(response);
});

// ============================================================
// PROTECTED routes
// ============================================================

type WhoAmIData = {
  userId: string;
  sessionId: string | null;
  orgId: string | null | undefined;
  orgRole: string | null | undefined;
};

/**
 * Returns the current authenticated user's session data.
 * Requires sign-in but does not require an organization.
 */
app.get('/api/v1/me', requireAuth, (req: Request, res: Response) => {
  const auth = getAuth(req);

  const response: ApiResponse<WhoAmIData> = {
    success: true,
    data: {
      userId: auth.userId!,
      sessionId: auth.sessionId,
      orgId: auth.orgId,
      orgRole: auth.orgRole,
    },
  };

  res.status(200).json(response);
});

/**
 * Test endpoint that requires the user to be in an organization.
 * Useful for verifying the requireOrg middleware.
 */
type WorkspaceContextData = {
  userId: string;
  orgId: string;
  orgRole: string;
};

app.get('/api/v1/workspace/context', requireOrg, (req: Request, res: Response) => {
  const auth = getAuth(req);

  const response: ApiResponse<WorkspaceContextData> = {
    success: true,
    data: {
      userId: auth.userId!,
      orgId: auth.orgId!,
      orgRole: auth.orgRole ?? 'unknown',
    },
  };

  res.status(200).json(response);
});

/**
 * Test endpoint that requires admin role.
 * Only admins and owners can call this.
 */
type AdminCheckData = {
  message: string;
  role: string;
};

app.get('/api/v1/admin/check', requireRole('admin'), (req: Request, res: Response) => {
  const auth = getAuth(req);

  const response: ApiResponse<AdminCheckData> = {
    success: true,
    data: {
      message: 'Admin access confirmed.',
      role: auth.orgRole ?? 'unknown',
    },
  };

  res.status(200).json(response);
});

app.listen(config.server.port, () => {
  console.warn(
    `API server running in ${config.env} mode on http://localhost:${config.server.port}`,
  );
});
