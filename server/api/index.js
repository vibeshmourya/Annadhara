/**
 * Vercel Serverless Function Entry Point for Annadhara Backend
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Invokes the existing Express application with serverless database connection pooling.
 */
const app = require('../src/app');

module.exports = app;

