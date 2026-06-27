import { Router, type Request, type Response, type NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import type { ApiResponse } from '@meeting-assistant/shared';
import { requireOrg } from '../../middleware/auth.middleware.js';
import {
  MeetingServiceError,
  prepareUpload,
  completeUpload,
  listMeetings,
  getMeeting,
  type PrepareUploadResult,
  type MeetingSummary,
  type MeetingDetail,
} from './meetings.service.js';
import { prepareUploadSchema, meetingIdParamsSchema } from './meetings.schema.js';

const router = Router();

// ============================================================
// Error helpers
// ============================================================

function sendServiceError(res: Response, err: unknown): void {
  if (err instanceof MeetingServiceError) {
    res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error('Unexpected error in meetings router:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}

function sendValidationError(
  res: Response,
  fieldErrors: Record<string, string[] | undefined>,
): void {
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload.',
      details: fieldErrors,
    },
  });
}

// ============================================================
// POST /api/v1/meetings/upload-url
// ============================================================

router.post('/upload-url', requireOrg, async (req: Request, res: Response, _next: NextFunction) => {
  const parsed = prepareUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error.flatten().fieldErrors);
    return;
  }

  const auth = getAuth(req);

  try {
    const result = await prepareUpload({
      clerkUserId: auth.userId!,
      clerkOrgId: auth.orgId!,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      fileMimeType: parsed.data.fileMimeType,
      title: parsed.data.title,
    });

    const response: ApiResponse<PrepareUploadResult> = {
      success: true,
      data: result,
    };

    res.status(201).json(response);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// ============================================================
// POST /api/v1/meetings/:id/complete
// ============================================================

router.post(
  '/:id/complete',
  requireOrg,
  async (req: Request, res: Response, _next: NextFunction) => {
    const parsedParams = meetingIdParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      sendValidationError(res, parsedParams.error.flatten().fieldErrors);
      return;
    }

    const auth = getAuth(req);

    try {
      await completeUpload({
        clerkUserId: auth.userId!,
        clerkOrgId: auth.orgId!,
        meetingId: parsedParams.data.id,
      });

      const response: ApiResponse<{ status: 'uploaded' }> = {
        success: true,
        data: { status: 'uploaded' },
      };

      res.status(200).json(response);
    } catch (err) {
      sendServiceError(res, err);
    }
  },
);

// ============================================================
// GET /api/v1/meetings
// ============================================================

router.get('/', requireOrg, async (req: Request, res: Response, _next: NextFunction) => {
  const auth = getAuth(req);

  try {
    const meetings = await listMeetings(auth.userId!, auth.orgId!);

    const response: ApiResponse<MeetingSummary[]> = {
      success: true,
      data: meetings,
    };

    res.status(200).json(response);
  } catch (err) {
    sendServiceError(res, err);
  }
});

// ============================================================
// GET /api/v1/meetings/:id
// ============================================================

router.get('/:id', requireOrg, async (req: Request, res: Response, _next: NextFunction) => {
  const parsedParams = meetingIdParamsSchema.safeParse(req.params);
  if (!parsedParams.success) {
    sendValidationError(res, parsedParams.error.flatten().fieldErrors);
    return;
  }

  const auth = getAuth(req);

  try {
    const meeting = await getMeeting(auth.userId!, auth.orgId!, parsedParams.data.id);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEETING_NOT_FOUND',
          message: 'Meeting not found.',
        },
      });
      return;
    }

    const response: ApiResponse<MeetingDetail> = {
      success: true,
      data: meeting,
    };

    res.status(200).json(response);
  } catch (err) {
    sendServiceError(res, err);
  }
});

export { router as meetingsRouter };
