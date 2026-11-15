'use strict';

const { verifyAccessToken } = require('../utils/crypto');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid Authorization header'));
    }

    const token = authHeader.slice(7);
    if (!token) {
      return next(new UnauthorizedError('Missing token'));
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new UnauthorizedError('Token expired'));
      }
      return next(new UnauthorizedError('Invalid token'));
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    logger.debug(
      { requestId: req.requestId, userId: req.user.id },
      'Request authenticated'
    );

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
