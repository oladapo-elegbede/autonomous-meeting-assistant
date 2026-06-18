import express, { type Request, type Response } from 'express';
import { APP_NAME, APP_VERSION, type ApiResponse } from '@meeting-assistant/shared';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

type HealthData = {
  status: 'ok';
  timestamp: string;
  service: string;
  version: string;
};

app.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse<HealthData> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: APP_NAME,
      version: APP_VERSION,
    },
  };

  res.status(200).json(response);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
