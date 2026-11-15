CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  before JSONB,
  after JSONB,
  ip TEXT,
  user_agent TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_org ON audit_events(org_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_events(org_id, action);
