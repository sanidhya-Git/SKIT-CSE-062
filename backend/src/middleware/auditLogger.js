'use strict';

const { query } = require('../db/pool');
const logger = require('../utils/logger');

/**
 * Factory: creates an audit-logging middleware for a specific action/resource_type.
 * Writes to audit_events AFTER the response is sent (so it doesn't block).
 *
 * @param {string} action        e.g. 'workflow.create'
 * @param {string} resourceType  e.g. 'workflow'
 * @param {Function} [getResourceId]  (req, res) => string | null
 * @param {Function} [getBefore]      async (req) => object | null  (called before handler)
 */
function auditLog(action, resourceType, getResourceId = null, getBefore = null) {
  return (req, res, next) => {
    let beforeSnapshot = null;

    const captureAndLog = async () => {
      try {
        if (getBefore) {
          beforeSnapshot = await getBefore(req);
        }
      } catch {
        // non-critical
      }

      const originalJson = res.json.bind(res);
      res.json = function (body) {
        // Write audit event after response is sent
        setImmediate(async () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const orgId = req.params?.orgId || req.orgMember?.orgId;
              const userId = req.user?.id;
              const resourceId = getResourceId
                ? getResourceId(req, body)
                : req.params?.workflowId ||
                  req.params?.id ||
                  req.params?.integrationId ||
                  req.params?.runId ||
                  req.params?.approvalId ||
                  req.params?.userId ||
                  (body && body.id) ||
                  null;

              if (orgId) {
                await query(
                  `INSERT INTO audit_events (org_id, user_id, action, resource_type, resource_id, before, after, ip, user_agent, correlation_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                  [
                    orgId,
                    userId,
                    action,
                    resourceType,
                    resourceId ? String(resourceId) : null,
                    beforeSnapshot ? JSON.stringify(beforeSnapshot) : null,
                    body && typeof body === 'object' ? JSON.stringify(body) : null,
                    req.ip,
                    req.headers['user-agent'] || null,
                    req.requestId,
                  ]
                );
              }
            }
          } catch (err) {
            logger.error({ err, action, resourceType }, 'Failed to write audit event');
          }
        });

        return originalJson(body);
      };

      next();
    };

    captureAndLog().catch(next);
  };
}

module.exports = { auditLog };
