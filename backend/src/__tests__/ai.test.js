'use strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/oneops_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.ENCRYPTION_KEY = '0'.repeat(64);
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
process.env.AI_PROVIDER_ORDER = 'anthropic';

const request = require('supertest');
const { signAccessToken } = require('../utils/crypto');
const { app } = require('../server');

jest.mock('../workers/WorkflowWorker', () => ({
  startWorker: jest.fn(),
  stopWorker: jest.fn(),
}));

// Mock AI providers
jest.mock('../providers/ClaudeProvider', () => {
  return jest.fn().mockImplementation(() => ({
    isAvailable: () => true,
    defaultModel: 'claude-3-5-haiku-20241022',
    complete: jest.fn().mockResolvedValue({
      result: { score: 85, grade: 'B', reasoning: 'Strong lead', top_factors: ['budget', 'timeline'] },
      promptTokens: 100,
      completionTokens: 50,
      costUsd: 0.00025,
    }),
  }));
});

jest.mock('../providers/OpenAIProvider', () => {
  return jest.fn().mockImplementation(() => ({
    isAvailable: () => false,
    defaultModel: 'gpt-4o-mini',
    complete: jest.fn(),
  }));
});

jest.mock('../providers/GeminiProvider', () => {
  return jest.fn().mockImplementation(() => ({
    isAvailable: () => false,
    defaultModel: 'gemini-1.5-flash',
    complete: jest.fn(),
  }));
});

jest.mock('../db/pool', () => ({
  query: jest.fn(async (sql, params) => {
    const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();

    if (s.includes('FROM ORGANISATIONS O') && s.includes('JOIN ORG_MEMBERS OM')) {
      if (params[0] === 'org-ai' && params[1] === 'ai-user') {
        return {
          rows: [{
            org_id: 'org-ai', org_name: 'AI Org', slug: 'ai-org',
            owner_id: 'ai-user', settings: {}, plan: 'pro',
            role: 'owner', user_id: 'ai-user',
          }],
        };
      }
      return { rows: [] };
    }

    if (s.includes('SELECT ID FROM ORGANISATIONS WHERE ID')) {
      return params[0] === 'org-ai' ? { rows: [{ id: 'org-ai' }] } : { rows: [] };
    }

    // Record AI request
    if (s.startsWith('INSERT INTO AI_REQUESTS')) {
      return { rows: [{ id: 'ai-req-1' }], rowCount: 1 };
    }

    // AI usage
    if (s.includes('FROM AI_REQUESTS') && s.includes('GROUP BY')) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  }),
  getPool: jest.fn(() => ({ query: jest.fn(async () => ({ rows: [{ 1: 1 }] })) })),
  closePool: jest.fn(),
}));

function aiToken() {
  return signAccessToken({ sub: 'ai-user', email: 'ai@example.com', name: 'AI User' });
}

const BASE = '/api/v1/organisations/org-ai/ai';
const headers = () => ({ Authorization: `Bearer ${aiToken()}` });

describe('AI API', () => {
  describe('POST /ai (score_lead)', () => {
    it('scores a lead', async () => {
      const res = await request(app)
        .post(BASE)
        .set(headers())
        .send({
          action: 'score_lead',
          lead: { name: 'John Doe', company: 'Acme', budget: 100000 },
        });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('score_lead');
      expect(res.body).toHaveProperty('result');
      expect(res.body).toHaveProperty('provider');
    });
  });

  describe('POST /ai (chat)', () => {
    it('handles chat action', async () => {
      const res = await request(app)
        .post(BASE)
        .set(headers())
        .send({
          action: 'chat',
          messages: [{ role: 'user', content: 'Hello, how can you help?' }],
        });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('chat');
    });
  });

  describe('POST /ai (summarize)', () => {
    it('summarizes text', async () => {
      const res = await request(app)
        .post(BASE)
        .set(headers())
        .send({
          action: 'summarize',
          text: 'A long document that needs to be summarized...',
        });
      expect(res.status).toBe(200);
      expect(res.body.action).toBe('summarize');
    });
  });

  describe('POST /ai (invalid action)', () => {
    it('returns 400 for unknown action', async () => {
      const res = await request(app)
        .post(BASE)
        .set(headers())
        .send({ action: 'unknown_action' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /ai (missing action)', () => {
    it('returns 400 when action is missing', async () => {
      const res = await request(app)
        .post(BASE)
        .set(headers())
        .send({ text: 'some text' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /ai/usage', () => {
    it('returns AI usage stats', async () => {
      const res = await request(app).get(`${BASE}/usage`).set(headers());
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });
  });

  describe('All supported actions', () => {
    const actions = [
      { action: 'generate_email', context: { product: 'OneOps' }, recipient: 'cto@acme.com' },
      { action: 'analyse_ticket', ticket: { title: 'Bug', description: 'App crashes' } },
      { action: 'vendor_scorecard', vendors: [{ name: 'V1' }], criteria: ['cost'] },
      { action: 'suggest_workflow', description: 'Automate lead follow-up' },
      { action: 'project_health', project: { name: 'P1', tasks: 10, completed: 7 } },
      { action: 'win_probability', opportunity: { amount: 50000, stage: 'Proposal' } },
    ];

    for (const payload of actions) {
      it(`handles ${payload.action}`, async () => {
        const res = await request(app).post(BASE).set(headers()).send(payload);
        expect(res.status).toBe(200);
        expect(res.body.action).toBe(payload.action);
      });
    }
  });
});
