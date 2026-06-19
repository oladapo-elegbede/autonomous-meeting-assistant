-- ============================================================
-- Migration: create organizations table
-- ============================================================
-- Each organization is a tenant. All app data (meetings, action
-- items, integrations) belongs to exactly one organization.
-- Multi-tenancy is enforced at the application layer using the
-- organization_id column on every business table.
-- ============================================================

-- Up Migration
-- ------------

CREATE TABLE organizations (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id    TEXT         NOT NULL UNIQUE,
  name            TEXT         NOT NULL,
  slug            TEXT         NOT NULL UNIQUE,
  logo_url        TEXT,
  plan            TEXT         NOT NULL DEFAULT 'free',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX idx_organizations_slug         ON organizations(slug);

-- Down Migration
-- --------------

---- DOWN ----

DROP TABLE IF EXISTS organizations;