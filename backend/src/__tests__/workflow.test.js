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

// Mock BullMQ Queue
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

// Maps must live inside the factory — jest.mock is hoisted above const declarations
jest.mock('../db/pool', () => {
  const workflows = new Map();
  const runs = new Map();
  return {
  query: jest.fn(async (sql, params) => {
    const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    // Tenant resolution
    if (s.includes('FROM ORGANISATIONS O') && s.includes('JOIN ORG_MEMBERS OM')) {
      if (params[0] === 'org-1' && params[1] === 'builder-user') {
        return {
          rows: [{
            org_id: 'org-1', org_name: 'Test Org', slug: 'test-org',
            owner_id: 'builder-user', settings: {}, plan: 'free',
            role: 'owner', user_id: 'builder-user',
          }],
        };
      }
      return { rows: [] };
    }

    if (s.includes('SELECT ID FROM ORGANISATIONS WHERE ID')) {
      return params[0] === 'org-1' ? { rows: [{ id: 'org-1' }] } : { rows: [] };
    }

    // Workflow CRUD
    if (s.startsWith('INSERT INTO WORKFLOW_DEFINITIONS')) {
      const wf = {
        id: params[0], org_id: params[1], name: params[2],
        description: params[3], version: 1, status: 'draft',
        trigger: params[4], steps: params[5], variables: params[6],
        created_by: params[7], created_at: new Date(), updated_at: new Date(),
      };
      workflows.set(params[0], wf);
      return { rows: [wf], rowCount: 1 };
    }

    if (s.startsWith('INSERT INTO WORKFLOW_VERSIONS')) {
      return { rows: [{ id: params[0] }], rowCount: 1 };
    }

    if (s.includes('FROM WORKFLOW_DEFINITIONS') && s.includes('WHERE ID') && !s.startsWith('DELETE')) {
      const id = params[0];
      const orgId = params[1];
      const wf = workflows.get(id);
      if (wf && wf.org_id === orgId) return { rows: [wf], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    }

    if (s.includes('COUNT(*)') && s.includes('WORKFLOW_DEFINITIONS')) {
      const orgWorkflows = [...workflows.values()].filter(w => w.org_id === params[0]);
      return { rows: [{ count: String(orgWorkflows.length) }] };
    }

    if (s.includes('FROM WORKFLOW_DEFINITIONS') && s.includes('ORDER BY')) {
      const orgWorkflows = [...workflows.values()].filter(w => w.org_id === params[0]);
      return { rows: orgWorkflows, rowCount: orgWorkflows.length };
    }

    if (s.startsWith('UPDATE WORKFLOW_DEFINITIONS')) {
      const id = params[0];
      const orgId = params[1];
      const wf = workflows.get(id);
      if (!wf || wf.org_id !== orgId) return { rows: [], rowCount: 0 };

      // Simple update: apply whatever fields are in the query
      if (s.includes('STATUS')) {
        // Find status value in params (after id and orgId)
        const statusIdx = params.findIndex((p, i) => i > 1 && typeof p === 'string' && ['draft','published','paused','archived','cancelled','running','completed','failed'].includes(p));
        if (statusIdx >= 0) wf.status = params[statusIdx];
      }
      if (s.includes('NAME')) {
        wf.name = params[2] || wf.name;
      }
      wf.published_at = wf.status === 'published' ? new Date() : wf.published_at;
      wf.updated_at = new Date();
      workflows.set(id, wf);
      return { rows: [wf], rowCount: 1 };
    }

    if (s.startsWith('DELETE FROM WORKFLOW_DEFINITIONS')) {
      const id = params[0];
      const orgId = params[1];
      const wf = workflows.get(id);
      if (wf && wf.org_id === orgId) {
        workflows.delete(id);
        return { rowCount: 1 };
      }
      return { rowCount: 0 };
    }

    // Runs
    if (s.startsWith('INSERT INTO WORKFLOW_RUNS')) {
      const run = {
        id: params[0], workflow_id: params[1], org_id: params[2],
        status: 'pending', trigger_type: params[3], trigger_data: params[4],
        created_at: new Date(),
      };
      runs.set(params[0], run);
      return { rows: [run], rowCount: 1 };
    }

    if (s.includes('FROM WORKFLOW_RUNS') && s.includes('IDEMPOTENCY_KEY')) {
      return { rows: [], rowCount: 0 };
    }

    if (s.includes('COUNT(*)') && s.includes('WORKFLOW_RUNS')) {
      return { rows: [{ count: '0' }] };
    }

    if (s.includes('FROM WORKFLOW_RUNS')) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }),
  getPool: jest.fn(() => ({ query: jest.fn(async () => ({ rows: [{ 1: 1 }] })) })),
  closePool: jest.fn(),
  };
});

function builderToken() {
  return signAccessToken({ sub: 'builder-user', email: 'builder@example.com', name: 'Builder' });
}

const BASE = '/api/v1/organisations/org-1/workflows';
const headers = () => ({ Authorization: `Bearer ${builderToken()}` });

const sampleWorkflow = {
  name: 'Test Workflow',
  description: 'A test workflow',
  trigger: { type: 'manual', config: {} },
  steps: [
    { id: 'step-1', name: 'Step 1', type: 'transform', config: { mapping: {} } },
  ],
  variables: { key: 'value' },
};

describe('Workflow API', () => {
  let createdWorkflowId;

  describe('POST /workflows (create)', () => {
    it('creates a workflow', async () => {
      const res = await request(app).post(BASE).set(headers()).send(sampleWorkflow);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe(sampleWorkflow.name);
      expect(res.body.status).toBe('draft');
      createdWorkflowId = res.body.id;
    });

    it('returns 400 for missing name', async () => {
      const res = await request(app).post(BASE).set(headers()).send({
        trigger: { type: 'manual' },
        steps: [{ id: 's1', name: 'S1', type: 'transform' }],
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 for empty steps array', async () => {
      const res = await request(app).post(BASE).set(headers()).send({
        ...sampleWorkflow,
        steps: [],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /workflows', () => {
    it('lists workflows', async () => {
      const res = await request(app).get(BASE).set(headers());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /workflows/:workflowId', () => {
    it('gets a specific workflow', async () => {
      const res = await request(app).get(`${BASE}/${createdWorkflowId}`).set(headers());
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdWorkflowId);
    });

    it('returns 404 for unknown workflow', async () => {
      const res = await request(app).get(`${BASE}/non-existent-id`).set(headers());
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /workflows/:workflowId', () => {
    it('updates a workflow', async () => {
      const res = await request(app)
        .patch(`${BASE}/${createdWorkflowId}`)
        .set(headers())
        .send({ name: 'Updated Workflow' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /workflows/:workflowId/publish', () => {
    it('publishes a workflow', async () => {
      const res = await request(app)
        .post(`${BASE}/${createdWorkflowId}/publish`)
        .set(headers());
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
    });
  });

  describe('POST /workflows/:workflowId/run', () => {
    it('enqueues a workflow run', async () => {
      const res = await request(app)
        .post(`${BASE}/${createdWorkflowId}/run`)
        .set(headers())
        .send({ input: { key: 'value' } });
      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('POST /workflows/:workflowId/test', () => {
    it('runs a test execution', async () => {
      const res = await request(app)
        .post(`${BASE}/${createdWorkflowId}/test`)
        .set(headers())
        .send({ input: {} });
      expect(res.status).toBe(200);
      expect(res.body.testMode).toBe(true);
    });
  });

  describe('POST /workflows/:workflowId/pause', () => {
    it('pauses a published workflow', async () => {
      const res = await request(app)
        .post(`${BASE}/${createdWorkflowId}/pause`)
        .set(headers());
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /workflows/:workflowId', () => {
    it('deletes a workflow', async () => {
      const res = await request(app).delete(`${BASE}/${createdWorkflowId}`).set(headers());
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
    });

    it('returns 404 for already-deleted workflow', async () => {
      const res = await request(app).delete(`${BASE}/${createdWorkflowId}`).set(headers());
      expect(res.status).toBe(404);
    });
  });
});
