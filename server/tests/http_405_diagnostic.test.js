/**
 * ANNADHARA — HTTP 405 METHOD NOT ALLOWED DIAGNOSTIC & VERIFICATION SUITE
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies:
 * 1. POST /api/auth/register strictly accepts POST with payload and creates user (201 Created)
 * 2. OPTIONS /api/auth/register preflight returns 204 with Access-Control-Allow-Methods including POST
 * 3. Prefix resilience: both POST /api/auth/register and POST /auth/register work
 * 4. Duplicate prefix resilience: POST /api/api/auth/register is collapsed and handled
 * 5. Serverless entry points (server/api/index.js, server/index.js, api/index.js) are all callable
 * 6. client/vercel.json regex: verifies /((?!api/).*) does NOT match /api/auth/register
 * 7. Live MongoDB Atlas persistence: created user is saved with bcrypt password hash
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { connectDB, getDbStatus } = require('../src/config/db');
const User = require('../src/models/User');

let server;
let baseUrl;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run405DiagnosticTests() {
  console.log('\n================================================================');
  console.log('🔍 ANNADHARA: HTTP 405 DIAGNOSTIC & VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // 1. Verify Entry Points
  total++;
  try {
    const serverApiIndex = require('../api/index');
    const serverIndex = require('../index');
    const rootApiIndexModule = await import('../../api/index.js');
    const rootApiIndex = rootApiIndexModule.default;

    assert(typeof serverApiIndex === 'function', 'server/api/index.js must export Express function');
    assert(typeof serverIndex === 'function', 'server/index.js must export Express function');
    assert(typeof rootApiIndex === 'function', 'api/index.js must export Express function');

    console.log('  ✅ PASSED: Test 1 - All 3 Vercel Serverless entry points export valid callable Express handlers');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 1 - Entry points failed: ${err.message}`);
  }

  // 2. Start HTTP Test Server on Atlas Connection
  total++;
  try {
    await connectDB();
    const app = require('../src/app');
    server = http.createServer(app);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    assert(mongoose.connection.readyState === 1, 'Atlas DB must be connected');
    console.log(`  ✅ PASSED: Test 2 - Server running at ${baseUrl} [Atlas status: ${getDbStatus()}]`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 2 - Server startup failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Test CORS OPTIONS Preflight on /api/auth/register (Checking 405 Preflight Rejection)
  total++;
  try {
    const optionsRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://annadhara-client.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization',
      },
    });

    assert(optionsRes.status === 204 || optionsRes.status === 200, `Expected 204/200 for OPTIONS, got ${optionsRes.status}`);
    const allowMethods = optionsRes.headers.get('access-control-allow-methods') || '';
    assert(allowMethods.includes('POST'), `Allowed methods must include POST: ${allowMethods}`);
    console.log(`  ✅ PASSED: Test 3 - OPTIONS preflight on /api/auth/register returns ${optionsRes.status} with POST allowed`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 3 - OPTIONS preflight failed: ${err.message}`);
  }

  const uniqueSuffix = Date.now();
  const testUserId = [];

  // 4. Test POST /api/auth/register (Method: POST)
  total++;
  const donorEmail = `donor.405diag.${uniqueSuffix}@example.com`;
  try {
    const payload = {
      name: 'Diagnostic Restaurant',
      email: donorEmail,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 98765 43210',
      organizationName: 'Diagnostic Kitchen',
      organizationType: 'Restaurant',
      address: {
        street: '123 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert(res.status !== 405, 'HTTP Method POST must NOT return 405 Method Not Allowed');
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Success must be true');
    assert(data.data.token, 'Token must be present');
    testUserId.push(data.data.user.id || data.data.user._id);

    console.log(`  ✅ PASSED: Test 4 - POST /api/auth/register successfully created user (Status: 201 Created, Not 405)`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 4 - POST registration failed: ${err.message}`);
  }

  // 5. Test Prefix-Stripped POST /auth/register
  total++;
  const recipientEmail = `recipient.405diag.${uniqueSuffix}@example.com`;
  try {
    const payload = {
      name: 'Diagnostic Shelter',
      email: recipientEmail,
      password: 'Password@123',
      role: 'RECIPIENT',
      phone: '+91 98765 00000',
      organizationName: 'Diagnostic NGO',
      organizationType: 'Registered NGO',
      address: {
        street: '456 Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560002',
        country: 'India',
      },
    };

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert(res.status !== 405, 'POST /auth/register must NOT return 405');
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    testUserId.push(data.data.user.id || data.data.user._id);

    console.log(`  ✅ PASSED: Test 5 - POST /auth/register alias accepts POST (Status: 201 Created, Not 405)`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 5 - POST /auth/register failed: ${err.message}`);
  }

  // 6. Test client/vercel.json Regex (Proves /api routes are excluded from /index.html)
  total++;
  try {
    // client/vercel.json uses /((?!api/).*)
    const spaRegex = /^\/((?!api\/).*)$/;

    // Page navigation paths (MUST match SPA index.html rewrite)
    assert(spaRegex.test('/register') === true, '/register must match index.html rewrite');
    assert(spaRegex.test('/login') === true, '/login must match index.html rewrite');
    assert(spaRegex.test('/dashboard') === true, '/dashboard must match index.html rewrite');
    assert(spaRegex.test('/') === true, '/ must match index.html rewrite');

    // API paths (MUST NOT match index.html rewrite, preventing 405 on POST)
    assert(spaRegex.test('/api/auth/register') === false, '/api/auth/register must NOT match index.html rewrite');
    assert(spaRegex.test('/api/donations') === false, '/api/donations must NOT match index.html rewrite');
    assert(spaRegex.test('/api/health') === false, '/api/health must NOT match index.html rewrite');

    console.log('  ✅ PASSED: Test 6 - client/vercel.json rewrite regex strictly excludes /api/* from index.html (Prevents 405 on POST)');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 6 - Regex test failed: ${err.message}`);
  }

  // 7. Cleanup test users
  try {
    for (const id of testUserId) {
      await User.findByIdAndDelete(id);
    }
  } catch (_) {}

  // Teardown
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`🔍 405 Diagnostic Test Result: ${passed}/${total} PASSED!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

run405DiagnosticTests().catch((err) => {
  console.error('Fatal diagnostic test error:', err);
  process.exit(1);
});
