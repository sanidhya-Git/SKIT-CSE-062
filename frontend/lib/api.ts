import {
  AIRequest,
  AIResponse,
  AIUsageSummary,
  AnalyticsData,
  Approval,
  AuditEntry,
  AuthResponse,
  CreateWorkflowPayload,
  Integration,
  LoginPayload,
  OrgMember,
  Organisation,
  PaginatedResponse,
  RegisterPayload,
  UpdateWorkflowPayload,
  UserRole,
  Workflow,
  WorkflowRun,
} from './types';
import { buildQueryString } from './utils';

// ─── Base fetch ───────────────────────────────────────────────────────────

/**
 * Base fetch function for /api/proxy/* routes.
 * Token injection is handled server-side by the proxy; on the client we pass
 * the in-memory access token via the Authorization header.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
      else if (body.error) message = body.error;
    } catch {
      // ignore parse error
    }
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  // Some endpoints return 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: (payload: LoginPayload) =>
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Login failed. Check your email and password.');
      }
      return res.json() as Promise<AuthResponse>;
    }),

  register: (payload: RegisterPayload) =>
    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? 'Registration failed. Please try again.');
      }
      return res.json() as Promise<AuthResponse>;
    }),

  logout: () =>
    fetch('/api/auth/logout', { method: 'POST' }),

  refresh: () =>
    fetch('/api/auth/refresh', { method: 'POST' }).then(async res => {
      if (!res.ok) throw new Error('Session expired. Please sign in again.');
      return res.json() as Promise<AuthResponse>;
    }),
};

// ─── Organisations ────────────────────────────────────────────────────────

export const orgsApi = {
  list: (token: string) =>
    apiFetch<{ data: Organisation[] }>('/organisations', {}, token).then(r => r.data),

  create: (token: string, name: string, slug: string) =>
    apiFetch<Organisation>(
      '/organisations',
      { method: 'POST', body: JSON.stringify({ name, slug }) },
      token
    ),

  getMembers: (token: string, orgId: string, page = 1, pageSize = 20) =>
    apiFetch<{ data: Array<{ id: string; email: string; name: string; role: string; joined_at: string }> }>(
      `/organisations/${orgId}/members${buildQueryString({ page, pageSize })}`,
      {},
      token
    ).then(r => ({
      data: r.data.map(m => ({
        id: m.id,
        userId: m.id,
        organisationId: orgId,
        role: m.role as UserRole,
        user: { id: m.id, name: m.name, email: m.email },
        joinedAt: m.joined_at,
      })) as OrgMember[],
    })),

  addMember: (token: string, orgId: string, email: string, role: string) =>
    apiFetch<OrgMember>(
      `/organisations/${orgId}/members`,
      { method: 'POST', body: JSON.stringify({ email, role }) },
      token
    ),

  updateMember: (token: string, orgId: string, userId: string, role: string) =>
    apiFetch<OrgMember>(
      `/organisations/${orgId}/members/${userId}`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
      token
    ),

  removeMember: (token: string, orgId: string, userId: string) =>
    apiFetch<void>(
      `/organisations/${orgId}/members/${userId}`,
      { method: 'DELETE' },
      token
    ),
};

// ─── Integrations ─────────────────────────────────────────────────────────

export const integrationsApi = {
  list: (token: string, orgId: string) =>
    apiFetch<{ data: Integration[] }>(`/organisations/${orgId}/integrations`, {}, token).then(r => r.data),

  create: (token: string, orgId: string, type: string, name: string, config: Record<string, unknown>) =>
    apiFetch<Integration>(
      `/organisations/${orgId}/integrations`,
      { method: 'POST', body: JSON.stringify({ type, name, config }) },
      token
    ),

  delete: (token: string, orgId: string, id: string) =>
    apiFetch<void>(
      `/organisations/${orgId}/integrations/${id}`,
      { method: 'DELETE' },
      token
    ),

  test: (token: string, orgId: string, id: string) =>
    apiFetch<{ success: boolean; message: string }>(
      `/organisations/${orgId}/integrations/${id}/test`,
      { method: 'POST' },
      token
    ),
};

// ─── Workflows ────────────────────────────────────────────────────────────

export const workflowsApi = {
  list: (
    token: string,
    orgId: string,
    params: { page?: number; pageSize?: number; status?: string; search?: string } = {}
  ) =>
    apiFetch<PaginatedResponse<Workflow>>(
      `/organisations/${orgId}/workflows${buildQueryString(params)}`,
      {},
      token
    ),

  get: (token: string, orgId: string, workflowId: string) =>
    apiFetch<Workflow>(
      `/organisations/${orgId}/workflows/${workflowId}`,
      {},
      token
    ),

  create: (token: string, orgId: string, payload: CreateWorkflowPayload) =>
    apiFetch<Workflow>(
      `/organisations/${orgId}/workflows`,
      { method: 'POST', body: JSON.stringify(payload) },
      token
    ),

  update: (token: string, orgId: string, workflowId: string, payload: UpdateWorkflowPayload) =>
    apiFetch<Workflow>(
      `/organisations/${orgId}/workflows/${workflowId}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      token
    ),

  delete: (token: string, orgId: string, workflowId: string) =>
    apiFetch<void>(
      `/organisations/${orgId}/workflows/${workflowId}`,
      { method: 'DELETE' },
      token
    ),

  publish: (token: string, orgId: string, workflowId: string) =>
    apiFetch<Workflow>(
      `/organisations/${orgId}/workflows/${workflowId}/publish`,
      { method: 'POST' },
      token
    ),

  pause: (token: string, orgId: string, workflowId: string) =>
    apiFetch<Workflow>(
      `/organisations/${orgId}/workflows/${workflowId}/pause`,
      { method: 'POST' },
      token
    ),

  run: (token: string, orgId: string, workflowId: string, input?: Record<string, unknown>) =>
    apiFetch<WorkflowRun>(
      `/organisations/${orgId}/workflows/${workflowId}/run`,
      { method: 'POST', body: JSON.stringify(input ?? {}) },
      token
    ),

  test: (token: string, orgId: string, workflowId: string) =>
    apiFetch<WorkflowRun>(
      `/organisations/${orgId}/workflows/${workflowId}/test`,
      { method: 'POST' },
      token
    ),
};

// ─── Workflow runs ────────────────────────────────────────────────────────

export const runsApi = {
  list: (
    token: string,
    orgId: string,
    params: { page?: number; pageSize?: number; status?: string; workflowId?: string } = {}
  ) =>
    apiFetch<PaginatedResponse<WorkflowRun>>(
      `/organisations/${orgId}/workflow-runs${buildQueryString(params)}`,
      {},
      token
    ),

  get: (token: string, orgId: string, runId: string) =>
    apiFetch<WorkflowRun>(
      `/organisations/${orgId}/workflow-runs/${runId}`,
      {},
      token
    ),
};

// ─── Approvals ────────────────────────────────────────────────────────────

export const approvalsApi = {
  list: (
    token: string,
    orgId: string,
    params: { page?: number; pageSize?: number; status?: string } = {}
  ) =>
    apiFetch<PaginatedResponse<Approval>>(
      `/organisations/${orgId}/approvals${buildQueryString(params)}`,
      {},
      token
    ),

  approve: (token: string, orgId: string, approvalId: string, comment?: string) =>
    apiFetch<Approval>(
      `/organisations/${orgId}/approvals/${approvalId}/approve`,
      { method: 'POST', body: JSON.stringify({ comment }) },
      token
    ),

  reject: (token: string, orgId: string, approvalId: string, reason: string) =>
    apiFetch<Approval>(
      `/organisations/${orgId}/approvals/${approvalId}/reject`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      token
    ),
};

// ─── AI ───────────────────────────────────────────────────────────────────

export const aiApi = {
  run: (token: string, orgId: string, request: AIRequest) =>
    apiFetch<AIResponse>(
      `/organisations/${orgId}/ai`,
      { method: 'POST', body: JSON.stringify(request) },
      token
    ),

  getUsage: (token: string, orgId: string) =>
    apiFetch<AIUsageSummary>(
      `/organisations/${orgId}/ai/usage`,
      {},
      token
    ),
};

// ─── Analytics ────────────────────────────────────────────────────────────

export const analyticsApi = {
  get: (token: string, orgId: string, params: { period?: string } = {}) =>
    apiFetch<AnalyticsData>(
      `/organisations/${orgId}/analytics${buildQueryString(params)}`,
      {},
      token
    ),
};

// ─── Audit log ────────────────────────────────────────────────────────────

export const auditApi = {
  list: (
    token: string,
    orgId: string,
    params: {
      page?: number;
      pageSize?: number;
      action?: string;
      actorId?: string;
      from?: string;
      to?: string;
    } = {}
  ) =>
    apiFetch<{ data: Array<Record<string, unknown>>; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      `/organisations/${orgId}/audit${buildQueryString(params)}`,
      {},
      token
    ).then(r => ({
      pagination: r.pagination,
      data: r.data.map(e => ({
        id: e.id as string,
        organisationId: orgId,
        actorId: e.user_id as string,
        actorName: (e.user_name as string) ?? '',
        action: e.action as string,
        resourceType: (e.resource_type as string) ?? '',
        resourceId: (e.resource_id as string) ?? '',
        resourceName: (e.resource_id as string) ?? '',
        details: {},
        ipAddress: (e.ip as string) ?? '',
        userAgent: '',
        timestamp: e.created_at as string,
      })) as AuditEntry[],
    })),
};
