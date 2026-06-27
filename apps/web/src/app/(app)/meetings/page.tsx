'use client';

import Link from 'next/link';
import { Video, Plus, Search, FileAudio, FileVideo, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MeetingStatusBadge } from '@/components/meetings/meeting-status-badge';
import { useMeetingsList, type MeetingSummary } from '@/hooks/use-meeting';

export default function MeetingsPage() {
  const { data: meetings, isLoading, error } = useMeetingsList();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All meetings uploaded to your workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/upload">
            <Plus className="h-4 w-4" />
            Upload Meeting
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search meetings..." className="pl-9" disabled />
        </div>
        <p className="text-xs text-muted-foreground">Search coming in Phase 11.</p>
      </div>

      {isLoading && (
        <Card className="p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading meetings...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-start gap-3 p-6">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load meetings</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {meetings && meetings.length === 0 && <EmptyMeetings />}

      {meetings && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  const isVideo = meeting.fileMimeType.startsWith('video/');

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <Link href={`/meetings/${meeting.id}`} className="block">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
            {isVideo ? (
              <FileVideo className="h-5 w-5 text-muted-foreground" />
            ) : (
              <FileAudio className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{meeting.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBytes(meeting.fileSizeBytes)} ·{' '}
              {meeting.uploadedAt ? formatRelativeDate(meeting.uploadedAt) : 'pending'}
            </p>
          </div>
          <MeetingStatusBadge status={meeting.status} />
        </CardContent>
      </Link>
    </Card>
  );
}

function EmptyMeetings() {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Video className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">No meetings yet</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Upload a meeting recording from Zoom, Microsoft Teams, or Google Meet to get an
          AI-generated summary, decisions, and action items.
        </p>
        <Button asChild className="mt-6">
          <Link href="/meetings/upload">
            <Plus className="h-4 w-4" />
            Upload your first meeting
          </Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Supported formats: MP4, MP3, M4A, WAV, WEBM · Max 50MB
        </p>
      </div>
    </Card>
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
    return `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}
