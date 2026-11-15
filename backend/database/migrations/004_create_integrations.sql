CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  credentials_encrypted BYTEA,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected','disconnected','error')),
  scopes TEXT[],
  settings JSONB DEFAULT '{}',
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_integrations_org ON integrations(org_id);
