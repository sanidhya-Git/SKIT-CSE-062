'use strict';

const crypto = require('crypto');
const config = require('../config');

/**
 * Sign a webhook payload with HMAC-SHA256
 * Returns the signature as hex string prefixed with "sha256="
 */
function signWebhook(payload, secret = config.webhook.secret) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body, 'utf8');
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify an incoming webhook signature
 * @param {string|Buffer} rawBody  The raw request body
 * @param {string} signature       Value from X-OneOps-Signature header
 * @param {string} secret          HMAC secret
 * @returns {boolean}
 */
function verifyWebhookSignature(rawBody, signature, secret = config.webhook.secret) {
  if (!signature) return false;

  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expected = `sha256=${hmac.digest('hex')}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

module.exports = { signWebhook, verifyWebhookSignature };
