'use strict';

const { query } = require('../db/pool');
const { paginate, paginatedResult } = require('../db/helpers');

class ApprovalRepository {
  async create({ id, orgId, runId, stepId, type, requestedBy, assignedTo, context, expiresAt }) {
    const result = await query(
      `INSERT INTO approval_requests (id, org_id, run_id, step_id, type, requested_by, assigned_to, context, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, org_id, run_id, step_id, type, status, requested_by, assigned_to, context, expires_at, created_at`,
      [
        id, orgId, runId || null, stepId || null, type, requestedBy || null,
        assignedTo || [],
        JSON.stringify(context || {}),
        expiresAt || null,
      ]
    );
    return result.rows[0];
  }

  async findById(id, orgId) {
    const result = await query(
      `SELECT ar.id, ar.org_id, ar.run_id, ar.step_id, ar.type, ar.status, ar.requested_by,
              ar.assigned_to, ar.context, ar.decision, ar.decided_by, ar.decided_at, ar.expires_at, ar.created_at,
              u.name AS requester_name, u.email AS requester_email
       FROM approval_requests ar
       LEFT JOIN users u ON u.id = ar.requested_by
       WHERE ar.id = $1 AND ar.org_id = $2`,
      [id, orgId]
    );
    return result.rows[0] || null;
  }

  async list(orgId, opts = {}) {
    const { limit, offset, page, pageSize } = paginate(opts);
    const statusFilter = opts.status ? 'AND ar.status = $2' : '';
    const params = opts.status ? [orgId, opts.status, limit, offset] : [orgId, limit, offset];

    const countResult = await query(
      `SELECT COUNT(*) FROM approval_requests ar WHERE ar.org_id = $1 ${statusFilter}`,
      opts.status ? [orgId, opts.status] : [orgId]
    );

    const dataResult = await query(
      `SELECT ar.id, ar.run_id, ar.step_id, ar.type, ar.status, ar.requested_by,
              ar.assigned_to, ar.expires_at, ar.created_at,
              u.name AS requester_name, u.email AS requester_email
       FROM approval_requests ar
       LEFT JOIN users u ON u.id = ar.requested_by
       WHERE ar.org_id = $1 ${statusFilter}
       ORDER BY ar.created_at DESC
       LIMIT $${opts.status ? 3 : 2} OFFSET $${opts.status ? 4 : 3}`,
      params
    );

    return paginatedResult(dataResult.rows, countResult.rows[0].count, page, pageSize);
  }

  async decide(id, orgId, { status, decision, decidedBy, reason }) {
    const result = await query(
      `UPDATE approval_requests
       SET status = $3, decision = $4, decided_by = $5, decided_at = NOW()
       WHERE id = $1 AND org_id = $2 AND status = 'pending'
       RETURNING id, status, decision, decided_by, decided_at`,
      [id, orgId, status, decision || reason || null, decidedBy]
    );
    return result.rows[0] || null;
  }

  async expirePending() {
    const result = await query(
      `UPDATE approval_requests
       SET status = 'expired'
       WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < NOW()
       RETURNING id`,
      []
    );
    return result.rows;
  }
}

module.exports = new ApprovalRepository();
