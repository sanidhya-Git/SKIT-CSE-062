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

/**
 * Tenant isolation test: user of org A cannot access org B's resources
 */
jest.mock('../db/pool', () => {
  // org A data
  const orgA = { id: 'org-a', name: 'Org A', slug: 'org-a', owner_id: 'user-a', settings: {}, plan: 'free' };
  const orgB = { id: 'org-b', name: 'Org B', slug: 'org-b', owner_id: 'user-b', settings: {}, plan: 'free' };

  return {
    query: jest.fn(async (sql, params) => {
      const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

      // Org member lookup (used by resolveTenant middleware)
      if (s.includes('FROM ORGANISATIONS O') && s.includes('JOIN ORG_MEMBERS OM')) {
        const orgId = params[0];
        const userId = params[1];

        if (orgId === 'org-a' && userId === 'user-a') {
          return {
            rows: [{
              org_id: 'org-a', org_name: 'Org A', slug: 'org-a',
              owner_id: 'user-a', settings: {}, plan: 'free',
              role: 'owner', user_id: 'user-a',
            }],
          };
        }
        if (orgId === 'org-b' && userId === 'user-b') {
          return {
            rows: [{
              org_id: 'org-b', org_name: 'Org B', slug: 'org-b',
              owner_id: 'user-b', settings: {}, plan: 'free',
              role: 'owner', user_id: 'user-b',
            }],
          };
        }
        // Cross-org access — return empty to trigger 403
        return { rows: [] };
      }

      // Org check (exists but user not member)
      if (s.includes('SELECT ID FROM ORGANISATIONS WHERE ID')) {
        const orgId = params[0];
        if (orgId === 'org-a') return { rows: [{ id: 'org-a' }] };
        if (orgId === 'org-b') return { rows: [{ id: 'org-b' }] };
        return { rows: [] };
      }

      // COUNT must come before generic FROM check to avoid empty rows[0]
      if (s.includes('COUNT(*)') && s.includes('WORKFLOW_DEFINITIONS')) {
        const orgId = params[0];
        const cnt = orgId === 'org-a' ? '1' : '0';
        return { rows: [{ count: cnt }] };
      }

      // Workflow list — only return for correct org
      if (s.includes('FROM WORKFLOW_DEFINITIONS') && s.includes('ORG_ID')) {
        const orgId = params[0];
        if (orgId === 'org-a') {
          return { rows: [{ id: 'wf-a', name: 'Workflow A', org_id: 'org-a' }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      return { rows: [], rowCount: 0 };
    }),
    getPool: jest.fn(() => ({ query: jest.fn(async () => ({ rows: [{ 1: 1 }] })) })),
    closePool: jest.fn(),
  };
});

function tokenFor(userId) {
  return signAccessToken({ sub: userId, email: `${userId}@example.com`, name: userId });
}

describe('Tenant Isolation', () => {
  const tokenA = tokenFor('user-a');
  const tokenB = tokenFor('user-b');

  describe('User A accessing Org A (own org)', () => {
    it('can list workflows in org A', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-a/workflows')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
    });
  });

  describe('User A accessing Org B (cross-tenant)', () => {
    it('returns 403 when user A tries to access org B workflows', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-b/workflows')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 when user A tries to list org B members', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-b/members')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 when user A tries to list org B integrations', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-b/integrations')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 when user A tries to access org B audit log', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-b/audit')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(403);
    });

    it('returns 403 when user A tries to run workflow in org B', async () => {
      const res = await request(app)
        .post('/api/v1/organisations/org-b/workflows/some-wf-id/run')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ input: {} });
      expect(res.status).toBe(403);
    });
  });

  describe('User B accessing Org B (own org)', () => {
    it('can access org B', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-b/workflows')
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Authentication enforcement', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/organisations/org-a/workflows');
      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed token', async () => {
      const res = await request(app)
        .get('/api/v1/organisations/org-a/workflows')
        .set('Authorization', 'Bearer not-a-valid-jwt');
      expect(res.status).toBe(401);
    });
  });
});
