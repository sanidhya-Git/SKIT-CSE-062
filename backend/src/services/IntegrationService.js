'use strict';

const { v4: uuidv4 } = require('uuid');
const { encryptObject, decryptObject } = require('../utils/crypto');
const { query } = require('../db/pool');
const registry = require('../connectors/registry');
const { NotFoundError, ConflictError, InternalError } = require('../utils/errors');
const logger = require('../utils/logger');

class IntegrationService {
  async list(orgId) {
    const result = await query(
      `SELECT id, org_id, type, name, status, scopes, settings, last_tested_at, created_at
       FROM integrations WHERE org_id = $1 ORDER BY created_at DESC`,
      [orgId]
    );
    return result.rows;
  }

  async getById(id, orgId) {
    const result = await query(
      `SELECT id, org_id, type, name, status, scopes, settings, last_tested_at, created_at
       FROM integrations WHERE id = $1 AND org_id = $2`,
      [id, orgId]
    );
    const integration = result.rows[0];
    if (!integration) throw new NotFoundError('Integration');
    return integration;
  }

  async create({ type, name, credentials, settings }, orgId) {
    const id = uuidv4();
    const encryptedCreds = encryptObject(credentials);

    const result = await query(
      `INSERT INTO integrations (id, org_id, type, name, credentials_encrypted, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, org_id, type, name, status, settings, created_at`,
      [id, orgId, type, name, encryptedCreds, JSON.stringify(settings || {})]
    );

    logger.info({ integrationId: id, orgId, type, action: 'integration.create' }, 'Integration created');
    return result.rows[0];
  }

  async delete(id, orgId) {
    const result = await query(
      'DELETE FROM integrations WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    if (result.rowCount === 0) throw new NotFoundError('Integration');
    logger.info({ integrationId: id, orgId, action: 'integration.delete' }, 'Integration deleted');
  }

  async getCredentials(id, orgId) {
    const result = await query(
      'SELECT credentials_encrypted FROM integrations WHERE id = $1 AND org_id = $2',
      [id, orgId]
    );
    if (!result.rows[0]) throw new NotFoundError('Integration');

    const { credentials_encrypted } = result.rows[0];
    if (!credentials_encrypted) return {};

    return decryptObject(Buffer.from(credentials_encrypted));
  }

  async testConnection(id, orgId) {
    const integration = await this.getById(id, orgId);
    const credentials = await this.getCredentials(id, orgId);

    const ConnectorClass = registry.get(integration.type);
    if (!ConnectorClass) {
      throw new ConflictError(`No connector available for type: ${integration.type}`);
    }

    const connector = new ConnectorClass({ credentials, settings: integration.settings });

    let success = false;
    let error = null;
    const start = Date.now();

    try {
      await connector.connect();
      await connector.test();
      await connector.disconnect();
      success = true;
    } catch (err) {
      error = err.message || 'Connection test failed';
      logger.warn({ integrationId: id, orgId, error, action: 'integration.test' }, 'Connection test failed');
    }

    const latencyMs = Date.now() - start;
    const newStatus = success ? 'connected' : 'error';

    await query(
      `UPDATE integrations SET status = $3, last_tested_at = NOW() WHERE id = $1 AND org_id = $2`,
      [id, orgId, newStatus]
    );

    return { success, latencyMs, error, status: newStatus };
  }
}

module.exports = new IntegrationService();
