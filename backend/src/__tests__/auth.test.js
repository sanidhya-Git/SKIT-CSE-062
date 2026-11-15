'use strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/oneops_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
process.env.ENCRYPTION_KEY = '0'.repeat(64);
process.env.WEBHOOK_SECRET = 'test-webhook-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

const request = require('supertest');
const { app } = require('../server');

// Mock the database pool
jest.mock('../db/pool', () => {
  const users = new Map();
  const sessions = new Map();

  return {
    query: jest.fn(async (sql, params) => {
      const s = sql.trim().toUpperCase();

      // User creation
      if (s.startsWith('INSERT INTO USERS')) {
        const user = {
          id: params[0], email: params[1], name: params[3],
          created_at: new Date(), updated_at: new Date(),
        };
        users.set(params[1], { ...user, password_hash: params[2] });
        return { rows: [user], rowCount: 1 };
      }

      // Find user by email (with hash)
      if (s.includes('FROM USERS WHERE EMAIL')) {
        const email = params[0];
        const u = users.get(email);
        return { rows: u ? [u] : [], rowCount: u ? 1 : 0 };
      }

      // Check email exists
      if (s.includes('SELECT 1 FROM USERS WHERE EMAIL')) {
        const email = params[0];
        return { rows: users.has(email) ? [{ 1: 1 }] : [], rowCount: users.has(email) ? 1 : 0 };
      }

      // Find user by ID
      if (s.includes('FROM USERS WHERE ID')) {
        const id = params[0];
        for (const u of users.values()) {
          if (u.id === id) {
            const { password_hash, ...safe } = u;
            return { rows: [safe], rowCount: 1 };
          }
        }
        return { rows: [], rowCount: 0 };
      }

      // Session creation
      if (s.startsWith('INSERT INTO SESSIONS')) {
        const session = {
          id: params[0], user_id: params[1],
          refresh_token_hash: params[2], expires_at: params[3],
          created_at: new Date(),
        };
        sessions.set(params[2], session);
        return { rows: [session], rowCount: 1 };
      }

      // Find session by token hash
      if (s.includes('FROM SESSIONS') && s.includes('REFRESH_TOKEN_HASH')) {
        const hash = params[0];
        const s2 = sessions.get(hash);
        return { rows: s2 ? [s2] : [], rowCount: s2 ? 1 : 0 };
      }

      // Revoke session
      if (s.includes('UPDATE SESSIONS SET REVOKED_AT')) {
        const id = params[0];
        for (const [hash, s2] of sessions.entries()) {
          if (s2.id === id) { sessions.delete(hash); }
        }
        return { rows: [], rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    }),
    getPool: jest.fn(() => ({ query: jest.fn(async () => ({ rows: [{ 1: 1 }] })) })),
    closePool: jest.fn(),
  };
});

jest.mock('../workers/WorkflowWorker', () => ({
  startWorker: jest.fn(),
  stopWorker: jest.fn(),
}));

const BASE = '/api/v1/auth';

describe('Auth API', () => {
  const userPayload = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePass1',
  };

  let accessToken;
  let refreshToken;

  describe('POST /auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const res = await request(app).post(`${BASE}/register`).send(userPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.email).toBe(userPayload.email);
      expect(res.body.user).not.toHaveProperty('password_hash');

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('returns 409 for duplicate email', async () => {
      const res = await request(app).post(`${BASE}/register`).send(userPayload);
      expect(res.status).toBe(409);
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app).post(`${BASE}/register`).send({ email: 'bad' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for weak password', async () => {
      const res = await request(app).post(`${BASE}/register`).send({
        name: 'Test',
        email: 'newuser@example.com',
        password: 'weak',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with valid credentials', async () => {
      const res = await request(app).post(`${BASE}/login`).send({
        email: userPayload.email,
        password: userPayload.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post(`${BASE}/login`).send({
        email: userPayload.email,
        password: 'WrongPass1',
      });
      expect(res.status).toBe(401);
    });

    it('returns 401 for non-existent user', async () => {
      const res = await request(app).post(`${BASE}/login`).send({
        email: 'nobody@example.com',
        password: 'AnyPass1',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns new tokens with valid refresh token', async () => {
      const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('returns 401 for invalid refresh token', async () => {
      const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: 'invalid-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /auth/logout', () => {
    it('successfully logs out', async () => {
      // First get a fresh token
      const loginRes = await request(app).post(`${BASE}/login`).send({
        email: userPayload.email,
        password: userPayload.password,
      });
      const tokenToRevoke = loginRes.body.refreshToken;

      const res = await request(app).delete(`${BASE}/logout`).send({ refreshToken: tokenToRevoke });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when refreshToken missing', async () => {
      const res = await request(app).delete(`${BASE}/logout`).send({});
      expect(res.status).toBe(400);
    });
  });
});
