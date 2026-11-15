'use strict';

const { query } = require('../db/pool');
const { ForbiddenError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Verifies that req.user is a member of :orgId.
 * Attaches req.orgMember = { orgId, userId, role } and req.org = organisation row.
 */
async function resolveTenant(req, res, next) {
  try {
    const orgId = req.params.orgId;
    if (!orgId) {
      return next(new NotFoundError('Organisation'));
    }

    // Verify organisation exists and user is a member in one query
    const result = await query(
      `SELECT o.id AS org_id, o.name AS org_name, o.slug, o.owner_id, o.settings, o.plan,
              om.role, om.user_id
       FROM organisations o
       JOIN org_members om ON om.org_id = o.id
       WHERE o.id = $1 AND om.user_id = $2`,
      [orgId, req.user.id]
    );

    if (result.rows.length === 0) {
      // Check if org actually exists to give more specific error
      const orgCheck = await query('SELECT id FROM organisations WHERE id = $1', [orgId]);
      if (orgCheck.rows.length === 0) {
        return next(new NotFoundError('Organisation'));
      }
      return next(new ForbiddenError('You are not a member of this organisation'));
    }

    const row = result.rows[0];
    req.org = {
      id: row.org_id,
      name: row.org_name,
      slug: row.slug,
      ownerId: row.owner_id,
      settings: row.settings,
      plan: row.plan,
    };
    req.orgMember = {
      orgId: row.org_id,
      userId: row.user_id,
      role: row.role,
    };

    logger.debug(
      { requestId: req.requestId, orgId: orgId, userId: req.user.id, role: row.role },
      'Tenant resolved'
    );

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { resolveTenant };
