'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, File as FileIcon, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useUploadMeeting } from '@/hooks/use-upload-meeting';

/**
 * File MIME types we accept on the client.
 * The server enforces the same list — this is just for early UX feedback.
 */
const ACCEPTED_FILES = {
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'audio/webm': ['.webm'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
};

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Drag-and-drop file upload component.
 *
 * Three visual states:
 *   - Empty (no file selected): drop zone with instructions
 *   - Selected (file picked, not yet uploaded): preview + upload button
 *   - Uploading / Success / Error: progress bar and status feedback
 */
export function UploadDropzone() {
  const router = useRouter();
  const { state, upload, reset } = useUploadMeeting();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const first = rejectedFiles[0];
      const errorMsg = first.errors[0]?.message ?? 'File rejected';
      toast.error(errorMsg);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setTitle(file.name.replace(/\.[^.]+$/, '')); // strip extension as default title
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: state.status !== 'idle' && state.status !== 'error',
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      const meetingId = await upload(selectedFile, title);
      toast.success('Meeting uploaded successfully');
      router.push(`/meetings/${meetingId}`);
    } catch {
      toast.error('Upload failed. See details below.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTitle('');
    reset();
  };

  const isBusy =
    state.status === 'preparing' || state.status === 'uploading' || state.status === 'finalizing';

  // ============================================================
  // EMPTY STATE — no file selected yet
  // ============================================================

  if (!selectedFile) {
    return (
      <Card
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-12 transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-foreground/40 hover:bg-muted/30',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold">
          {isDragActive ? 'Drop the file here' : 'Drag a meeting recording here'}
        </h3>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          Or click to browse. Supported formats: MP3, M4A, WAV, MP4, WebM, MOV. Max 50 MB.
        </p>
      </Card>
    );
  }

  // ============================================================
  // SELECTED / UPLOADING / DONE STATE
  // ============================================================

  return (
    <Card className="p-6">
      {/* File preview */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(selectedFile.size)} · {selectedFile.type || 'unknown type'}
          </p>
        </div>
        {state.status === 'idle' && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Title input (only before upload starts) */}
      {state.status === 'idle' && (
        <div className="mt-6 space-y-2">
          <Label htmlFor="meeting-title">Meeting title</Label>
          <Input
            id="meeting-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sprint planning, weekly standup, etc."
            maxLength={500}
          />
        </div>
      )}

      {/* Progress and status */}
      {(isBusy || state.status === 'success') && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{statusLabel(state.status)}</span>
            <span className="text-muted-foreground">{state.progress}%</span>
          </div>
          <Progress value={state.progress} />
        </div>
      )}

      {/* Error message */}
      {state.status === 'error' && state.errorMessage && (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Upload failed</p>
            <p className="mt-1 text-muted-foreground">{state.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success message */}
      {state.status === 'success' && (
        <div className="mt-6 flex items-start gap-2 rounded-md border border-green-600/50 bg-green-50 p-4 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700 dark:text-green-400" />
          <div className="text-sm">
            <p className="font-medium text-green-700 dark:text-green-400">Upload complete</p>
            <p className="mt-1 text-muted-foreground">Redirecting to your meeting...</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex justify-end gap-2">
        {state.status === 'idle' && (
          <Button onClick={handleUpload} disabled={!title.trim()}>
            Upload Meeting
          </Button>
        )}
        {state.status === 'error' && (
          <>
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Retry</Button>
          </>
        )}
        {isBusy && (
          <Button disabled>
            <Loader2 className="h-4 w-4 animate-spin" />
            {statusLabel(state.status)}
          </Button>
        )}
      </div>
    </Card>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'preparing':
      return 'Preparing upload...';
    case 'uploading':
      return 'Uploading file';
    case 'finalizing':
      return 'Finalizing';
    case 'success':
      return 'Complete';
    default:
      return status;
  }
}
