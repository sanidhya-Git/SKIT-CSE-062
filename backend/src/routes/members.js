'use strict';

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { resolveTenant } = require('../middleware/tenant');
const { requireRole } = require('../middleware/rbac');
const { auditLog } = require('../middleware/auditLogger');
const TenantService = require('../services/TenantService');
const { inviteMemberSchema, updateMemberRoleSchema } = require('../validators/organisation');

const router = Router({ mergeParams: true });

router.use(authenticate, resolveTenant);

// GET /organisations/:orgId/members
router.get('/', async (req, res, next) => {
  try {
    const members = await TenantService.listMembers(req.params.orgId);
    res.json({ data: members });
  } catch (err) {
    next(err);
  }
});

// POST /organisations/:orgId/members
router.post(
  '/',
  requireRole('admin'),
  auditLog('member.invite', 'member'),
  async (req, res, next) => {
    try {
      const data = inviteMemberSchema.parse(req.body);
      const member = await TenantService.inviteMember(req.params.orgId, data, req.user.id);
      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /organisations/:orgId/members/:userId
router.patch(
  '/:userId',
  requireRole('admin'),
  auditLog('member.update_role', 'member', (req) => req.params.userId),
  async (req, res, next) => {
    try {
      const { role } = updateMemberRoleSchema.parse(req.body);
      const updated = await TenantService.updateMemberRole(
        req.params.orgId,
        req.params.userId,
        role,
        req.orgMember
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /organisations/:orgId/members/:userId
router.delete(
  '/:userId',
  requireRole('admin'),
  auditLog('member.remove', 'member', (req) => req.params.userId),
  async (req, res, next) => {
    try {
      await TenantService.removeMember(req.params.orgId, req.params.userId, req.orgMember);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
