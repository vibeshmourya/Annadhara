/**
 * Root Vercel Serverless Function Entry Point
 * Compatible with ES Module root package.json ("type": "module")
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const app = require('../server/src/app');

export default app;
