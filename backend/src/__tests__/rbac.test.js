'use strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/oneops_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.ENCRYPTION_KEY = '0'.repeat(64);
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

const request = require('supertest');
const { signAccessToken } = require('../utils/crypto');
const { app } = require('../server');

jest.mock('../workers/WorkflowWorker', () => ({
  startWorker: jest.fn(),
  stopWorker: jest.fn(),
}));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    getJob: jest.fn().mockResolvedValue(null),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Set up members with different roles in the same org
const MEMBERS = {
  'user-owner': 'owner',
  'user-admin': 'admin',
  'user-builder': 'builder',
  'user-approver': 'approver',
  'user-operator': 'operator',
  'user-auditor': 'auditor',
};

const ORG_ID = 'org-rbac';

jest.mock('../db/pool', () => {
  const workflows = new Map([
    ['wf-1', { id: 'wf-1', org_id: 'org-rbac', name: 'Test WF', status: 'published',
               trigger: {}, steps: [{ id: 's1', name: 'S1', type: 'transform', config: {} }],
               variables: {}, version: 1, created_at: new Date() }],
  ]);
  const runs = new Map([
    ['run-1', { id: 'run-1', workflow_id: 'wf-1', org_id: 'org-rbac', status: 'running',
                trigger_type: 'manual', trigger_data: {}, created_at: new Date(), workflow_name: 'Test WF' }],
  ]);
  const approvals = new Map([
    ['approval-1', { id: 'approval-1', org_id: 'org-rbac', status: 'pending',
                     run_id: 'run-1', step_id: 's1', type: 'manual',
                     assigned_to: [], created_at: new Date() }],
  ]);

  const MEMBERS_LOCAL = {
    'user-owner': 'owner', 'user-admin': 'admin', 'user-builder': 'builder',
    'user-approver': 'approver', 'user-operator': 'operator', 'user-auditor': 'auditor',
  };

  return {
    query: jest.fn(async (sql, params) => {
      const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

      // Tenant resolution
      if (s.includes('FROM ORGANISATIONS O') && s.includes('JOIN ORG_MEMBERS OM')) {
        const orgId = params[0];
        const userId = params[1];
        const role = MEMBERS_LOCAL[userId];
        if (orgId === 'org-rbac' && role) {
          return {
            rows: [{
              org_id: 'org-rbac', org_name: 'RBAC Org', slug: 'rbac-org',
              owner_id: 'user-owner', settings: {}, plan: 'free',
              role, user_id: userId,
            }],
          };
        }
        return { rows: [] };
      }

      if (s.includes('SELECT ID FROM ORGANISATIONS WHERE ID')) {
        return params[0] === 'org-rbac' ? { rows: [{ id: 'org-rbac' }] } : { rows: [] };
      }

      // Workflows
      if (s.includes('FROM WORKFLOW_DEFINITIONS') && s.includes('WHERE ID')) {
        const wf = workflows.get(params[0]);
        if (wf && wf.org_id === params[1]) return { rows: [wf], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }

      if (s.includes('COUNT(*)') && s.includes('WORKFLOW_DEFINITIONS')) {
        return { rows: [{ count: String([...workflows.values()].filter(w => w.org_id === params[0]).length) }] };
      }

      if (s.includes('FROM WORKFLOW_DEFINITIONS') && s.includes('ORDER BY')) {
        const wfs = [...workflows.values()].filter(w => w.org_id === params[0]);
        return { rows: wfs, rowCount: wfs.length };
      }

      if (s.startsWith('INSERT INTO WORKFLOW_DEFINITIONS')) {
        return { rows: [{ id: params[0], ...params }], rowCount: 1 };
      }

      if (s.startsWith('INSERT INTO WORKFLOW_VERSIONS')) {
        return { rows: [{ id: params[0] }], rowCount: 1 };
      }

      // Runs
      if (s.includes('COUNT(*)') && s.includes('WORKFLOW_RUNS')) {
        return { rows: [{ count: '0' }] };
      }

      if (s.includes('FROM WORKFLOW_RUNS') && s.includes('WHERE ID')) {
        const run = runs.get(params[0]);
        if (run && run.org_id === params[1]) return { rows: [run], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }

      if (s.includes('INSERT INTO WORKFLOW_RUNS')) {
        const run = { id: params[0], workflow_id: params[1], org_id: params[2], status: 'pending', trigger_type: params[3] };
        return { rows: [run], rowCount: 1 };
      }

      if (s.includes('FROM WORKFLOW_RUNS') && s.includes('IDEMPOTENCY_KEY')) {
        return { rows: [], rowCount: 0 };
      }

      if (s.includes('UPDATE WORKFLOW_RUNS')) {
        return { rows: [], rowCount: 1 };
      }

      if (s.includes('FROM WORKFLOW_STEP_RUNS')) {
        return { rows: [], rowCount: 0 };
      }

      // Approvals
      if (s.includes('COUNT(*)') && s.includes('APPROVAL_REQUESTS')) {
        return { rows: [{ count: String([...approvals.values()].filter(a => a.org_id === params[0]).length) }] };
      }

      if (s.includes('FROM APPROVAL_REQUESTS') && s.includes('LEFT JOIN USERS')) {
        const approvalList = [...approvals.values()].filter(a => a.org_id === params[0]);
        return { rows: approvalList, rowCount: approvalList.length };
      }

      // Audit — COUNT must come before generic FROM check
      if (s.includes('COUNT(*)') && s.includes('AUDIT_EVENTS')) {
        return { rows: [{ count: '0' }] };
      }

      if (s.includes('FROM AUDIT_EVENTS')) {
        return { rows: [], rowCount: 0 };
      }

      // Members
      if (s.includes('FROM ORG_MEMBERS OM') && s.includes('JOIN USERS U')) {
        const members = Object.entries(MEMBERS_LOCAL).map(([userId, role]) => ({
          id: userId, email: `${userId}@example.com`, name: userId, role,
        }));
        return { rows: members, rowCount: members.length };
      }

      // AI
      if (s.startsWith('INSERT INTO AI_REQUESTS')) {
        return { rows: [{ id: 'ai-req-1' }], rowCount: 1 };
      }

      if (s.includes('FROM AI_REQUESTS') && s.includes('GROUP BY')) {
        return { rows: [], rowCount: 0 };
      }

      return { rows: [], rowCount: 0 };
    }),
    getPool: jest.fn(() => ({ query: jest.fn(async () => ({ rows: [{ 1: 1 }] })) })),
    closePool: jest.fn(),
  };
});

jest.mock('../providers/ClaudeProvider', () => jest.fn().mockImplementation(() => ({
  isAvailable: () => true,
  defaultModel: 'claude-3-5-haiku-20241022',
  complete: jest.fn().mockResolvedValue({ result: { score: 70 }, promptTokens: 50, completionTokens: 25, costUsd: 0 }),
})));

jest.mock('../providers/OpenAIProvider', () => jest.fn().mockImplementation(() => ({ isAvailable: () => false })));
jest.mock('../providers/GeminiProvider', () => jest.fn().mockImplementation(() => ({ isAvailable: () => false })));

function tokenFor(userId) {
  return signAccessToken({ sub: userId, email: `${userId}@example.com`, name: userId });
}

function auth(userId) {
  return { Authorization: `Bearer ${tokenFor(userId)}` };
}

const BASE = `/api/v1/organisations/${ORG_ID}`;

describe('RBAC Permissions', () => {
  describe('Read-only endpoints (all roles can access)', () => {
    const readers = ['user-owner', 'user-admin', 'user-builder', 'user-auditor', 'user-operator'];

    for (const user of readers) {
      it(`${MEMBERS[user]} can list workflows`, async () => {
        const res = await request(app).get(`${BASE}/workflows`).set(auth(user));
        expect(res.status).toBe(200);
      });
    }
  });

  describe('Workflow creation (builder and above)', () => {
    const canCreate = ['user-owner', 'user-admin', 'user-builder'];
    const cannotCreate = ['user-approver', 'user-operator', 'user-auditor'];

    const workflowBody = {
      name: 'New WF',
      trigger: { type: 'manual' },
      steps: [{ id: 's1', name: 'Step', type: 'transform' }],
    };

    for (const user of canCreate) {
      it(`${MEMBERS[user]} can create workflows`, async () => {
        const res = await request(app).post(`${BASE}/workflows`).set(auth(user)).send(workflowBody);
        expect(res.status).toBe(201);
      });
    }

    for (const user of cannotCreate) {
      it(`${MEMBERS[user]} cannot create workflows`, async () => {
        const res = await request(app).post(`${BASE}/workflows`).set(auth(user)).send(workflowBody);
        expect(res.status).toBe(403);
      });
    }
  });

  describe('Workflow runs (operator and above)', () => {
    const canRun = ['user-owner', 'user-admin', 'user-builder', 'user-operator'];
    const cannotRun = ['user-approver', 'user-auditor'];

    for (const user of canRun) {
      it(`${MEMBERS[user]} can trigger runs`, async () => {
        const res = await request(app)
          .post(`${BASE}/workflows/wf-1/run`)
          .set(auth(user))
          .send({ input: {} });
        expect(res.status).toBe(202);
      });
    }

    for (const user of cannotRun) {
      it(`${MEMBERS[user]} cannot trigger runs`, async () => {
        const res = await request(app)
          .post(`${BASE}/workflows/wf-1/run`)
          .set(auth(user))
          .send({ input: {} });
        expect(res.status).toBe(403);
      });
    }
  });

  describe('Approvals (approver and above)', () => {
    const canApprove = ['user-owner', 'user-admin', 'user-builder', 'user-approver'];
    const cannotApprove = ['user-operator', 'user-auditor'];

    for (const user of canApprove) {
      it(`${MEMBERS[user]} can list approvals`, async () => {
        const res = await request(app).get(`${BASE}/approvals`).set(auth(user));
        expect(res.status).toBe(200);
      });
    }

    for (const user of cannotApprove) {
      it(`${MEMBERS[user]} cannot list approvals`, async () => {
        const res = await request(app).get(`${BASE}/approvals`).set(auth(user));
        expect(res.status).toBe(403);
      });
    }
  });

  describe('Audit log (auditor and above)', () => {
    const canRead = ['user-owner', 'user-admin', 'user-builder', 'user-approver', 'user-operator', 'user-auditor'];

    for (const user of canRead) {
      it(`${MEMBERS[user]} can read audit log`, async () => {
        const res = await request(app).get(`${BASE}/audit`).set(auth(user));
        expect(res.status).toBe(200);
      });
    }
  });

  describe('Member management (admin and above)', () => {
    const canManage = ['user-owner', 'user-admin'];
    const cannotManage = ['user-builder', 'user-approver', 'user-operator', 'user-auditor'];

    for (const user of canManage) {
      it(`${MEMBERS[user]} can list members`, async () => {
        const res = await request(app).get(`${BASE}/members`).set(auth(user));
        expect(res.status).toBe(200);
      });
    }

    for (const user of cannotManage) {
      it(`${MEMBERS[user]} cannot invite members`, async () => {
        const res = await request(app)
          .post(`${BASE}/members`)
          .set(auth(user))
          .send({ email: 'new@example.com', role: 'operator' });
        expect(res.status).toBe(403);
      });
    }
  });

  describe('AI usage stats (admin only)', () => {
    const canSeeUsage = ['user-owner', 'user-admin'];
    const cannotSeeUsage = ['user-builder', 'user-approver', 'user-operator', 'user-auditor'];

    for (const user of canSeeUsage) {
      it(`${MEMBERS[user]} can see AI usage`, async () => {
        const res = await request(app).get(`${BASE}/ai/usage`).set(auth(user));
        expect(res.status).toBe(200);
      });
    }

    for (const user of cannotSeeUsage) {
      it(`${MEMBERS[user]} cannot see AI usage`, async () => {
        const res = await request(app).get(`${BASE}/ai/usage`).set(auth(user));
        expect(res.status).toBe(403);
      });
    }
  });
});
