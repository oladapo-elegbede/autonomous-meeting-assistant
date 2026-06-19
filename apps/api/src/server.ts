import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { APP_NAME, APP_VERSION, type ApiResponse } from '@meeting-assistant/shared';
import { config } from './config/index.js';

const app = express();

app.use(express.json());

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

app.listen(config.server.port, () => {
  console.log(`API server running in ${config.env} mode on http://localhost:${config.server.port}`);
});
