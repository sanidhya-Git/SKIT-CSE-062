'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const WorkflowRunnerService = require('../services/WorkflowRunnerService');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/workflow-runs
router.get('/', async (req, res, next) => {
  try {
    const result = await WorkflowRunnerService.listRuns(req.params.orgId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /organisations/:orgId/workflow-runs/:runId
router.get('/:runId', async (req, res, next) => {
  try {
    const run = await WorkflowRunnerService.getRunById(req.params.runId, req.params.orgId);
    res.json(run);
  } catch (err) {
    next(err);
  }
});

// POST /organisations/:orgId/workflow-runs/:runId/cancel
router.post(
  '/:runId/cancel',
  requireRole('operator'),
  auditLog('run.cancel', 'workflow_run', (req) => req.params.runId),
  async (req, res, next) => {
    try {
      const result = await WorkflowRunnerService.cancel(req.params.runId, req.params.orgId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/workflow-runs/:runId/retry
router.post(
  '/:runId/retry',
  requireRole('operator'),
  auditLog('run.retry', 'workflow_run', (req) => req.params.runId),
  async (req, res, next) => {
    try {
      const run = await WorkflowRunnerService.retry(req.params.runId, req.params.orgId);
      res.status(202).json(run);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
