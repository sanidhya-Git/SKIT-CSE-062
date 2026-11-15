'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const BCRYPT_ROUNDS = 12;

/**
 * AES-256-GCM encryption
 * Returns a Buffer: [iv(12)] + [authTag(16)] + [ciphertext]
 */
function encrypt(plaintext) {
  const keyBuffer = Buffer.from(config.encryption.key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const plaintextBuffer = Buffer.isBuffer(plaintext)
    ? plaintext
    : Buffer.from(typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext), 'utf8');

  const encrypted = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * AES-256-GCM decryption
 * Accepts a Buffer in the format produced by encrypt()
 * Returns the plaintext as a Buffer
 */
function decrypt(encryptedBuffer) {
  const keyBuffer = Buffer.from(config.encryption.key, 'hex');

  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const authTag = encryptedBuffer.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = encryptedBuffer.slice(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Encrypt a JSON-serializable object; returns Buffer
 */
function encryptObject(obj) {
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypt a Buffer back to the original object
 */
function decryptObject(encryptedBuffer) {
  const plaintext = decrypt(encryptedBuffer).toString('utf8');
  return JSON.parse(plaintext);
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain password against a hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Hash a token (refresh token) for storage using SHA-256
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Sign a JWT access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verify a JWT access token; throws on invalid/expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
}

/**
 * Generate a refresh token (opaque random bytes)
 */
function generateRefreshToken() {
  return generateToken(48);
}

module.exports = {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hashPassword,
  comparePassword,
  hashToken,
  generateToken,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
};
