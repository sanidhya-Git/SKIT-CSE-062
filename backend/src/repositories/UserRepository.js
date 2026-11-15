'use strict';

const { query } = require('../db/pool');

class UserRepository {
  async findById(id) {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithHash(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await query(
      'SELECT id, email, name, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create({ id, email, passwordHash, name }) {
    const result = await query(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, created_at, updated_at`,
      [id, email, passwordHash, name]
    );
    return result.rows[0];
  }

  async update(id, { name }) {
    const result = await query(
      `UPDATE users SET name = COALESCE($2, name), updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, updated_at`,
      [id, name]
    );
    return result.rows[0] || null;
  }

  async existsByEmail(email) {
    const result = await query('SELECT 1 FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }
}

module.exports = new UserRepository();
