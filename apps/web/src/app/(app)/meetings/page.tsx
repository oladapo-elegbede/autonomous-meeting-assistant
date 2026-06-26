import Link from 'next/link';
import { Video, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Meetings list page.
 *
 * Lists all meetings uploaded to the active organization.
 * Currently shows an empty state — upload functionality
 * will be implemented in Phase 5.
 *
 * Once meetings exist, this page will support:
 *   - Search by title and transcript content
 *   - Filter by status, date range, tags
 *   - Sort by date, duration, etc.
 *   - Pagination
 */
export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Search and filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search meetings..." className="pl-9" disabled />
        </div>
        <p className="text-xs text-muted-foreground">
          Search available once meetings are uploaded.
        </p>
      </div>

      {/* Empty state */}
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
            Supported formats: MP4, MP3, M4A, WAV, WEBM · Max 500MB
          </p>
        </div>
      </Card>
    </div>
  );
}
