CREATE TABLE ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  run_id UUID REFERENCES workflow_runs(id),
  action TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  prompt_tokens INT,
  completion_tokens INT,
  cost_usd NUMERIC(10,6),
  latency_ms INT,
  success BOOL NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ai_requests_org ON ai_requests(org_id, created_at DESC);
