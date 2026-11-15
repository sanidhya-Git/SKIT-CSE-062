'use strict';

const { v4: uuidv4 } = require('uuid');
const {
  hashPassword,
  comparePassword,
  signAccessToken,
  generateRefreshToken,
  hashToken,
} = require('../utils/crypto');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const UserRepository = require('../repositories/UserRepository');
const SessionRepository = require('../repositories/SessionRepository');
const config = require('../config');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new user. Returns { user, accessToken, refreshToken }
   */
  async register({ name, email, password }, { ip, userAgent } = {}) {
    const exists = await UserRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    const user = await UserRepository.create({ id: userId, email, passwordHash, name });

    const { accessToken, refreshToken, session } = await this._createSession(user, { ip, userAgent });

    logger.info({ userId: user.id, action: 'register' }, 'User registered');

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login with email/password. Returns { user, accessToken, refreshToken }
   */
  async login({ email, password }, { ip, userAgent } = {}) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this._createSession(user, { ip, userAgent });

    logger.info({ userId: user.id, action: 'login' }, 'User logged in');

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh tokens using a valid refresh token
   */
  async refresh(rawRefreshToken, { ip, userAgent } = {}) {
    const hash = hashToken(rawRefreshToken);
    const session = await SessionRepository.findByTokenHash(hash);

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (session.revoked_at) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // Rotate: revoke old session, create new
    await SessionRepository.revoke(session.id);

    const user = await UserRepository.findById(session.user_id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const { accessToken, refreshToken } = await this._createSession(user, { ip, userAgent });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout: revoke the given refresh token
   */
  async logout(rawRefreshToken) {
    const hash = hashToken(rawRefreshToken);
    const session = await SessionRepository.findByTokenHash(hash);
    if (session) {
      await SessionRepository.revoke(session.id);
    }
  }

  async _createSession(user, { ip, userAgent } = {}) {
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const sessionId = uuidv4();

    // 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await SessionRepository.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      ip: ip || null,
      userAgent: userAgent || null,
    });

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    return { accessToken, refreshToken: rawRefreshToken, sessionId };
  }
}

module.exports = new AuthService();
