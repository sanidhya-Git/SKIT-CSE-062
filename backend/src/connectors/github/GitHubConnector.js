'use strict';

const https = require('https');
const ConnectorAdapter = require('../base/ConnectorAdapter');

const SUPPORTED_OPERATIONS = ['list_issues', 'create_issue', 'list_pull_requests', 'get_repo'];

class GitHubConnector extends ConnectorAdapter {
  constructor(opts) {
    super(opts);
    this.baseUrl = 'https://api.github.com';
  }

  supportedOperations() {
    return SUPPORTED_OPERATIONS;
  }

  async connect() {
    if (!this.credentials.token) {
      throw new Error('GitHub PAT (token) is required');
    }
    this.connected = true;
  }

  async test() {
    const user = await this._get('/user');
    return { ok: true, details: { login: user.login, name: user.name } };
  }

  async execute(operation, params = {}) {
    this._assertOperation(operation);
    if (!this.connected) await this.connect();

    const { owner, repo } = params;

    switch (operation) {
      case 'list_issues':
        return this._get(`/repos/${owner}/${repo}/issues?state=${params.state || 'open'}&per_page=${params.limit || 30}`);
      case 'create_issue':
        return this._post(`/repos/${owner}/${repo}/issues`, {
          title: params.title,
          body: params.body,
          labels: params.labels,
          assignees: params.assignees,
        });
      case 'list_pull_requests':
        return this._get(`/repos/${owner}/${repo}/pulls?state=${params.state || 'open'}&per_page=${params.limit || 30}`);
      case 'get_repo':
        return this._get(`/repos/${owner}/${repo}`);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  _get(path) {
    return this._request('GET', path);
  }

  _post(path, data) {
    return this._request('POST', path, data);
  }

  _request(method, path, data) {
    return new Promise((resolve, reject) => {
      const body = data ? JSON.stringify(data) : undefined;
      const options = {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${this.credentials.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'OneOps-API/1.0',
          'Content-Type': 'application/json',
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`GitHub API error ${res.statusCode}: ${raw}`));
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

module.exports = GitHubConnector;
