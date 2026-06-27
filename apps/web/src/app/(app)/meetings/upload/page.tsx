import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { UploadDropzone } from '@/components/meetings/upload-dropzone';

/**
 * Upload meeting page.
 *
 * Hosts the drag-and-drop component inside our app shell.
 * The dropzone owns all upload state and orchestration.
 */
export default function UploadMeetingPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/meetings"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to meetings
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload Meeting</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a meeting recording to generate a transcript, summary, and action items.
        </p>
      </div>

      <UploadDropzone />
    </div>
  );
}
