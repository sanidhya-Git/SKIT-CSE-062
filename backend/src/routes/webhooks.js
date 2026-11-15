'use strict';

const { Router } = require('express');
const { verifyWebhookSignature } = require('../utils/webhook');
const WorkflowRunnerService = require('../services/WorkflowRunnerService');
const WorkflowService = require('../services/WorkflowService');
const { query } = require('../db/pool');
const logger = require('../utils/logger');

const router = Router();

/**
 * POST /api/v1/webhooks/:orgId/:workflowId
 * No JWT auth — HMAC-SHA256 signature verification via X-OneOps-Signature header
 * Raw body is captured so signature can be verified before JSON parse
 */
router.post('/:orgId/:workflowId', async (req, res, next) => {
  try {
    const { orgId, workflowId } = req.params;
    const signature = req.headers['x-oneops-signature'];

    // rawBody is attached by express.raw in server.js for this route prefix
    const rawBody = req.rawBody;
    if (!rawBody) {
      return res.status(400).json({ error: 'Missing request body', code: 'BAD_REQUEST' });
    }

    // Verify HMAC signature
    const valid = verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      logger.warn({ orgId, workflowId, action: 'webhook.invalid_signature' }, 'Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature', code: 'UNAUTHORIZED' });
    }

    // Parse body (already verified)
    let body;
    try {
      body = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' });
    }

    // Verify org exists
    const orgCheck = await query('SELECT id FROM organisations WHERE id = $1', [orgId]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organisation not found', code: 'NOT_FOUND' });
    }

    // Verify workflow exists and is published
    const workflow = await WorkflowService.getById(workflowId, orgId);
    if (workflow.status !== 'published') {
      return res.status(409).json({ error: `Workflow is not active (status: ${workflow.status})`, code: 'CONFLICT' });
    }

    // Idempotency key from header
    const idempotencyKey = req.headers['x-idempotency-key'] || null;

    // Enqueue the run
    const run = await WorkflowRunnerService.enqueue(workflowId, orgId, {
      input: body,
      triggerType: 'webhook',
      idempotencyKey,
      correlationId: req.headers['x-correlation-id'] || null,
    });

    logger.info({ orgId, workflowId, runId: run.id, action: 'webhook.triggered' }, 'Webhook triggered workflow run');

    res.status(202).json({ runId: run.id, status: run.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
