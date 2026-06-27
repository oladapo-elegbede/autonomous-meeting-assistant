'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, uploadToSignedUrl, ApiError } from '@/lib/api-client';

/**
 * Upload state machine.
 *
 *   idle          → no upload in progress
 *   preparing     → calling our API to get a signed URL
 *   uploading     → sending the file to Supabase
 *   finalizing    → calling our API to mark upload complete
 *   success       → all done
 *   error         → something failed; see errorMessage
 */
export type UploadStatus = 'idle' | 'preparing' | 'uploading' | 'finalizing' | 'success' | 'error';

export type UploadState = {
  status: UploadStatus;
  fileName: string | null;
  progress: number;
  meetingId: string | null;
  errorMessage: string | null;
};

type PrepareUploadResponse = {
  meetingId: string;
  uploadUrl: string;
  uploadToken: string;
  storagePath: string;
  expiresInSeconds: number;
};

const INITIAL_STATE: UploadState = {
  status: 'idle',
  fileName: null,
  progress: 0,
  meetingId: null,
  errorMessage: null,
};

/**
 * Hook that handles uploading a meeting file end-to-end.
 *
 * Three-step flow:
 *   1. Ask our API for a signed upload URL (and create the meeting row)
 *   2. PUT the file directly to Supabase using that signed URL
 *   3. Call our API to mark the meeting as uploaded
 *
 * Returns the current upload state plus an upload() function.
 * Calling upload() multiple times resets and starts a fresh upload.
 */
export function useUploadMeeting() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const upload = useCallback(
    async (file: File, title?: string) => {
      setState({
        status: 'preparing',
        fileName: file.name,
        progress: 0,
        meetingId: null,
        errorMessage: null,
      });

      try {
        const token = await getToken();
        if (!token) {
          throw new ApiError('NO_TOKEN', 'Authentication required.', 401);
        }

        // Step 1: prepare the upload
        const prep = await apiClient.post<PrepareUploadResponse>(
          '/api/v1/meetings/upload-url',
          {
            fileName: file.name,
            fileSizeBytes: file.size,
            fileMimeType: file.type,
            title: title?.trim() || undefined,
          },
          token,
        );

        setState((prev) => ({
          ...prev,
          status: 'uploading',
          meetingId: prep.meetingId,
          progress: 0,
        }));

        // Step 2: upload the file directly to Supabase
        await uploadToSignedUrl(prep.uploadUrl, file, {
          onProgress: (percent) => {
            setState((prev) => ({ ...prev, progress: percent }));
          },
        });

        // Step 3: tell our API the upload finished
        setState((prev) => ({ ...prev, status: 'finalizing' }));

        await apiClient.post(`/api/v1/meetings/${prep.meetingId}/complete`, undefined, token);

        setState((prev) => ({ ...prev, status: 'success', progress: 100 }));

        // Invalidate the meetings list so it refetches with the new row
        await queryClient.invalidateQueries({ queryKey: ['meetings'] });

        return prep.meetingId;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Unknown error during upload';

        setState((prev) => ({
          ...prev,
          status: 'error',
          errorMessage: message,
        }));

        throw err;
      }
    },
    [getToken, queryClient],
  );

  return { state, upload, reset };
}
