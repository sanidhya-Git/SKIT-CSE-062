'use strict';

const { query } = require('../db/pool');
const { paginate, paginatedResult, withTransaction } = require('../db/helpers');

class WorkflowRepository {
  async findById(id, orgId) {
    const result = await query(
      `SELECT id, org_id, name, description, version, status, trigger, steps, variables,
              created_by, published_at, created_at, updated_at
       FROM workflow_definitions
       WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );
    return result.rows[0] || null;
  }

  async list(orgId, opts = {}) {
    const { limit, offset, page, pageSize } = paginate(opts);
    const statusFilter = opts.status ? 'AND status = $3' : '';
    const params = opts.status ? [orgId, limit, opts.status] : [orgId, limit];

    const countResult = await query(
      `SELECT COUNT(*) FROM workflow_definitions WHERE org_id = $1 ${statusFilter}`,
      opts.status ? [orgId, opts.status] : [orgId]
    );

    const dataResult = await query(
      `SELECT id, org_id, name, description, version, status, trigger, created_by, published_at, created_at, updated_at
       FROM workflow_definitions
       WHERE org_id = $1 ${statusFilter}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET ${opts.status ? '$4' : '$3'}`,
      opts.status ? [orgId, limit, opts.status, offset] : [orgId, limit, offset]
    );

    return paginatedResult(dataResult.rows, countResult.rows[0].count, page, pageSize);
  }

  async create({ id, orgId, name, description, trigger, steps, variables, createdBy }) {
    const result = await query(
      `INSERT INTO workflow_definitions (id, org_id, name, description, trigger, steps, variables, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, org_id, name, description, version, status, trigger, steps, variables, created_by, created_at, updated_at`,
      [
        id,
        orgId,
        name,
        description || null,
        JSON.stringify(trigger),
        JSON.stringify(steps ?? []),
        JSON.stringify(variables || {}),
        createdBy,
      ]
    );
    return result.rows[0];
  }

  async update(id, orgId, updates) {
    const fields = [];
    const values = [id, orgId];
    let idx = 3;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.trigger !== undefined) { fields.push(`trigger = $${idx++}`); values.push(JSON.stringify(updates.trigger)); }
    if (updates.steps !== undefined) { fields.push(`steps = $${idx++}`); values.push(JSON.stringify(updates.steps)); }
    if (updates.variables !== undefined) { fields.push(`variables = $${idx++}`); values.push(JSON.stringify(updates.variables)); }
    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.publishedAt !== undefined) { fields.push(`published_at = $${idx++}`); values.push(updates.publishedAt); }
    if (updates.version !== undefined) { fields.push(`version = $${idx++}`); values.push(updates.version); }

    if (fields.length === 0) return this.findById(id, orgId);

    fields.push('updated_at = NOW()');

    const result = await query(
      `UPDATE workflow_definitions SET ${fields.join(', ')}
       WHERE id = $1 AND org_id = $2
       RETURNING id, org_id, name, description, version, status, trigger, steps, variables, created_by, published_at, created_at, updated_at`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(id, orgId) {
    const result = await query(
      'DELETE FROM workflow_definitions WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    return result.rowCount > 0;
  }

  async saveVersion({ id, workflowId, version, definition, createdBy }) {
    const result = await query(
      `INSERT INTO workflow_versions (id, workflow_id, version, definition, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workflow_id, version, created_at`,
      [id, workflowId, version, JSON.stringify(definition), createdBy]
    );
    return result.rows[0];
  }

  async getVersions(workflowId, orgId) {
    const result = await query(
      `SELECT wv.id, wv.workflow_id, wv.version, wv.created_by, wv.created_at, u.name AS created_by_name
       FROM workflow_versions wv
       JOIN workflow_definitions wd ON wd.id = wv.workflow_id
       LEFT JOIN users u ON u.id = wv.created_by
       WHERE wv.workflow_id = $1 AND wd.org_id = $2
       ORDER BY wv.version DESC`,
      [workflowId, orgId]
    );
    return result.rows;
  }

  // Workflow runs
  async createRun({ id, workflowId, orgId, triggerType, triggerData, correlationId, idempotencyKey }) {
    const result = await query(
      `INSERT INTO workflow_runs (id, workflow_id, org_id, trigger_type, trigger_data, correlation_id, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, workflow_id, org_id, status, trigger_type, trigger_data, created_at`,
      [id, workflowId, orgId, triggerType, JSON.stringify(triggerData || {}), correlationId, idempotencyKey || null]
    );
    return result.rows[0];
  }

  async findRunById(runId, orgId) {
    const result = await query(
      `SELECT r.id, r.workflow_id, r.org_id, r.status, r.trigger_type, r.trigger_data,
              r.started_at, r.completed_at, r.error, r.correlation_id, r.idempotency_key, r.created_at,
              w.name AS workflow_name
       FROM workflow_runs r
       JOIN workflow_definitions w ON w.id = r.workflow_id
       WHERE r.id = $1 AND r.org_id = $2`,
      [runId, orgId]
    );
    return result.rows[0] || null;
  }

  async listRuns(orgId, opts = {}) {
    const { limit, offset, page, pageSize } = paginate(opts);

    const countResult = await query(
      'SELECT COUNT(*) FROM workflow_runs WHERE org_id = $1',
      [orgId]
    );
    const dataResult = await query(
      `SELECT r.id, r.workflow_id, r.org_id, r.status, r.trigger_type, r.started_at,
              r.completed_at, r.error, r.created_at, w.name AS workflow_name
       FROM workflow_runs r
       JOIN workflow_definitions w ON w.id = r.workflow_id
       WHERE r.org_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    );
    return paginatedResult(dataResult.rows, countResult.rows[0].count, page, pageSize);
  }

  async updateRun(runId, orgId, updates) {
    const fields = [];
    const values = [runId, orgId];
    let idx = 3;

    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.startedAt !== undefined) { fields.push(`started_at = $${idx++}`); values.push(updates.startedAt); }
    if (updates.completedAt !== undefined) { fields.push(`completed_at = $${idx++}`); values.push(updates.completedAt); }
    if (updates.error !== undefined) { fields.push(`error = $${idx++}`); values.push(updates.error); }

    if (fields.length === 0) return;

    await query(
      `UPDATE workflow_runs SET ${fields.join(', ')} WHERE id = $1 AND org_id = $2`,
      values
    );
  }

  async getStepRuns(runId) {
    const result = await query(
      `SELECT id, run_id, step_id, step_name, step_type, status, input, output, error,
              started_at, completed_at, retry_count
       FROM workflow_step_runs
       WHERE run_id = $1
       ORDER BY started_at ASC NULLS LAST`,
      [runId]
    );
    return result.rows;
  }

  async upsertStepRun({ id, runId, stepId, stepName, stepType, status, input, output, error, startedAt, completedAt, retryCount }) {
    const result = await query(
      `INSERT INTO workflow_step_runs (id, run_id, step_id, step_name, step_type, status, input, output, error, started_at, completed_at, retry_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         output = EXCLUDED.output,
         error = EXCLUDED.error,
         completed_at = EXCLUDED.completed_at,
         retry_count = EXCLUDED.retry_count
       RETURNING *`,
      [id, runId, stepId, stepName, stepType, status,
       input ? JSON.stringify(input) : null,
       output ? JSON.stringify(output) : null,
       error || null, startedAt || null, completedAt || null, retryCount || 0]
    );
    return result.rows[0];
  }

  async findRunByIdempotencyKey(key, orgId) {
    const result = await query(
      'SELECT id, status FROM workflow_runs WHERE idempotency_key = $1 AND org_id = $2',
      [key, orgId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new WorkflowRepository();
