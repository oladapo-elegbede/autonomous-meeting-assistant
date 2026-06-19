-- ============================================================
-- Migration: create organization_members table
-- ============================================================
-- Junction table linking users to organizations with a role.
--
-- One user can be a member of multiple organizations.
-- One organization can have many members.
-- Each membership has exactly one role.
--
-- Roles are stored as TEXT with a CHECK constraint. We choose
-- this over a Postgres ENUM because adding new role values to
-- an ENUM requires a migration; with TEXT + CHECK it is one
-- ALTER statement. Easier to evolve over time.
-- ============================================================

-- Up Migration
-- ------------

CREATE TABLE organization_members (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT         NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
  joined_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_org_user UNIQUE (organization_id, user_id)
);

CREATE INDEX idx_org_members_organization_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id         ON organization_members(user_id);
CREATE INDEX idx_org_members_role            ON organization_members(role);

-- Down Migration
-- --------------

---- DOWN ----

DROP TABLE IF EXISTS organization_members;
