'use strict';

const { Router } = require('express');
const { getPool } = require('../db/pool');

const router = Router();

router.get('/', async (req, res) => {
  res.json({ status: 'ok', service: 'oneops-api', timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  res.json({ status: 'live' });
});

router.get('/ready', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'ready', db: 'ok' });
  } catch (err) {
    res.status(503).json({ status: 'not_ready', db: 'error', error: 'Database unavailable' });
  }
});

module.exports = router;
