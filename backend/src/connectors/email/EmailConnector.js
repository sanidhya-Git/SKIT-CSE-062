'use strict';

const nodemailer = require('nodemailer');
const ConnectorAdapter = require('../base/ConnectorAdapter');

const SUPPORTED_OPERATIONS = ['send_email'];

class EmailConnector extends ConnectorAdapter {
  constructor(opts) {
    super(opts);
    // credentials: { host, port, secure, user, pass, from }
    this.transporter = null;
  }

  supportedOperations() {
    return SUPPORTED_OPERATIONS;
  }

  async connect() {
    const { host, port, secure, user, pass } = this.credentials;
    if (!host || !user || !pass) {
      throw new Error('Email connector requires host, user, and pass credentials');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port || '587', 10),
      secure: secure === true || secure === 'true',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });

    this.connected = true;
  }

  async test() {
    if (!this.transporter) await this.connect();
    await this.transporter.verify();
    return { ok: true, details: { host: this.credentials.host } };
  }

  async execute(operation, params = {}) {
    this._assertOperation(operation);
    if (!this.connected) await this.connect();

    switch (operation) {
      case 'send_email':
        const info = await this.transporter.sendMail({
          from: params.from || this.credentials.from || this.credentials.user,
          to: params.to,
          cc: params.cc,
          bcc: params.bcc,
          subject: params.subject,
          text: params.text,
          html: params.html,
          attachments: params.attachments,
          replyTo: params.replyTo,
        });
        return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async disconnect() {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
    await super.disconnect();
  }
}

module.exports = EmailConnector;
