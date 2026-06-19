import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { APP_NAME, APP_VERSION, type ApiResponse } from '@meeting-assistant/shared';
import { config } from './config/index.js';

const app = express();

// ============================================================
// CORS — controls which origins can call our API
// ============================================================
// Browsers block cross-origin requests by default. We explicitly
// allow the origins listed in CORS_ORIGINS env var.
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

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
// Custom requireAuth middleware
// ============================================================
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required to access this resource.',
      },
    });
    return;
  }

  next();
}

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
// PROTECTED routes — require valid Clerk session
// ============================================================

type WhoAmIData = {
  userId: string;
  sessionId: string | null;
};

app.get('/api/v1/me', requireAuth, (req: Request, res: Response) => {
  const auth = getAuth(req);

  const response: ApiResponse<WhoAmIData> = {
    success: true,
    data: {
      userId: auth.userId!,
      sessionId: auth.sessionId,
    },
  };

  res.status(200).json(response);
});

app.listen(config.server.port, () => {
  console.log(`API server running in ${config.env} mode on http://localhost:${config.server.port}`);
});
