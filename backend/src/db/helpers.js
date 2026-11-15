'use strict';

const { getPool } = require('./pool');
const logger = require('../utils/logger');

/**
 * Run multiple queries in a single transaction.
 * @param {Function} callback  async (client) => result
 */
async function withTransaction(callback) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Transaction rolled back');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Build pagination clause and return { limit, offset, page, pageSize }
 * @param {object} opts  { page?, limit? }
 */
function paginate(opts = {}) {
  const page = Math.max(1, parseInt(opts.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(opts.limit, 10) || parseInt(opts.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;
  return { limit: pageSize, offset, page, pageSize };
}

/**
 * Wrap a query result with pagination metadata
 */
function paginatedResult(rows, total, page, pageSize) {
  return {
    data: rows,
    pagination: {
      total: parseInt(total, 10),
      page,
      pageSize,
      totalPages: Math.ceil(parseInt(total, 10) / pageSize),
    },
  };
}

/**
 * Build SET clause for PATCH queries from a plain object.
 * Returns { clause, values, nextIndex }
 * Usage: const { clause, values } = buildSetClause({ name, status }, 2)
 *   → clause = '"name" = $2, "status" = $3'
 *   → values = [nameVal, statusVal]
 */
function buildSetClause(updates, startIndex = 1) {
  const keys = Object.keys(updates).filter((k) => updates[k] !== undefined);
  const clause = keys.map((k, i) => `"${k}" = $${startIndex + i}`).join(', ');
  const values = keys.map((k) => updates[k]);
  return { clause, values, nextIndex: startIndex + keys.length };
}

module.exports = { withTransaction, paginate, paginatedResult, buildSetClause };
