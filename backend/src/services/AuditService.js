'use strict';

const { v4: uuidv4 } = require('uuid');
const AuditRepository = require('../repositories/AuditRepository');
const { query } = require('../db/pool');
const logger = require('../utils/logger');

class AuditService {
  async log({ orgId, userId, action, resourceType, resourceId, before, after, ip, userAgent, correlationId }) {
    try {
      return await AuditRepository.create({
        id: uuidv4(),
        orgId,
        userId,
        action,
        resourceType,
        resourceId,
        before,
        after,
        ip,
        userAgent,
        correlationId,
      });
    } catch (err) {
      // Audit logging must never cause the main request to fail
      logger.error({ err, orgId, action }, 'Failed to write audit event');
    }
  }

  async list(orgId, opts = {}) {
    return AuditRepository.list(orgId, opts);
  }

  async getAnalytics(orgId) {
    const [runStats, stepStats, aiStats, approvalStats] = await Promise.all([
      query(
        `SELECT status, COUNT(*) AS count
         FROM workflow_runs
         WHERE org_id = $1
         GROUP BY status`,
        [orgId]
      ),
      query(
        `SELECT sr.step_type, COUNT(*) AS count, AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.started_at)) * 1000)::INT AS avg_duration_ms
         FROM workflow_step_runs sr
         JOIN workflow_runs r ON r.id = sr.run_id
         WHERE r.org_id = $1 AND sr.started_at IS NOT NULL
         GROUP BY sr.step_type`,
        [orgId]
      ),
      query(
        `SELECT action, COUNT(*) AS count,
                SUM(cost_usd) AS total_cost_usd,
                AVG(latency_ms)::INT AS avg_latency_ms,
                COUNT(*) FILTER (WHERE success = TRUE) AS success_count
         FROM ai_requests
         WHERE org_id = $1
         GROUP BY action`,
        [orgId]
      ),
      query(
        `SELECT status, COUNT(*) AS count
         FROM approval_requests
         WHERE org_id = $1
         GROUP BY status`,
        [orgId]
      ),
    ]);

    const totalRuns = runStats.rows.reduce((s, r) => s + parseInt(r.count, 10), 0);
    const successfulRuns = runStats.rows.find((r) => r.status === 'completed');
    const successRate = totalRuns > 0 ? (parseInt(successfulRuns?.count || 0, 10) / totalRuns) * 100 : 0;

    return {
      runs: {
        total: totalRuns,
        byStatus: Object.fromEntries(runStats.rows.map((r) => [r.status, parseInt(r.count, 10)])),
        successRate: Math.round(successRate * 10) / 10,
      },
      steps: {
        byType: stepStats.rows.map((r) => ({
          type: r.step_type,
          count: parseInt(r.count, 10),
          avgDurationMs: r.avg_duration_ms,
        })),
      },
      ai: {
        byAction: aiStats.rows.map((r) => ({
          action: r.action,
          count: parseInt(r.count, 10),
          totalCostUsd: parseFloat(r.total_cost_usd || 0),
          avgLatencyMs: r.avg_latency_ms,
          successRate: parseInt(r.count, 10) > 0
            ? Math.round((parseInt(r.success_count, 10) / parseInt(r.count, 10)) * 1000) / 10
            : 0,
        })),
      },
      approvals: {
        byStatus: Object.fromEntries(approvalStats.rows.map((r) => [r.status, parseInt(r.count, 10)])),
      },
    };
  }
}

module.exports = new AuditService();
