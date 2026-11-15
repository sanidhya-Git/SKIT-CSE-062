'use strict';

const { query } = require('../db/pool');
const { withTransaction, buildSetClause } = require('../db/helpers');

class OrganisationRepository {
  async findById(id) {
    const result = await query(
      `SELECT id, name, slug, owner_id, settings, plan, created_at, updated_at
       FROM organisations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findBySlug(slug) {
    const result = await query(
      `SELECT id, name, slug, owner_id, settings, plan, created_at, updated_at
       FROM organisations WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId) {
    const result = await query(
      `SELECT o.id, o.name, o.slug, o.owner_id, o.settings, o.plan, om.role, o.created_at, o.updated_at
       FROM organisations o
       JOIN org_members om ON om.org_id = o.id
       WHERE om.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async create({ id, name, slug, ownerId }) {
    return withTransaction(async (client) => {
      const orgResult = await client.query(
        `INSERT INTO organisations (id, name, slug, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, slug, owner_id, settings, plan, created_at, updated_at`,
        [id, name, slug, ownerId]
      );
      const org = orgResult.rows[0];

      await client.query(
        `INSERT INTO org_members (org_id, user_id, role, invited_by)
         VALUES ($1, $2, 'owner', $2)`,
        [id, ownerId]
      );

      return org;
    });
  }

  async update(id, updates) {
    const allowed = { name: updates.name, settings: updates.settings, plan: updates.plan };
    const fields = Object.keys(allowed).filter((k) => allowed[k] !== undefined);
    if (fields.length === 0) return this.findById(id);

    const setFields = fields.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = fields.map((k) => allowed[k]);

    const result = await query(
      `UPDATE organisations SET ${setFields}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, slug, owner_id, settings, plan, updated_at`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async getMembers(orgId) {
    const result = await query(
      `SELECT u.id, u.email, u.name, om.role, om.joined_at,
              inv.email AS invited_by_email, inv.name AS invited_by_name
       FROM org_members om
       JOIN users u ON u.id = om.user_id
       LEFT JOIN users inv ON inv.id = om.invited_by
       WHERE om.org_id = $1
       ORDER BY om.joined_at ASC`,
      [orgId]
    );
    return result.rows;
  }

  async getMember(orgId, userId) {
    const result = await query(
      `SELECT om.org_id, om.user_id, om.role, om.joined_at, u.email, u.name
       FROM org_members om
       JOIN users u ON u.id = om.user_id
       WHERE om.org_id = $1 AND om.user_id = $2`,
      [orgId, userId]
    );
    return result.rows[0] || null;
  }

  async addMember({ orgId, userId, role, invitedBy }) {
    const result = await query(
      `INSERT INTO org_members (org_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING org_id, user_id, role, joined_at`,
      [orgId, userId, role, invitedBy]
    );
    return result.rows[0];
  }

  async updateMemberRole(orgId, userId, role) {
    const result = await query(
      `UPDATE org_members SET role = $3
       WHERE org_id = $1 AND user_id = $2
       RETURNING org_id, user_id, role`,
      [orgId, userId, role]
    );
    return result.rows[0] || null;
  }

  async removeMember(orgId, userId) {
    const result = await query(
      'DELETE FROM org_members WHERE org_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    return result.rowCount > 0;
  }

  async isMember(orgId, userId) {
    const result = await query(
      'SELECT role FROM org_members WHERE org_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new OrganisationRepository();
