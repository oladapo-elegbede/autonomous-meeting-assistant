import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { Video, ListChecks, Clock, Users, Plus, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Dashboard home.
 *
 * The primary landing page after sign-in. Shows key workspace stats
 * and a starting point for the user's most common action: uploading
 * a meeting.
 *
 * Stats are zeroed for now and will be wired to real data in Phase 5
 * (meetings) and Phase 8 (action items).
 */
export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload meetings to get summaries, action items, and follow-ups automatically.
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/upload">
            <Plus className="h-4 w-4" />
            Upload Meeting
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Meetings" value="0" icon={Video} />
        <StatCard label="Open Action Items" value="0" icon={ListChecks} />
        <StatCard label="Hours Processed" value="0h" icon={Clock} />
        <StatCard label="Team Members" value="1" icon={Users} />
      </div>

      {/* Recent meetings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Recent Meetings</CardTitle>
          <Link
            href="/meetings"
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <EmptyMeetings />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyMeetings() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Video className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-medium">No meetings yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload your first meeting recording to generate summaries, decisions, and action items
        automatically.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/meetings/upload">
          <Plus className="h-4 w-4" />
          Upload your first meeting
        </Link>
      </Button>
    </div>
  );
}
