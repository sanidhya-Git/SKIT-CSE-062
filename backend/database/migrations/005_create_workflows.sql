CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  trigger JSONB NOT NULL DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  variables JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  version INT NOT NULL,
  definition JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workflow_id, version)
);

CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_definitions(id),
  org_id UUID NOT NULL REFERENCES organisations(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled','dead_letter')),
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  correlation_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_name TEXT,
  step_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','skipped','waiting_approval')),
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INT DEFAULT 0
);

CREATE INDEX idx_runs_workflow ON workflow_runs(workflow_id, org_id);
CREATE INDEX idx_runs_org ON workflow_runs(org_id, created_at DESC);
CREATE INDEX idx_step_runs_run ON workflow_step_runs(run_id);
