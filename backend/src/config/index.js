'use strict';

const required = (name) => {
  const val = process.env[name];
  if (!val) {
    console.error(`[config] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return val;
};

const optional = (name, defaultValue = undefined) => {
  return process.env[name] || defaultValue;
};

const config = {
  env: optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '4000'), 10),

  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),

  db: {
    connectionString: required('DATABASE_URL'),
    poolMax: parseInt(optional('DB_POOL_MAX', '20'), 10),
    idleTimeoutMillis: parseInt(optional('DB_IDLE_TIMEOUT', '30000'), 10),
    connectionTimeoutMillis: parseInt(optional('DB_CONN_TIMEOUT', '5000'), 10),
  },

  redis: {
    url: required('REDIS_URL'),
  },

  jwt: {
    secret: required('JWT_SECRET'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  encryption: {
    key: required('ENCRYPTION_KEY'),
  },

  ai: {
    providerOrder: optional('AI_PROVIDER_ORDER', 'anthropic,openai,gemini')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    anthropicApiKey: optional('ANTHROPIC_API_KEY'),
    openaiApiKey: optional('OPENAI_API_KEY'),
    geminiApiKey: optional('GEMINI_API_KEY'),
  },

  webhook: {
    secret: required('WEBHOOK_SECRET'),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
    aiWindowMs: parseInt(optional('AI_RATE_LIMIT_WINDOW_MS', '60000'), 10),
    aiMax: parseInt(optional('AI_RATE_LIMIT_MAX', '20'), 10),
  },

  bullmq: {
    concurrency: parseInt(optional('BULLMQ_CONCURRENCY', '5'), 10),
  },

  isDev: optional('NODE_ENV', 'development') === 'development',
  isTest: optional('NODE_ENV', 'development') === 'test',
  isProd: optional('NODE_ENV', 'development') === 'production',
};

module.exports = config;
