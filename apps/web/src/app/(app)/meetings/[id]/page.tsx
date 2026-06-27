'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileAudio, FileVideo, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MeetingStatusBadge } from '@/components/meetings/meeting-status-badge';
import { useMeeting } from '@/hooks/use-meeting';

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: meeting, isLoading, error } = useMeeting(id);

  return (
    <div className="space-y-6">
      <Link
        href="/meetings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to meetings
      </Link>

      {isLoading && <DetailSkeleton />}

      {error && (
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load meeting</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {meeting && (
        <>
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {meeting.fileMimeType.startsWith('video/') ? 'Video' : 'Audio'} recording uploaded{' '}
              {meeting.uploadedAt ? formatRelativeDate(meeting.uploadedAt) : 'recently'}.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
                  {meeting.fileMimeType.startsWith('video/') ? (
                    <FileVideo className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <FileAudio className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate font-medium">{meeting.fileName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatBytes(meeting.fileSizeBytes)}</span>
                    <span>·</span>
                    <span>{meeting.fileMimeType}</span>
                    {meeting.durationSeconds && (
                      <>
                        <span>·</span>
                        <span>{formatDuration(meeting.durationSeconds)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {meeting.errorMessage && (
            <Card>
              <CardContent className="flex items-start gap-3 p-6">
                <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Processing error</p>
                  <p className="mt-1 text-sm text-muted-foreground">{meeting.errorMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h2 className="text-base font-medium">Coming next</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Transcript, summary, decisions, and action items will appear here automatically once
                the AI processing pipeline is built in the next phase.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  return date.toLocaleDateString();
}
