'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole, requireExactRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const WorkflowService = require('../services/WorkflowService');
const WorkflowRunnerService = require('../services/WorkflowRunnerService');
const { createWorkflowSchema, updateWorkflowSchema, runWorkflowSchema } = require('../validators/workflow');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/workflows
router.get('/', async (req, res, next) => {
  try {
    const result = await WorkflowService.list(req.params.orgId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /organisations/:orgId/workflows
router.post(
  '/',
  requireRole('builder'),
  auditLog('workflow.create', 'workflow'),
  async (req, res, next) => {
    try {
      const data = createWorkflowSchema.parse(req.body);
      const workflow = await WorkflowService.create(data, req.params.orgId, req.user.id);
      res.status(201).json(workflow);
    } catch (err) {
      next(err);
    }
  }
);

// GET /organisations/:orgId/workflows/:workflowId
router.get('/:workflowId', async (req, res, next) => {
  try {
    const workflow = await WorkflowService.getById(req.params.workflowId, req.params.orgId);
    res.json(workflow);
  } catch (err) {
    next(err);
  }
});

// PATCH /organisations/:orgId/workflows/:workflowId
router.patch(
  '/:workflowId',
  requireRole('builder'),
  auditLog('workflow.update', 'workflow', (req) => req.params.workflowId),
  async (req, res, next) => {
    try {
      const data = updateWorkflowSchema.parse(req.body);
      const workflow = await WorkflowService.update(req.params.workflowId, req.params.orgId, data, req.user.id);
      res.json(workflow);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /organisations/:orgId/workflows/:workflowId
router.delete(
  '/:workflowId',
  requireRole('builder'),
  auditLog('workflow.delete', 'workflow', (req) => req.params.workflowId),
  async (req, res, next) => {
    try {
      const result = await WorkflowService.delete(req.params.workflowId, req.params.orgId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/workflows/:workflowId/publish
router.post(
  '/:workflowId/publish',
  requireRole('builder'),
  auditLog('workflow.publish', 'workflow', (req) => req.params.workflowId),
  async (req, res, next) => {
    try {
      const workflow = await WorkflowService.publish(req.params.workflowId, req.params.orgId, req.user.id);
      res.json(workflow);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/workflows/:workflowId/pause
router.post(
  '/:workflowId/pause',
  requireRole('admin'),
  auditLog('workflow.pause', 'workflow', (req) => req.params.workflowId),
  async (req, res, next) => {
    try {
      const workflow = await WorkflowService.pause(req.params.workflowId, req.params.orgId, req.user.id);
      res.json(workflow);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/workflows/:workflowId/run
router.post(
  '/:workflowId/run',
  requireExactRole('owner', 'admin', 'builder', 'operator'),
  auditLog('workflow.run', 'workflow_run'),
  async (req, res, next) => {
    try {
      const { input, idempotencyKey } = runWorkflowSchema.parse(req.body);
      const run = await WorkflowRunnerService.enqueue(req.params.workflowId, req.params.orgId, {
        input,
        triggerType: 'manual',
        idempotencyKey,
        correlationId: req.requestId,
      });
      res.status(202).json(run);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/workflows/:workflowId/test
router.post(
  '/:workflowId/test',
  requireRole('builder'),
  async (req, res, next) => {
    try {
      const { input } = runWorkflowSchema.parse(req.body);
      const result = await WorkflowRunnerService.testRun(req.params.workflowId, req.params.orgId, { input });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
