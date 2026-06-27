'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';

export type MeetingStatus =
  | 'uploading'
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'analyzing'
  | 'analyzed'
  | 'embedding'
  | 'complete'
  | 'failed';

export type MeetingDetail = {
  id: string;
  title: string;
  status: MeetingStatus;
  fileName: string;
  fileSizeBytes: number;
  fileMimeType: string;
  durationSeconds: number | null;
  uploadedAt: string | null;
  createdAt: string;
  storagePath: string;
  errorMessage: string | null;
};

export type MeetingSummary = Omit<MeetingDetail, 'storagePath' | 'errorMessage'>;

/**
 * Fetches a single meeting by ID.
 *
 * Returns React Query state — { data, isLoading, error, etc. }.
 * Auto-refetches on window focus disabled by default in our QueryProvider.
 *
 * Cache key: ['meetings', meetingId]
 * Invalidate this exact key after mutations to refresh data.
 */
export function useMeeting(meetingId: string | null) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['meetings', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return apiClient.get<MeetingDetail>(`/api/v1/meetings/${meetingId}`, token);
    },
  });
}

/**
 * Fetches the list of all meetings for the active organization.
 *
 * Cache key: ['meetings']
 * Invalidated automatically after successful uploads (see useUploadMeeting).
 */
export function useMeetingsList() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return apiClient.get<MeetingSummary[]>('/api/v1/meetings', token);
    },
  });
}
