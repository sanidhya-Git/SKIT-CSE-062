'use strict';

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const ApprovalService = require('../services/ApprovalService');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/approvals
router.get('/', requireRole('approver'), async (req, res, next) => {
  try {
    const result = await ApprovalService.list(req.params.orgId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /organisations/:orgId/approvals/:approvalId/approve
router.post(
  '/:approvalId/approve',
  requireRole('approver'),
  auditLog('approval.approve', 'approval', (req) => req.params.approvalId),
  async (req, res, next) => {
    try {
      const { decision } = z.object({ decision: z.string().optional() }).parse(req.body);
      const result = await ApprovalService.approve(
        req.params.approvalId,
        req.params.orgId,
        req.user.id,
        { decision }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// POST /organisations/:orgId/approvals/:approvalId/reject
router.post(
  '/:approvalId/reject',
  requireRole('approver'),
  auditLog('approval.reject', 'approval', (req) => req.params.approvalId),
  async (req, res, next) => {
    try {
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);
      const result = await ApprovalService.reject(
        req.params.approvalId,
        req.params.orgId,
        req.user.id,
        { reason }
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
