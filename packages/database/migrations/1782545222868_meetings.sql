-- ============================================================
-- Migration: create meetings table
-- ============================================================
-- Stores meeting recording metadata. The actual file lives in
-- Supabase Storage at the `storage_path` shown here.
--
-- Status lifecycle:
--   uploading    → User has requested an upload URL but hasn't confirmed completion
--   uploaded     → File has been uploaded to Supabase
--   transcribing → Whisper job in progress (Phase 6)
--   transcribed  → Whisper finished
--   analyzing    → GPT-4o analysis in progress (Phase 7)
--   analyzed     → Analysis complete
--   embedding    → Vector embeddings being generated (Phase 11)
--   complete     → All processing done
--   failed       → Any step failed; see error_message
-- ============================================================

-- Up Migration
-- ------------

CREATE TABLE meetings (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by         UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  title               TEXT         NOT NULL,
  status              TEXT         NOT NULL DEFAULT 'uploading'
                                   CHECK (status IN (
                                     'uploading',
                                     'uploaded',
                                     'transcribing',
                                     'transcribed',
                                     'analyzing',
                                     'analyzed',
                                     'embedding',
                                     'complete',
                                     'failed'
                                   )),

  file_name           TEXT         NOT NULL,
  file_size_bytes     BIGINT       NOT NULL,
  file_mime_type      TEXT         NOT NULL,
  storage_path        TEXT         NOT NULL,

  duration_seconds    INTEGER,
  error_message       TEXT,
  metadata            JSONB        NOT NULL DEFAULT '{}',

  uploaded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_organization_id ON meetings(organization_id);
CREATE INDEX idx_meetings_uploaded_by     ON meetings(uploaded_by);
CREATE INDEX idx_meetings_status          ON meetings(status);
CREATE INDEX idx_meetings_created_at      ON meetings(created_at DESC);

-- Composite index for the most common list query:
-- "show me org X's meetings, most recent first"
CREATE INDEX idx_meetings_org_created
  ON meetings(organization_id, created_at DESC);

-- Down Migration
-- --------------

---- DOWN ----

DROP TABLE IF EXISTS meetings;