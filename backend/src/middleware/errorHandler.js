'use strict';

const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = req.requestId;

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
      requestId,
    });
  }

  // Handle operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        { requestId, err, userId: req.user?.id, orgId: req.params?.orgId },
        'Application error'
      );
    } else {
      logger.warn(
        { requestId, code: err.code, message: err.message, userId: req.user?.id },
        'Client error'
      );
    }

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
  }

  // Unexpected errors — don't leak internals
  logger.error(
    { requestId, err, userId: req.user?.id, orgId: req.params?.orgId },
    'Unhandled error'
  );

  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    requestId,
  });
}

module.exports = errorHandler;
