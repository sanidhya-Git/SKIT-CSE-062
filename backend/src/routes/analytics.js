'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const AuditService = require('../services/AuditService');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/analytics
router.get('/', requireRole('auditor'), async (req, res, next) => {
  try {
    const analytics = await AuditService.getAnalytics(req.params.orgId);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
