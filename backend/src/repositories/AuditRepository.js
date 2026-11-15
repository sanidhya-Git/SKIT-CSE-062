'use strict';

const { query } = require('../db/pool');
const { paginate, paginatedResult } = require('../db/helpers');

class AuditRepository {
  async create({ id, orgId, userId, action, resourceType, resourceId, before, after, ip, userAgent, correlationId }) {
    const result = await query(
      `INSERT INTO audit_events (id, org_id, user_id, action, resource_type, resource_id, before, after, ip, user_agent, correlation_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, created_at`,
      [
        id, orgId, userId || null, action, resourceType || null, resourceId || null,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        ip || null, userAgent || null, correlationId || null,
      ]
    );
    return result.rows[0];
  }

  async list(orgId, opts = {}) {
    const { limit, offset, page, pageSize } = paginate(opts);
    const conditions = ['ae.org_id = $1'];
    const params = [orgId];
    let idx = 2;

    if (opts.action) {
      conditions.push(`ae.action = $${idx++}`);
      params.push(opts.action);
    }
    if (opts.resource_type) {
      conditions.push(`ae.resource_type = $${idx++}`);
      params.push(opts.resource_type);
    }
    if (opts.from) {
      conditions.push(`ae.created_at >= $${idx++}`);
      params.push(new Date(opts.from));
    }
    if (opts.to) {
      conditions.push(`ae.created_at <= $${idx++}`);
      params.push(new Date(opts.to));
    }

    const where = conditions.join(' AND ');

    const countResult = await query(
      `SELECT COUNT(*) FROM audit_events ae WHERE ${where}`,
      params
    );

    const dataResult = await query(
      `SELECT ae.id, ae.user_id, ae.action, ae.resource_type, ae.resource_id,
              ae.ip, ae.correlation_id, ae.created_at,
              u.email AS user_email, u.name AS user_name
       FROM audit_events ae
       LEFT JOIN users u ON u.id = ae.user_id
       WHERE ${where}
       ORDER BY ae.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    return paginatedResult(dataResult.rows, countResult.rows[0].count, page, pageSize);
  }
}

module.exports = new AuditRepository();
