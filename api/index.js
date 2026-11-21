/**
 * Root Vercel Serverless Function Entry Point
 * Allows deployment from repository root without requiring custom Root Directory settings.
 * Forwards all incoming requests directly to the Annadhara Express backend application.
 */
const app = require('./server/src/app');

module.exports = app;

