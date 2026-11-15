'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const TenantService = require('../services/TenantService');
const { createOrgSchema, updateOrgSchema } = require('../validators/organisation');

const router = Router();

// All routes need authentication
router.use(authenticate);

// GET /organisations — list orgs for current user
router.get('/', async (req, res, next) => {
  try {
    const orgs = await TenantService.listUserOrgs(req.user.id);
    res.json({ data: orgs });
  } catch (err) {
    next(err);
  }
});

// POST /organisations — create new org
router.post(
  '/',
  auditLog('organisation.create', 'organisation'),
  async (req, res, next) => {
    try {
      const data = createOrgSchema.parse(req.body);
      const org = await TenantService.createOrganisation(data, req.user.id);
      res.status(201).json(org);
    } catch (err) {
      next(err);
    }
  }
);

// Routes below need tenant context
router.use('/:orgId', resolveTenant);

// GET /organisations/:orgId
router.get('/:orgId', async (req, res, next) => {
  try {
    res.json(req.org);
  } catch (err) {
    next(err);
  }
});

// PATCH /organisations/:orgId
router.patch(
  '/:orgId',
  requireRole('admin'),
  auditLog('organisation.update', 'organisation', (req) => req.params.orgId),
  async (req, res, next) => {
    try {
      const data = updateOrgSchema.parse(req.body);
      const org = await TenantService.updateOrg(req.params.orgId, data);
      res.json(org);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
