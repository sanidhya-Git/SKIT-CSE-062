'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const AuditService = require('../services/AuditService');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/audit
router.get('/', requireRole('auditor'), async (req, res, next) => {
  try {
    const result = await AuditService.list(req.params.orgId, {
      page: req.query.page,
      limit: req.query.limit,
      action: req.query.action,
      resource_type: req.query.resource_type,
      from: req.query.from,
      to: req.query.to,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
