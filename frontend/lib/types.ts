// ─── Auth ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organisationId: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole =
  | 'super_admin'
  | 'org_owner'
  | 'org_admin'
  | 'workflow_builder'
  | 'manager'
  | 'employee'
  | 'auditor';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organisationName: string;
}

// ─── Organisations ────────────────────────────────────────────────────────
export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  organisationId: string;
  role: UserRole;
  user: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

// ─── Integrations ─────────────────────────────────────────────────────────
export type IntegrationStatus = 'healthy' | 'degraded' | 'down' | 'unknown' | 'not_connected';

export interface Integration {
  id: string;
  organisationId: string;
  type: IntegrationType;
  name: string;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationType =
  | 'slack'
  | 'github'
  | 'jira'
  | 'salesforce'
  | 'email'
  | 'hubspot'
  | 'stripe'
  | 'zendesk'
  | 'notion'
  | 'linear'
  | 'pagerduty'
  | 'datadog';

export interface IntegrationConnector {
  type: IntegrationType;
  name: string;
  description: string;
  icon: string;
  requiredFields: string[];
}

// ─── Workflows ────────────────────────────────────────────────────────────
export type WorkflowStatus = 'draft' | 'published' | 'paused' | 'archived';

export type TriggerType = 'webhook' | 'schedule' | 'manual' | 'connector_event';

export type StepType =
  | 'condition'
  | 'transform'
  | 'delay'
  | 'approval'
  | 'ai_task'
  | 'connector_action'
  | 'notification';

export interface WorkflowTrigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  config: Record<string, unknown>;
  order: number;
}

export interface Workflow {
  id: string;
  organisationId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  runCount?: number;
}

export interface CreateWorkflowPayload {
  name: string;
  description: string;
  trigger: WorkflowTrigger;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
  trigger?: WorkflowTrigger;
  steps?: WorkflowStep[];
}

// ─── Workflow runs ────────────────────────────────────────────────────────
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface StepOutcome {
  stepId: string;
  stepName: string;
  status: RunStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: Record<string, unknown>;
  error?: string;
  logs?: string[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  organisationId: string;
  status: RunStatus;
  trigger: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  stepOutcomes: StepOutcome[];
  error?: string;
  correlationId: string;
}

// ─── Approvals ────────────────────────────────────────────────────────────
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Approval {
  id: string;
  organisationId: string;
  workflowId: string;
  workflowName: string;
  runId: string;
  stepId: string;
  stepName: string;
  requestedBy: string;
  status: ApprovalStatus;
  message: string;
  context: Record<string, unknown>;
  expiresAt?: string;
  decidedBy?: string;
  decidedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────
export type AIAction =
  | 'chat'
  | 'lead_score'
  | 'email_generate'
  | 'ticket_analyze'
  | 'document_summarize'
  | 'predictive_analytics'
  | 'vendor_scorecard'
  | 'workflow_suggest'
  | 'inventory_reorder'
  | 'project_health'
  | 'sales_forecast'
  | 'win_probability';

export interface AIRequest {
  action: AIAction;
  input: Record<string, unknown>;
}

export interface AIResponse {
  action: AIAction;
  result: Record<string, unknown>;
  tokensUsed: number;
  provider: string;
  latencyMs: number;
}

export interface AIUsageRecord {
  action: AIAction;
  provider: string;
  tokensUsed: number;
  cost: number;
  timestamp: string;
}

export interface AIUsageSummary {
  totalTokens: number;
  totalCost: number;
  byAction: Record<AIAction, { tokens: number; cost: number; count: number }>;
  records: AIUsageRecord[];
}

// ─── Audit log ────────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  organisationId: string;
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────
export interface AnalyticsData {
  period: string;
  workflows: {
    total: number;
    published: number;
    draft: number;
  };
  runs: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    successRate: number;
    avgDurationMs: number;
  };
  approvals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  integrations: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  runsByDay: Array<{ date: string; completed: number; failed: number }>;
  topWorkflows: Array<{ id: string; name: string; runs: number; successRate: number }>;
}

// ─── Pagination ───────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ─── API error ────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
