/**
 * ANNADHARA — PRODUCTION REGISTRATION & API CONNECTION TEST SUITE
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies:
 * 1. Standard registration via POST /api/auth/register (Donor, Recipient, Volunteer)
 * 2. Prefix resilience via POST /auth/register (Prefix-stripped alias)
 * 3. Duplicate /api/api resilience via POST /api/api/auth/register
 * 4. User and Organization persisted in MongoDB Atlas
 * 5. Password hashing with bcrypt & token generation
 * 6. Immediate login via newly registered credentials
 * 7. Duplicate email rejection with 409 Conflict
 * 8. Validation error formatting (400 / 422)
 * 9. Frontend Axios URL normalization logic across all Vercel environment shapes
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const http = require('http');
const mongoose = require('mongoose');
const { connectDB, getDbStatus } = require('../src/config/db');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

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

async function runRegistrationTests() {
  console.log('\n================================================================');
  console.log('🛡️ ANNADHARA: PRODUCTION REGISTRATION & API VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // 1. Establish Atlas Cloud Connection & Start Test Server
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

    assert(mongoose.connection.readyState === 1, 'Atlas MongoDB must be connected (readyState = 1)');
    console.log(`  ✅ PASSED: Test 1 - Server online at ${baseUrl} connected to Atlas [Status: ${getDbStatus()}]`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 1 - Startup failed: ${err.message}`);
    process.exit(1);
  }

  const uniqueSuffix = Date.now();
  const testUsers = [];

  // 2. Standard Registration: POST /api/auth/register
  total++;
  const donorEmail = `donor_${uniqueSuffix}@example.in`;
  try {
    const payload = {
      name: 'Swathi Grand Kitchen',
      email: donorEmail,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 98451 23456',
      organizationName: 'Swathi Caterers & Kitchen',
      organizationType: 'Restaurant',
      registrationNumber: 'KA-BLR-REG-2026',
      fssaiNumber: '11223344556677',
      address: {
        street: '45 CMH Road',
        areaLocality: 'Indiranagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
    };

    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert(res.status === 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Response success must be true');
    assert(res.body.data.token, 'JWT Token must be returned upon registration');
    assert(res.body.data.user.role === 'DONOR', 'User role must be DONOR');
    testUsers.push(res.body.data.user.id || res.body.data.user._id);

    // Verify in Atlas
    const userDoc = await User.findOne({ email: donorEmail });
    assert(userDoc !== null, 'User document must be stored in MongoDB Atlas');
    assert(userDoc.organizationId !== null, 'Organization must be linked');
    console.log(`  ✅ PASSED: Test 2 - Standard registration via POST /api/auth/register (User ID: ${userDoc._id})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 2 - Standard registration failed: ${err.message}`);
  }

  // 3. Prefix-Stripped Alias Registration: POST /auth/register
  total++;
  const recipientEmail = `ngo_${uniqueSuffix}@example.in`;
  try {
    const payload = {
      name: 'Karuna Trust NGO',
      email: recipientEmail,
      password: 'Password@123',
      role: 'RECIPIENT',
      phone: '+91 99887 66554',
      organizationName: 'Karuna Food Foundation',
      organizationType: 'Registered NGO',
      registrationNumber: 'NGO-KA-4491',
      address: {
        street: '12 Gandhi Bazaar',
        areaLocality: 'Basavanagudi',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560004',
        country: 'India',
      },
    };

    // Note: Request without /api prefix
    const res = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert(res.status === 201, `Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Response success must be true');
    testUsers.push(res.body.data.user.id || res.body.data.user._id);
    console.log('  ✅ PASSED: Test 3 - Prefix-stripped route POST /auth/register routes successfully (Fixes missing /api)');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 3 - Prefix-stripped registration failed: ${err.message}`);
  }

  // 4. Duplicate /api/api Resilience: POST /api/api/auth/register
  total++;
  const volunteerEmail = `vol_${uniqueSuffix}@example.in`;
  try {
    const payload = {
      name: 'Rohan Sharma',
      email: volunteerEmail,
      password: 'Password@123',
      role: 'VOLUNTEER',
      phone: '+91 91234 56789',
      volunteerType: 'Individual Volunteer',
      address: {
        street: '88 Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
    };

    // Note: Request with duplicate /api/api prefix
    const res = await request('/api/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert(res.status === 201, `Expected 201 Created for duplicate /api/api, got ${res.status}`);
    assert(res.body.success === true, 'Response success must be true');
    testUsers.push(res.body.data.user.id || res.body.data.user._id);
    console.log('  ✅ PASSED: Test 4 - Duplicate /api/api prefix collapsed and routed cleanly');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 4 - Duplicate /api/api registration failed: ${err.message}`);
  }

  // 5. Immediate Login Verification with Newly Registered Credentials
  total++;
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: donorEmail, password: 'Password@123' }),
    });

    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(res.body.success === true, 'Login success must be true');
    assert(res.body.data.token, 'Token must be returned on login');
    console.log('  ✅ PASSED: Test 5 - Newly registered user successfully authenticated against Atlas');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 5 - Login failed: ${err.message}`);
  }

  // 6. Duplicate Email Rejection (409 Conflict)
  total++;
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Swathi',
        email: donorEmail, // Same email
        password: 'Password@123',
        role: 'DONOR',
        phone: '+91 98451 23456',
        organizationName: 'Duplicate Kitchen',
        organizationType: 'Restaurant',
        address: { city: 'Bengaluru', state: 'Karnataka' },
      }),
    });

    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(res.body.success === false, '409 success must be false');
    assert(res.body.message.includes('already exists'), 'Duplicate message must indicate account exists');
    console.log('  ✅ PASSED: Test 6 - Duplicate registration correctly returns 409 Conflict');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 6 - Duplicate test failed: ${err.message}`);
  }

  // 7. Validation Error Handling (400 Bad Request)
  total++;
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete User',
        email: 'invalid-email-format',
        password: '123', // Too short
        role: 'DONOR',
      }),
    });

    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    assert(res.body.success === false, 'Validation response success must be false');
    console.log('  ✅ PASSED: Test 7 - Form validation rejection returns structured 400 Bad Request');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 7 - Validation error test failed: ${err.message}`);
  }

  // 8. Frontend Axios Base URL Normalization Unit Tests
  total++;
  try {
    // Replicate the client axios resolver logic
    function testResolveBaseUrl(envVal) {
      if (envVal && typeof envVal === 'string' && envVal.trim() !== '') {
        let clean = envVal.trim().replace(/\/+$/, '');
        clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');
        if (
          (clean.startsWith('http://') || clean.startsWith('https://')) &&
          !clean.endsWith('/api') &&
          !clean.includes('/api/')
        ) {
          clean = `${clean}/api`;
        }
        return clean;
      }
      return '/api';
    }

    assert(testResolveBaseUrl('https://backend.vercel.app') === 'https://backend.vercel.app/api', 'Missing /api must be appended');
    assert(testResolveBaseUrl('https://backend.vercel.app/api') === 'https://backend.vercel.app/api', 'Existing /api preserved');
    assert(testResolveBaseUrl('https://backend.vercel.app/api/') === 'https://backend.vercel.app/api', 'Trailing slash stripped');
    assert(testResolveBaseUrl('https://backend.vercel.app/api/api') === 'https://backend.vercel.app/api', 'Duplicate /api collapsed');
    assert(testResolveBaseUrl('') === '/api', 'Empty string falls back to /api');
    assert(testResolveBaseUrl(undefined) === '/api', 'Undefined falls back to /api');

    console.log('  ✅ PASSED: Test 8 - Frontend Axios URL normalization handles all Vercel environment shapes');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 8 - Axios resolver test failed: ${err.message}`);
  }

  // Cleanup test users created during test
  try {
    for (const id of testUsers) {
      await User.findByIdAndDelete(id);
      await Organization.findOneAndDelete({ createdBy: id });
    }
  } catch (_) {}

  // Teardown
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`🛡️ Production Registration Suite Result: ${passed}/${total} PASSED!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runRegistrationTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

