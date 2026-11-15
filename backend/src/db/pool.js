'use strict';

const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.db.connectionString,
      max: config.db.poolMax,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle database client');
    });

    pool.on('connect', () => {
      logger.debug('New database client connected');
    });
  }
  return pool;
}

async function query(text, params) {
  const start = Date.now();
  const p = getPool();
  const result = await p.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, duration, rows: result.rowCount }, 'DB query executed');
  return result;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

module.exports = { getPool, query, closePool };
