'use strict';

// Load .env.production first (Vercel / production), then .env (local dev).
// dotenv never overrides vars already set in the process environment.
const _path = require('path');
require('dotenv').config({ path: _path.join(__dirname, '.env.production') });
require('dotenv').config({ path: _path.join(__dirname, '.env') });

const { app } = require('./src/server');

// Export Express app as a Vercel serverless handler.
// Vercel calls this file as a function — do NOT call app.listen() here.
module.exports = app;
