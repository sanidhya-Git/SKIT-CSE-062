'use strict';

const https = require('https');
const ConnectorAdapter = require('../base/ConnectorAdapter');

const SUPPORTED_OPERATIONS = [
  'query_leads',
  'query_opportunities',
  'create_lead',
  'update_opportunity',
  'create_case',
];

class SalesforceConnector extends ConnectorAdapter {
  constructor(opts) {
    super(opts);
    this.instanceUrl = null;
    this.accessToken = null;
  }

  supportedOperations() {
    return SUPPORTED_OPERATIONS;
  }

  async connect() {
    const { clientId, clientSecret, username, password, securityToken, instanceUrl } = this.credentials;

    if (instanceUrl && this.credentials.accessToken) {
      // Direct token auth (e.g. OAuth2 flow already completed)
      this.instanceUrl = instanceUrl;
      this.accessToken = this.credentials.accessToken;
      this.connected = true;
      return;
    }

    // Username-password OAuth2 flow
    const tokenUrl = this.credentials.tokenUrl || 'https://login.salesforce.com/services/oauth2/token';
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password: `${password}${securityToken || ''}`,
    });

    const response = await this._httpPost(tokenUrl, body.toString(), {
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    this.instanceUrl = response.instance_url;
    this.accessToken = response.access_token;
    this.connected = true;
  }

  async test() {
    const limits = await this._apiGet('/services/data/v59.0/limits');
    return { ok: true, details: { apiCallsRemaining: limits.DailyApiRequests?.Remaining } };
  }

  async execute(operation, params = {}) {
    this._assertOperation(operation);
    if (!this.connected) await this.connect();

    switch (operation) {
      case 'query_leads':
        return this._query(`SELECT Id, FirstName, LastName, Email, Company, Status, LeadSource FROM Lead WHERE ${params.where || 'Id != null'} LIMIT ${params.limit || 50}`);
      case 'query_opportunities':
        return this._query(`SELECT Id, Name, Amount, StageName, CloseDate, AccountId FROM Opportunity WHERE ${params.where || 'Id != null'} LIMIT ${params.limit || 50}`);
      case 'create_lead':
        return this._apiPost('/services/data/v59.0/sobjects/Lead/', params);
      case 'update_opportunity':
        const { id: oppId, ...oppData } = params;
        return this._apiPatch(`/services/data/v59.0/sobjects/Opportunity/${oppId}`, oppData);
      case 'create_case':
        return this._apiPost('/services/data/v59.0/sobjects/Case/', params);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async _query(soql) {
    const encoded = encodeURIComponent(soql);
    return this._apiGet(`/services/data/v59.0/query/?q=${encoded}`);
  }

  async _apiGet(path) {
    return this._request('GET', path);
  }

  async _apiPost(path, data) {
    return this._request('POST', path, data);
  }

  async _apiPatch(path, data) {
    return this._request('PATCH', path, data);
  }

  _request(method, path, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.instanceUrl}${path}`);
      const body = data ? JSON.stringify(data) : undefined;

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Salesforce API error ${res.statusCode}: ${raw}`));
          }
          try {
            resolve(raw ? JSON.parse(raw) : {});
          } catch {
            resolve({ raw });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  _httpPost(url, body, headers) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const options = {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
      };
      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`OAuth error ${res.statusCode}: ${raw}`));
          }
          resolve(JSON.parse(raw));
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

module.exports = SalesforceConnector;
