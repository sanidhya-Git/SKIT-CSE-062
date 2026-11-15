CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  run_id UUID REFERENCES workflow_runs(id),
  step_id TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired','cancelled')),
  requested_by UUID REFERENCES users(id),
  assigned_to UUID[],
  context JSONB DEFAULT '{}',
  decision TEXT,
  decided_by UUID REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_approvals_org ON approval_requests(org_id, status);
