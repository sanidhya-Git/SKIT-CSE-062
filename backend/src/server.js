'use strict';

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = require('./config');
const logger = require('./utils/logger');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimit');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const organisationsRouter = require('./routes/organisations');
const membersRouter = require('./routes/members');
const integrationsRouter = require('./routes/integrations');
const workflowsRouter = require('./routes/workflows');
const runsRouter = require('./routes/runs');
const approvalsRouter = require('./routes/approvals');
const aiRouter = require('./routes/ai');
const auditRouter = require('./routes/audit');
const analyticsRouter = require('./routes/analytics');
const webhooksRouter = require('./routes/webhooks');

const app = express();

// Trust proxy (for correct IP behind load balancers)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — allow configured frontend origins plus Vercel preview deployments
const allowedOrigins = config.frontendUrl
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);
      // Allow any explicitly listed origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel preview deployment for the project
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Idempotency-Key',
      'X-Correlation-Id',
      'X-OneOps-Signature',
    ],
    exposedHeaders: ['X-Request-Id'],
  })
);

// Compression
app.use(compression());

// Raw body capture for webhook signature verification (must be before json parser for webhook paths)
app.use('/api/v1/webhooks', (req, res, next) => {
  let chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
  req.on('error', next);
});

// JSON body parser for all other routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/webhooks')) return next();
  express.json({ limit: '2mb' })(req, res, next);
});

// Request ID
app.use(requestId);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        status: res.statusCode,
        durationMs: Date.now() - start,
        userId: req.user?.id,
        orgId: req.params?.orgId,
      },
      'Request handled'
    );
  });
  next();
});

// Global rate limiter
app.use(globalLimiter);

// Health endpoints (no auth, no rate limit beyond global)
app.use('/health', healthRouter);

// API routes
const api = '/api/v1';

app.use(`${api}/auth`, authRouter);
app.use(`${api}/organisations`, organisationsRouter);
app.use(`${api}/organisations/:orgId/members`, membersRouter);
app.use(`${api}/organisations/:orgId/integrations`, integrationsRouter);
app.use(`${api}/organisations/:orgId/workflows`, workflowsRouter);
app.use(`${api}/organisations/:orgId/workflow-runs`, runsRouter);
app.use(`${api}/organisations/:orgId/approvals`, approvalsRouter);
app.use(`${api}/organisations/:orgId/ai`, aiRouter);
app.use(`${api}/organisations/:orgId/audit`, auditRouter);
app.use(`${api}/organisations/:orgId/analytics`, analyticsRouter);
app.use(`${api}/webhooks`, webhooksRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    requestId: req.requestId,
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ─── Start server ───────────────────────────────────────────────────────────────

let server;
let workerStarted = false;

async function start() {
  // Start BullMQ worker — skip in test mode and in Vercel serverless (stateless, no persistent process)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!config.isTest && !isServerless) {
    try {
      const { startWorker } = require('./workers/WorkflowWorker');
      startWorker();
      workerStarted = true;
    } catch (err) {
      logger.warn({ err }, 'Failed to start BullMQ worker (Redis may be unavailable)');
    }
  } else if (isServerless) {
    logger.info('Serverless environment detected — BullMQ worker disabled');
  }

  server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env },
      `OneOps API listening on port ${config.port}`
    );
  });

  return server;
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal) {
  logger.info({ signal }, 'Received shutdown signal, beginning graceful shutdown');

  if (workerStarted) {
    try {
      const { stopWorker } = require('./workers/WorkflowWorker');
      await stopWorker();
    } catch (err) {
      logger.error({ err }, 'Error stopping BullMQ worker');
    }
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
    logger.info('HTTP server closed');
  }

  try {
    const { closePool } = require('./db/pool');
    await closePool();
  } catch (err) {
    logger.error({ err }, 'Error closing database pool');
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  shutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
});

// Start unless this file is required (e.g. in tests)
if (require.main === module) {
  start().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}

module.exports = { app, start, shutdown };
