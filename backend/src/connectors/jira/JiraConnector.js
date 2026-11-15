'use strict';

const https = require('https');
const ConnectorAdapter = require('../base/ConnectorAdapter');

const SUPPORTED_OPERATIONS = ['list_issues', 'create_issue', 'update_issue', 'get_project'];

class JiraConnector extends ConnectorAdapter {
  constructor(opts) {
    super(opts);
    // credentials: { baseUrl, email, apiToken }
  }

  supportedOperations() {
    return SUPPORTED_OPERATIONS;
  }

  async connect() {
    if (!this.credentials.baseUrl || !this.credentials.email || !this.credentials.apiToken) {
      throw new Error('Jira requires baseUrl, email, and apiToken credentials');
    }
    this.connected = true;
  }

  async test() {
    const myself = await this._get('/rest/api/3/myself');
    return { ok: true, details: { accountId: myself.accountId, displayName: myself.displayName } };
  }

  async execute(operation, params = {}) {
    this._assertOperation(operation);
    if (!this.connected) await this.connect();

    switch (operation) {
      case 'list_issues':
        return this._get(
          `/rest/api/3/search?jql=${encodeURIComponent(params.jql || `project = ${params.project}`)}&maxResults=${params.limit || 50}`
        );
      case 'create_issue':
        return this._post('/rest/api/3/issue', {
          fields: {
            project: { key: params.project },
            summary: params.summary,
            description: params.description
              ? { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: params.description }] }] }
              : undefined,
            issuetype: { name: params.issuetype || 'Task' },
            priority: params.priority ? { name: params.priority } : undefined,
            assignee: params.assignee ? { accountId: params.assignee } : undefined,
          },
        });
      case 'update_issue':
        return this._put(`/rest/api/3/issue/${params.issueKey}`, { fields: params.fields || {} });
      case 'get_project':
        return this._get(`/rest/api/3/project/${params.project}`);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  _authHeader() {
    const encoded = Buffer.from(`${this.credentials.email}:${this.credentials.apiToken}`).toString('base64');
    return `Basic ${encoded}`;
  }

  _get(path) { return this._request('GET', path); }
  _post(path, data) { return this._request('POST', path, data); }
  _put(path, data) { return this._request('PUT', path, data); }

  _request(method, path, data) {
    return new Promise((resolve, reject) => {
      const base = new URL(this.credentials.baseUrl);
      const body = data ? JSON.stringify(data) : undefined;

      const options = {
        hostname: base.hostname,
        path: `${base.pathname.replace(/\/$/, '')}${path}`,
        method,
        headers: {
          Authorization: this._authHeader(),
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Jira API error ${res.statusCode}: ${raw}`));
          }
          try { resolve(raw ? JSON.parse(raw) : {}); }
          catch { resolve({ raw }); }
        });
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }
}

module.exports = JiraConnector;
