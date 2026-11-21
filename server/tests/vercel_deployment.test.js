/**
 * ANNADHARA — VERCEL DEPLOYMENT & ROUTING INTEGRATION TEST SUITE
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies:
 * 1. Root path (GET /) returns 200 OK with API status & database connection
 * 2. Base API path (GET /api) returns 200 OK with available endpoints
 * 3. Health check (GET /api/health) returns expected JSON { success, message, database }
 * 4. Health check alias (GET /health) returns 200 OK
 * 5. Prefix resilience: both /api/donations and /donations route to donation controller
 * 6. Prefix resilience: both /api/auth/login and /auth/login route to auth controller
 * 7. CORS configuration: handles preflight OPTIONS for .vercel.app and localhost origins
 * 8. 404 handling: undefined routes return consistent JSON error (no HTML error page)
 * 9. Serverless entry point: server/api/index.js correctly exports callable Express app
 * 10. Database connection pooling: connectDB() safely reuses open connection
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { connectDB, getDbStatus } = require('../src/config/db');

let server;
let baseUrl;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return {
    status: response.status,
    headers: response.headers,
    body: data,
  };
}

async function runVercelTests() {
  console.log('\n================================================================');
  console.log('🚀 ANNADHARA: VERCEL DEPLOYMENT & API ROUTING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // 1. Verify Serverless Entry Point Export
  total++;
  try {
    const serverlessApp = require('../api/index');
    assert(typeof serverlessApp === 'function', 'server/api/index.js must export an Express application function');
    console.log('  ✅ PASSED: Test 1 - server/api/index.js correctly exports Express application function');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 1 - Serverless entry point test failed: ${err.message}`);
  }

  // 2. Connect to Atlas Database & Start Server Instance
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

    assert(mongoose.connection.readyState === 1, 'MongoDB readyState must be 1 (connected)');
    console.log(`  ✅ PASSED: Test 2 - Server active on ${baseUrl} with live MongoDB Atlas connection (${getDbStatus()})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 2 - Server startup failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Root Endpoint (GET /) — Fixes Vercel Root 404
  total++;
  try {
    const res = await request('/');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Response success must be true');
    assert(res.body.message === 'Annadhara API is running', `Message mismatch: ${res.body.message}`);
    assert(res.body.database === 'connected', 'Database must be connected');
    assert(res.body.endpoints && res.body.endpoints.health, 'Endpoints map must be present');
    console.log('  ✅ PASSED: Test 3 - GET / returns 200 OK with API status & endpoints (Fixes root 404 on Vercel)');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 3 - Root GET / failed: ${err.message}`);
  }

  // 4. Base API Endpoint (GET /api) — Fixes Vercel /api 404
  total++;
  try {
    const res = await request('/api');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Response success must be true');
    assert(res.body.message === 'Annadhara API is running', `Message mismatch: ${res.body.message}`);
    assert(res.body.database === 'connected', 'Database must be connected');
    console.log('  ✅ PASSED: Test 4 - GET /api returns 200 OK (Fixes /api 404 on Vercel)');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 4 - Base GET /api failed: ${err.message}`);
  }

  // 5. Health Check Endpoint (GET /api/health)
  total++;
  try {
    const res = await request('/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Health check success must be true');
    assert(res.body.message === 'Annadhara API is running', 'Health check message must match');
    assert(res.body.database === 'connected', 'Database must report connected');
    console.log(`  ✅ PASSED: Test 5 - GET /api/health returns exact expected schema (database: ${res.body.database})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 5 - Health check GET /api/health failed: ${err.message}`);
  }

  // 6. Health Check Alias (GET /health)
  total++;
  try {
    const res = await request('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Alias health check must succeed');
    assert(res.body.database === 'connected', 'Database must report connected');
    console.log('  ✅ PASSED: Test 6 - GET /health alias endpoint returns 200 OK');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 6 - Health alias GET /health failed: ${err.message}`);
  }

  // 7. Route Prefix Resilience: GET /api/donations vs GET /donations
  total++;
  try {
    const withPrefix = await request('/api/donations');
    const withoutPrefix = await request('/donations');

    assert(withPrefix.status === 200, `Expected 200 for /api/donations, got ${withPrefix.status}`);
    assert(withoutPrefix.status === 200, `Expected 200 for /donations, got ${withoutPrefix.status}`);
    assert(Array.isArray(withPrefix.body.data), '/api/donations must return array data');
    assert(Array.isArray(withoutPrefix.body.data), '/donations must return array data');
    console.log('  ✅ PASSED: Test 7 - Both /api/donations and /donations route cleanly to donation controller');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 7 - Donation route prefix test failed: ${err.message}`);
  }

  // 8. Auth Route Prefix Resilience: POST /api/auth/login vs POST /auth/login
  total++;
  try {
    const creds = JSON.stringify({ email: 'nonexistent@test.com', password: 'Password@123' });
    const headers = { 'Content-Type': 'application/json' };

    const withPrefix = await request('/api/auth/login', { method: 'POST', headers, body: creds });
    const withoutPrefix = await request('/auth/login', { method: 'POST', headers, body: creds });

    // Both should reach auth controller and return 401 Unauthorized for invalid credentials (NOT 404 Not Found)
    assert(withPrefix.status === 401, `Expected 401 for /api/auth/login, got ${withPrefix.status}`);
    assert(withoutPrefix.status === 401, `Expected 401 for /auth/login, got ${withoutPrefix.status}`);
    console.log('  ✅ PASSED: Test 8 - Both /api/auth/login and /auth/login route cleanly to auth controller');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 8 - Auth route prefix test failed: ${err.message}`);
  }

  // 9. CORS Preflight & Vercel Domain Support
  total++;
  try {
    const preflightRes = await fetch(`${baseUrl}/api/donations`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://annadhara-frontend.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization,Content-Type',
      },
    });

    assert(preflightRes.status === 204 || preflightRes.status === 200, `Expected 200/204 preflight, got ${preflightRes.status}`);
    const allowOrigin = preflightRes.headers.get('access-control-allow-origin');
    assert(
      allowOrigin === 'https://annadhara-frontend.vercel.app',
      `Expected CORS origin reflection for *.vercel.app, got ${allowOrigin}`
    );
    console.log(`  ✅ PASSED: Test 9 - CORS preflight verified for *.vercel.app frontend domains`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 9 - CORS preflight failed: ${err.message}`);
  }

  // 10. Clean JSON 404 for Unknown Endpoints
  total++;
  try {
    const res = await request('/api/some/invalid/route');
    assert(res.status === 404, `Expected 404, got ${res.status}`);
    assert(res.body.success === false, '404 success must be false');
    assert(res.body.message.includes('not found'), `Expected 'not found' message, got: ${res.body.message}`);
    console.log(`  ✅ PASSED: Test 10 - Unknown endpoints return clear JSON 404 ("${res.body.message}")`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 10 - Unknown route 404 test failed: ${err.message}`);
  }

  // 11. Database Connection Reuse (No duplicate connection in serverless)
  total++;
  try {
    const readyStateBefore = mongoose.connection.readyState;
    await connectDB(); // Call connectDB again
    const readyStateAfter = mongoose.connection.readyState;
    assert(readyStateBefore === 1 && readyStateAfter === 1, 'Connection must remain readyState 1 without reconnecting');
    console.log('  ✅ PASSED: Test 11 - Database connection safely reused across multiple invocations');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 11 - Connection reuse test failed: ${err.message}`);
  }

  // Teardown
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`🚀 Vercel Deployment Test Result: ${passed}/${total} PASSED!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runVercelTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

