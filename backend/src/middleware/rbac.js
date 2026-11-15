'use strict';

const { ForbiddenError } = require('../utils/errors');

const ROLE_HIERARCHY = {
  owner: 6,
  admin: 5,
  builder: 4,
  approver: 3,
  operator: 2,
  auditor: 1,
};

/**
 * requireRole(...roles) → middleware
 * Passes if req.orgMember.role satisfies at least one of the given minimum roles.
 * Uses hierarchy: owner > admin > builder > approver > operator > auditor
 */
function requireRole(...minimumRoles) {
  return (req, res, next) => {
    if (!req.orgMember) {
      return next(new ForbiddenError('Not a member of this organisation'));
    }

    const memberLevel = ROLE_HIERARCHY[req.orgMember.role] || 0;
    const allowed = minimumRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      return memberLevel >= requiredLevel;
    });

    if (!allowed) {
      return next(
        new ForbiddenError(
          `Required role: ${minimumRoles.join(' or ')}. Your role: ${req.orgMember.role}`
        )
      );
    }

    next();
  };
}

/**
 * requireExactRole(...roles) → middleware
 * Passes only if req.orgMember.role is exactly one of the given roles.
 */
function requireExactRole(...roles) {
  return (req, res, next) => {
    if (!req.orgMember) {
      return next(new ForbiddenError('Not a member of this organisation'));
    }

    if (!roles.includes(req.orgMember.role)) {
      return next(
        new ForbiddenError(
          `Required role: ${roles.join(' or ')}. Your role: ${req.orgMember.role}`
        )
      );
    }

    next();
  };
}

module.exports = { requireRole, requireExactRole, ROLE_HIERARCHY };
