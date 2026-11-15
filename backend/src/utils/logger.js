'use strict';

const pino = require('pino');
const config = require('../config');

const transport =
  config.isDev || config.isTest
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const logger = pino(
  {
    level: config.isTest ? 'silent' : optional('LOG_LEVEL', 'info'),
    base: { service: 'oneops-api', env: config.env },
    redact: {
      paths: [
        'password',
        'password_hash',
        'credentials',
        'credentials_encrypted',
        'refreshToken',
        'accessToken',
        'token',
        'secret',
        '*.password',
        '*.password_hash',
        '*.token',
        '*.secret',
        '*.credentials',
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  },
  transport ? pino.transport(transport) : undefined
);

function optional(name, defaultValue) {
  return process.env[name] || defaultValue;
}

module.exports = logger;
