'use strict';

const https = require('https');
const ConnectorAdapter = require('../base/ConnectorAdapter');

const SUPPORTED_OPERATIONS = ['send_message', 'list_channels'];

class SlackConnector extends ConnectorAdapter {
  constructor(opts) {
    super(opts);
    // credentials: { botToken }
  }

  supportedOperations() {
    return SUPPORTED_OPERATIONS;
  }

  async connect() {
    if (!this.credentials.botToken) {
      throw new Error('Slack bot token is required');
    }
    this.connected = true;
  }

  async test() {
    const result = await this._post('auth.test', {});
    if (!result.ok) throw new Error(`Slack auth.test failed: ${result.error}`);
    return { ok: true, details: { team: result.team, bot_id: result.bot_id } };
  }

  async execute(operation, params = {}) {
    this._assertOperation(operation);
    if (!this.connected) await this.connect();

    switch (operation) {
      case 'send_message':
        return this._post('chat.postMessage', {
          channel: params.channel,
          text: params.text,
          blocks: params.blocks,
          thread_ts: params.threadTs,
        });
      case 'list_channels':
        return this._get(`conversations.list?limit=${params.limit || 100}&types=${params.types || 'public_channel,private_channel'}`);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  _post(method, data) {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify(data);
      const options = {
        hostname: 'slack.com',
        path: `/api/${method}`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed.ok) reject(new Error(`Slack API error: ${parsed.error}`));
            else resolve(parsed);
          } catch { reject(new Error('Invalid Slack response')); }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  _get(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'slack.com',
        path: `/api/${path}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.credentials.botToken}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (!parsed.ok) reject(new Error(`Slack API error: ${parsed.error}`));
            else resolve(parsed);
          } catch { reject(new Error('Invalid Slack response')); }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = SlackConnector;
