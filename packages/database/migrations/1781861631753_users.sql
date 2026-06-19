-- ============================================================
-- Migration: create users table
-- ============================================================
-- Stores app-specific user data mirrored from Clerk.
-- Clerk owns authentication; this table owns app data linked to users.
-- ============================================================

-- Up Migration
-- ------------

CREATE TABLE users (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   TEXT         NOT NULL UNIQUE,
  email           TEXT         NOT NULL UNIQUE,
  full_name       TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email         ON users(email);

-- Down Migration
-- --------------

---- DOWN ----

DROP TABLE IF EXISTS users;