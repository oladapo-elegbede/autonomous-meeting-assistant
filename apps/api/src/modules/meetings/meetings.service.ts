import { randomUUID } from 'node:crypto';
import type { MeetingStatus } from '@meeting-assistant/database';
import { db } from '../../db/index.js';
import { getStorageBucket } from '../../storage/supabase.js';
import { config } from '../../config/index.js';

// ============================================================
// Allowed file types
// ============================================================

const ALLOWED_MIME_TYPES = new Set([
  'audio/mpeg', // .mp3
  'audio/mp4', // .m4a
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
]);

// ============================================================
// Errors
// ============================================================

/**
 * Custom error class for service-layer failures.
 * Routes catch these and translate them to HTTP responses.
 */
export class MeetingServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = 'MeetingServiceError';
  }
}

// ============================================================
// Helper: resolve internal IDs from Clerk IDs
// ============================================================

/**
 * Looks up the internal user and organization IDs for the current request.
 * Throws if either is missing — the caller should have already enforced
 * authentication and an active organization.
 */
async function resolveContext(clerkUserId: string, clerkOrgId: string) {
  const [user, org] = await Promise.all([
    db.selectFrom('users').select('id').where('clerk_user_id', '=', clerkUserId).executeTakeFirst(),
    db
      .selectFrom('organizations')
      .select('id')
      .where('clerk_org_id', '=', clerkOrgId)
      .executeTakeFirst(),
  ]);

  if (!user) {
    throw new MeetingServiceError('USER_NOT_FOUND', 'User not synced to database yet.', 404);
  }
  if (!org) {
    throw new MeetingServiceError(
      'ORGANIZATION_NOT_FOUND',
      'Organization not synced to database yet.',
      404,
    );
  }

  return { userId: user.id, organizationId: org.id };
}

// ============================================================
// prepareUpload
// ============================================================

export type PrepareUploadInput = {
  clerkUserId: string;
  clerkOrgId: string;
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
  title?: string;
};

export type PrepareUploadResult = {
  meetingId: string;
  uploadUrl: string;
  uploadToken: string;
  storagePath: string;
  expiresInSeconds: number;
};

/**
 * Validates upload metadata, creates a meeting row in status 'uploading',
 * and returns a signed Supabase URL the browser can PUT to directly.
 *
 * The signed URL is short-lived. If the user abandons the upload,
 * the row stays in status 'uploading' and is cleaned up by a future
 * background job (Phase 15).
 */
export async function prepareUpload(input: PrepareUploadInput): Promise<PrepareUploadResult> {
  // Validate inputs
  if (!ALLOWED_MIME_TYPES.has(input.fileMimeType)) {
    throw new MeetingServiceError(
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type: ${input.fileMimeType}. Allowed: audio (MP3, M4A, WAV, WebM) and video (MP4, WebM, MOV).`,
    );
  }

  if (input.fileSizeBytes <= 0) {
    throw new MeetingServiceError('INVALID_FILE_SIZE', 'File size must be greater than zero.');
  }

  if (input.fileSizeBytes > config.upload.maxSizeBytes) {
    throw new MeetingServiceError(
      'FILE_TOO_LARGE',
      `File size exceeds maximum of ${config.upload.maxSizeMb} MB.`,
    );
  }

  // Resolve internal IDs
  const { userId, organizationId } = await resolveContext(input.clerkUserId, input.clerkOrgId);

  // Build storage path: orgs/{org_id}/{meeting_uuid}-{safe_filename}
  // Including the meeting ID in the path prevents filename collisions.
  const meetingId = randomUUID();
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `orgs/${organizationId}/${meetingId}-${safeFileName}`;

  // Generate the signed upload URL from Supabase
  const bucket = getStorageBucket();
  const { data, error } = await bucket.createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new MeetingServiceError(
      'UPLOAD_URL_FAILED',
      `Failed to create upload URL: ${error?.message ?? 'unknown'}`,
      500,
    );
  }

  // Insert the meeting row with status 'uploading'
  await db
    .insertInto('meetings')
    .values({
      id: meetingId,
      organization_id: organizationId,
      uploaded_by: userId,
      title: input.title?.trim() || input.fileName,
      file_name: input.fileName,
      file_size_bytes: input.fileSizeBytes,
      file_mime_type: input.fileMimeType,
      storage_path: storagePath,
    })
    .execute();

  return {
    meetingId,
    uploadUrl: data.signedUrl,
    uploadToken: data.token,
    storagePath,
    expiresInSeconds: 30 * 60, // Supabase default
  };
}

// ============================================================
// completeUpload
// ============================================================

export type CompleteUploadInput = {
  clerkUserId: string;
  clerkOrgId: string;
  meetingId: string;
};

/**
 * Marks an in-progress upload as complete.
 * Called by the browser after the file has been successfully uploaded
 * to Supabase. Verifies the file actually exists in storage before
 * updating the status.
 */
export async function completeUpload(input: CompleteUploadInput): Promise<void> {
  const { organizationId } = await resolveContext(input.clerkUserId, input.clerkOrgId);

  // Load the meeting and verify ownership
  const meeting = await db
    .selectFrom('meetings')
    .select(['id', 'status', 'storage_path'])
    .where('id', '=', input.meetingId)
    .where('organization_id', '=', organizationId)
    .executeTakeFirst();

  if (!meeting) {
    throw new MeetingServiceError('MEETING_NOT_FOUND', 'Meeting not found.', 404);
  }

  if (meeting.status !== 'uploading') {
    throw new MeetingServiceError(
      'INVALID_STATUS',
      `Cannot complete upload from status '${meeting.status}'.`,
    );
  }

  // Verify the file actually arrived in Supabase before marking as uploaded.
  // This prevents fake "completion" calls from leaving us with empty records.
  const bucket = getStorageBucket();
  const { data: fileInfo, error: statError } = await bucket.list(
    meeting.storage_path.substring(0, meeting.storage_path.lastIndexOf('/')),
    {
      search: meeting.storage_path.substring(meeting.storage_path.lastIndexOf('/') + 1),
    },
  );

  if (statError) {
    throw new MeetingServiceError(
      'STORAGE_CHECK_FAILED',
      `Failed to verify file in storage: ${statError.message}`,
      500,
    );
  }

  if (!fileInfo || fileInfo.length === 0) {
    throw new MeetingServiceError(
      'FILE_NOT_UPLOADED',
      'File was not found in storage. Upload may have failed.',
    );
  }

  // Update status and timestamp
  await db
    .updateTable('meetings')
    .set({
      status: 'uploaded',
      uploaded_at: new Date(),
      updated_at: new Date(),
    })
    .where('id', '=', input.meetingId)
    .execute();
}

// ============================================================
// listMeetings
// ============================================================

export type MeetingSummary = {
  id: string;
  title: string;
  status: MeetingStatus;
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
  durationSeconds: number | null;
  uploadedAt: Date | null;
  createdAt: Date;
};

/**
 * Lists meetings for the active organization.
 * Ordered newest first. Includes meetings in any status.
 */
export async function listMeetings(
  clerkUserId: string,
  clerkOrgId: string,
): Promise<MeetingSummary[]> {
  const { organizationId } = await resolveContext(clerkUserId, clerkOrgId);

  const rows = await db
    .selectFrom('meetings')
    .select([
      'id',
      'title',
      'status',
      'file_name',
      'file_size_bytes',
      'file_mime_type',
      'duration_seconds',
      'uploaded_at',
      'created_at',
    ])
    .where('organization_id', '=', organizationId)
    .orderBy('created_at', 'desc')
    .execute();

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    fileName: row.file_name,
    fileSizeBytes: Number(row.file_size_bytes),
    fileMimeType: row.file_mime_type,
    durationSeconds: row.duration_seconds,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
  }));
}

// ============================================================
// getMeeting
// ============================================================

export type MeetingDetail = MeetingSummary & {
  storagePath: string;
  errorMessage: string | null;
};

/**
 * Fetches one meeting by ID, scoped to the active organization.
 * Returns null if not found.
 */
export async function getMeeting(
  clerkUserId: string,
  clerkOrgId: string,
  meetingId: string,
): Promise<MeetingDetail | null> {
  const { organizationId } = await resolveContext(clerkUserId, clerkOrgId);

  const row = await db
    .selectFrom('meetings')
    .selectAll()
    .where('id', '=', meetingId)
    .where('organization_id', '=', organizationId)
    .executeTakeFirst();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    fileName: row.file_name,
    fileSizeBytes: Number(row.file_size_bytes),
    fileMimeType: row.file_mime_type,
    durationSeconds: row.duration_seconds,
    uploadedAt: row.uploaded_at,
    createdAt: row.created_at,
    storagePath: row.storage_path,
    errorMessage: row.error_message,
  };
}
