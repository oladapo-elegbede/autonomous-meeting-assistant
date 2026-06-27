import { z } from 'zod';

/**
 * Zod validation schemas for the meetings API.
 *
 * All request bodies are parsed through these schemas before
 * reaching route handlers. Invalid input is rejected with a
 * 400 response automatically.
 */

export const prepareUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'fileName is required')
    .max(500, 'fileName cannot exceed 500 characters'),
  fileSizeBytes: z
    .number()
    .int('fileSizeBytes must be an integer')
    .positive('fileSizeBytes must be positive'),
  fileMimeType: z.string().min(1, 'fileMimeType is required'),
  title: z.string().max(500, 'title cannot exceed 500 characters').optional(),
});

export type PrepareUploadRequest = z.infer<typeof prepareUploadSchema>;

export const meetingIdParamsSchema = z.object({
  id: z.string().uuid('Meeting ID must be a valid UUID'),
});

export type MeetingIdParams = z.infer<typeof meetingIdParamsSchema>;
