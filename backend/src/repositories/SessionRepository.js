'use strict';

const { query } = require('../db/pool');

class SessionRepository {
  async create({ id, userId, refreshTokenHash, expiresAt, ip, userAgent }) {
    const result = await query(
      `INSERT INTO sessions (id, user_id, refresh_token_hash, expires_at, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, expires_at, created_at`,
      [id, userId, refreshTokenHash, expiresAt, ip, userAgent]
    );
    return result.rows[0];
  }

  async findByTokenHash(hash) {
    const result = await query(
      `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at
       FROM sessions
       WHERE refresh_token_hash = $1`,
      [hash]
    );
    return result.rows[0] || null;
  }

  async revoke(id) {
    await query(
      'UPDATE sessions SET revoked_at = NOW() WHERE id = $1',
      [id]
    );
  }

  async revokeByUserId(userId) {
    await query(
      'UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  async deleteExpired() {
    const result = await query(
      'DELETE FROM sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL',
      []
    );
    return result.rowCount;
  }

  async findActiveByUserId(userId) {
    const result = await query(
      `SELECT id, expires_at, ip, user_agent, created_at
       FROM sessions
       WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = new SessionRepository();
