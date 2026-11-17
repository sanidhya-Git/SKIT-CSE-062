CREATE TABLE org_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_invites_token ON org_invites(token);
CREATE INDEX idx_org_invites_email ON org_invites(email, org_id);
