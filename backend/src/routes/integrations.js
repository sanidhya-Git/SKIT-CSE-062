'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const IntegrationService = require('../services/IntegrationService');
const { createIntegrationSchema } = require('../validators/integration');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/integrations
router.get('/', async (req, res, next) => {
  try {
    const integrations = await IntegrationService.list(req.params.orgId);
    res.json({ data: integrations });
  } catch (err) {
    next(err);
  }
});

// POST /organisations/:orgId/integrations
router.post(
  '/',
  requireRole('admin'),
  auditLog('integration.create', 'integration'),
  async (req, res, next) => {
    try {
      const data = createIntegrationSchema.parse(req.body);
      const integration = await IntegrationService.create(data, req.params.orgId);
      res.status(201).json(integration);
    } catch (err) {
      next(err);
    }
  }
);

// GET /organisations/:orgId/integrations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const integration = await IntegrationService.getById(req.params.id, req.params.orgId);
    res.json(integration);
  } catch (err) {
    next(err);
  }
});

// DELETE /organisations/:orgId/integrations/:id
router.delete(
  '/:id',
  requireRole('admin'),
  auditLog('integration.delete', 'integration', (req) => req.params.id),
  async (req, res, next) => {
    try {
      await IntegrationService.delete(req.params.id, req.params.orgId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/integrations/:id/test
router.post('/:id/test', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await IntegrationService.testConnection(req.params.id, req.params.orgId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
