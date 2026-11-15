'use strict';

// dotenv loads .env when present; on Vercel all vars come from the dashboard.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { app } = require('./src/server');

// Export Express app as a Vercel serverless handler.
// Vercel calls this file as a function — do NOT call app.listen() here.
module.exports = app;
