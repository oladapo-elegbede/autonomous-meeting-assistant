import { Badge } from '@/components/ui/badge';

/**
 * Visual status badge for meetings.
 *
 * Maps the internal MeetingStatus enum to a user-friendly label
 * and a color appropriate for that status's meaning.
 */

type MeetingStatus =
  | 'uploading'
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'analyzing'
  | 'analyzed'
  | 'embedding'
  | 'complete'
  | 'failed';

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  uploading: { label: 'Uploading', variant: 'outline' },
  uploaded: { label: 'Uploaded', variant: 'secondary' },
  transcribing: { label: 'Transcribing', variant: 'secondary' },
  transcribed: { label: 'Transcribed', variant: 'secondary' },
  analyzing: { label: 'Analyzing', variant: 'secondary' },
  analyzed: { label: 'Analyzed', variant: 'secondary' },
  embedding: { label: 'Indexing', variant: 'secondary' },
  complete: { label: 'Ready', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
