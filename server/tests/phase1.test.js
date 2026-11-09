/**
 * FOODBRIDGE — PHASE 1 AUTOMATED INTEGRATION TEST SUITE
 * 
 * Tests all 14 mandatory requirements from Section 12:
 * 1. MongoDB connects successfully
 * 2. Health endpoint works (GET /api/health)
 * 3. User registration works (POST /api/auth/register)
 * 4. Duplicate email is rejected (HTTP 400)
 * 5. Passwords are saved as bcrypt hash and never returned in API responses
 * 6. Login works with valid credentials (POST /api/auth/login)
 * 7. Invalid login is rejected (HTTP 401)
 * 8. Protected routes reject unauthenticated requests (HTTP 401)
 * 9. Role restrictions work (HTTP 403)
 * 10. A user cannot modify another user's profile, role, or privileges (PATCH /api/users/me)
 * 11. Organization submission works with PENDING status (POST /api/organizations)
 * 12. Only administrators can verify/reject organizations (PATCH /api/admin/organizations/:id/verification)
 * 13. Public registration as ADMIN is strictly rejected (HTTP 403)
 * 14. API errors are formatted consistently ({ success: false, message: ... })
 * 
 * Additional Verification:
 * - Server-side logout token invalidation (POST /api/auth/logout)
 */

const { startServer } = require('../server');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhase1Tests() {
  console.log('================================================================');
  console.log('🌿 FOODBRIDGE PHASE 1: BACKEND & DATABASE AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  let passedTests = 0;

  try {
    // Start backend server (connects to DB)
    server = await startServer();
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`📡 Test server running at ${baseUrl}\n`);

    // -------------------------------------------------------------
    // Test 1: MongoDB connects successfully
    // -------------------------------------------------------------
    console.log('Test 1: MongoDB connection status verification');
    assert(mongoose.connection.readyState === 1, 'MongoDB connection readyState should be 1 (connected)');
    console.log('  ✅ PASSED: MongoDB connection established successfully (readyState = 1)\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 2: Health endpoint works
    // -------------------------------------------------------------
    console.log('Test 2: GET /api/health endpoint');
    const health = await request('/api/health');
    assert(health.status === 200, `Health status code should be 200, got ${health.status}`);
    assert(health.data.success === true, 'Health response success should be true');
    assert(health.data.status === 'online', `API status should be 'online', got ${health.data.status}`);
    assert(health.data.database === 'connected', `Database status should be 'connected', got ${health.data.database}`);
    assert(typeof health.data.timestamp === 'string' && !isNaN(Date.parse(health.data.timestamp)), 'Timestamp must be a valid ISO string');
    console.log(`  ✅ PASSED: Health endpoint online, db=${health.data.database}, timestamp=${health.data.timestamp}\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 3: User registration works (DONOR)
    // -------------------------------------------------------------
    console.log('Test 3: POST /api/auth/register (Standard User Registration)');
    const donorEmail = `donor_${Date.now()}@example.com`;
    const donorPassword = 'SecurePassword@123';
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Grand Hotel Kitchen',
        email: donorEmail,
        password: donorPassword,
        role: 'DONOR',
        phone: '+1 555-0101',
      },
    });

    assert(regRes.status === 201, `Expected 201 Created, got ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    assert(regRes.data.success === true, 'Expected success: true');
    assert(typeof regRes.data.data.token === 'string', 'Expected JWT token in registration response');
    assert(regRes.data.data.user.email === donorEmail, 'User email should match registered email');
    assert(regRes.data.data.user.role === 'DONOR', 'User role should be DONOR');
    assert(regRes.data.data.user.accountStatus === 'ACTIVE', 'Account status should be ACTIVE');
    const donorToken = regRes.data.data.token;
    const donorId = regRes.data.data.user._id || regRes.data.data.user.id;
    console.log(`  ✅ PASSED: Donor registered successfully (User ID: ${donorId})\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 4: Duplicate email is rejected
    // -------------------------------------------------------------
    console.log('Test 4: Duplicate email registration rejection');
    const dupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another Hotel',
        email: donorEmail, // Same email
        password: 'AnotherPassword@123',
        role: 'DONOR',
      },
    });

    assert(dupRes.status === 400, `Expected 400 Bad Request for duplicate email, got ${dupRes.status}`);
    assert(dupRes.data.success === false, 'Expected success: false for duplicate registration');
    assert(dupRes.data.message.includes('already exists'), `Expected error message about duplicate email, got: ${dupRes.data.message}`);
    console.log(`  ✅ PASSED: Duplicate registration correctly rejected with 400 Bad Request: "${dupRes.data.message}"\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 5: Passwords are saved as bcrypt hash and never returned in API responses
    // -------------------------------------------------------------
    console.log('Test 5: Password hashing & credential security');
    // Ensure password / passwordHash is omitted in the API response
    assert(regRes.data.data.user.passwordHash === undefined, 'passwordHash must never be exposed in API response');
    assert(regRes.data.data.user.password === undefined, 'password must never be exposed in API response');

    // Check directly in database
    const dbUser = await User.findById(donorId).select('+passwordHash');
    assert(dbUser.passwordHash !== undefined, 'passwordHash must exist in MongoDB');
    assert(dbUser.passwordHash !== donorPassword, 'passwordHash in DB must not be plain text');
    assert(dbUser.passwordHash.startsWith('$2'), 'passwordHash must be a valid bcrypt hash starting with $2');
    const isMatch = await dbUser.comparePassword(donorPassword);
    assert(isMatch === true, 'bcrypt comparePassword should verify the original password');
    console.log(`  ✅ PASSED: Password properly bcrypt hashed (${dbUser.passwordHash.substring(0, 20)}...) and stripped from API output\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 6: Login works with valid credentials
    // -------------------------------------------------------------
    console.log('Test 6: POST /api/auth/login with valid credentials');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: donorEmail,
        password: donorPassword,
      },
    });

    assert(loginRes.status === 200, `Expected 200 OK, got ${loginRes.status}`);
    assert(loginRes.data.success === true, 'Expected success: true');
    assert(typeof loginRes.data.data.token === 'string', 'Expected new JWT token on login');
    assert(loginRes.data.data.user.passwordHash === undefined, 'passwordHash must not be exposed on login');
    console.log('  ✅ PASSED: Successful authentication returned JWT token and user profile\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 7: Invalid login is rejected
    // -------------------------------------------------------------
    console.log('Test 7: POST /api/auth/login with invalid credentials');
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: donorEmail,
        password: 'WrongPassword@999',
      },
    });

    assert(badLoginRes.status === 401, `Expected 401 Unauthorized for wrong password, got ${badLoginRes.status}`);
    assert(badLoginRes.data.success === false, 'Expected success: false for invalid login');
    assert(badLoginRes.data.message.includes('Invalid email or password'), 'Expected standard invalid credentials message');

    const nonExistentRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'nobody_exists@nowhere.org',
        password: 'Password@123',
      },
    });
    assert(nonExistentRes.status === 401, 'Non-existent account should return 401');
    console.log('  ✅ PASSED: Invalid logins correctly rejected with 401 Unauthorized\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 8: Protected routes reject unauthenticated requests
    // -------------------------------------------------------------
    console.log('Test 8: Protected routes reject unauthenticated requests');
    // No Authorization header
    const noAuthRes = await request('/api/users/me');
    assert(noAuthRes.status === 401, `Expected 401 without auth header, got ${noAuthRes.status}`);
    assert(noAuthRes.data.success === false, 'Expected success: false');

    // Invalid/malformed token
    const badTokenRes = await request('/api/users/me', {
      headers: { Authorization: 'Bearer this.is.an.invalid.token' },
    });
    assert(badTokenRes.status === 401, `Expected 401 with invalid token, got ${badTokenRes.status}`);
    console.log('  ✅ PASSED: Missing and forged tokens rejected with 401 Unauthorized\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 9: Role restrictions work
    // -------------------------------------------------------------
    console.log('Test 9: Role-based authorization restrictions');
    // DONOR attempts to access admin endpoint
    const forbiddenRes = await request('/api/admin/organizations', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });

    assert(forbiddenRes.status === 403, `Expected 403 Forbidden for non-admin, got ${forbiddenRes.status}`);
    assert(forbiddenRes.data.success === false, 'Expected success: false');
    assert(forbiddenRes.data.message.includes('Forbidden'), 'Expected message indicating forbidden role');

    // Ensure seeded Admin account can log in and access admin endpoint
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@foodbridge.org',
        password: 'Admin@123',
      },
    });
    assert(adminLoginRes.status === 200, `Admin login failed: ${JSON.stringify(adminLoginRes.data)}`);
    const adminToken = adminLoginRes.data.data.token;

    const adminAllowedRes = await request('/api/admin/organizations', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminAllowedRes.status === 200, `Admin should get 200 OK, got ${adminAllowedRes.status}`);
    assert(adminAllowedRes.data.success === true, 'Admin request should succeed');
    console.log('  ✅ PASSED: Role authorization enforced (Non-admin 403 Forbidden, Admin 200 OK)\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 10: A user cannot modify another user's profile, role, or privileges
    // -------------------------------------------------------------
    console.log("Test 10: User profile privacy and privilege escalation prevention");
    // User gets own profile
    const profileRes = await request('/api/users/me', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(profileRes.status === 200, 'Expected 200 OK for GET /api/users/me');
    assert(profileRes.data.data.email === donorEmail, 'Profile must belong to authenticated user');

    // User attempts privilege escalation via PATCH /api/users/me
    const roleTamperRes = await request('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        role: 'ADMIN', // Illegal privilege escalation
      },
    });
    assert(roleTamperRes.status === 400, `Role modification should be rejected with 400, got ${roleTamperRes.status}`);

    const statusTamperRes = await request('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        accountStatus: 'SUSPENDED', // Illegal accountStatus modification
      },
    });
    assert(statusTamperRes.status === 400, `Account status modification should be rejected with 400, got ${statusTamperRes.status}`);

    // Permitted profile updates should succeed
    const validProfileUpdate = await request('/api/users/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        name: 'Grand Hotel Kitchen & Bakery',
        phone: '+1 555-9999',
      },
    });
    assert(validProfileUpdate.status === 200, 'Permitted profile updates should return 200');
    assert(validProfileUpdate.data.data.name === 'Grand Hotel Kitchen & Bakery', 'Name should be updated');
    console.log('  ✅ PASSED: Privilege escalation blocked; permitted profile fields updated cleanly\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 11: Organization submission works
    // -------------------------------------------------------------
    console.log('Test 11: POST /api/organizations (Submit Organization Details)');
    // Register a new recipient user without organization
    const recipientEmail = `recipient_${Date.now()}@example.com`;
    const recRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Community Food Shelter',
        email: recipientEmail,
        password: 'Password@123',
        role: 'RECIPIENT',
        phone: '+1 555-4321',
      },
    });
    const recipientToken = recRegRes.data.data.token;

    // Recipient submits organization details
    const orgSubmitRes = await request('/api/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        organizationName: 'City Hope Community Pantry',
        organizationType: 'NGO',
        description: 'Providing surplus food parcels to low-income families and shelters',
        contactPerson: 'David Miller',
        email: 'info@cityhopepantry.org',
        phone: '+1 555-7788',
        address: {
          street: '500 Community Ave',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10025',
        },
        registrationNumber: 'NGO-2026-9901',
      },
    });

    assert(orgSubmitRes.status === 201, `Expected 201 Created for org submission, got ${orgSubmitRes.status}`);
    assert(orgSubmitRes.data.success === true, 'Expected success: true');
    assert(orgSubmitRes.data.data.verificationStatus === 'PENDING', `Expected PENDING status, got ${orgSubmitRes.data.data.verificationStatus}`);
    assert(orgSubmitRes.data.data.organizationName === 'City Hope Community Pantry', 'Organization name should match');
    const createdOrgId = orgSubmitRes.data.data._id;

    // Verify user profile now links to organization
    const recProfileRes = await request('/api/organizations/me', {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    assert(recProfileRes.status === 200, 'GET /api/organizations/me should return 200');
    assert(recProfileRes.data.data._id === createdOrgId, 'Organization ID should match');

    // Ensure recipient cannot self-verify organization
    const selfVerifyRes = await request('/api/organizations/me', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        verificationStatus: 'VERIFIED', // Disallowed self-verification
      },
    });
    assert(selfVerifyRes.status === 400, `Expected 400 for self-verification attempt, got ${selfVerifyRes.status}`);
    console.log(`  ✅ PASSED: Organization submitted with PENDING status (ID: ${createdOrgId}); self-verification blocked\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 12: Only administrators can verify organizations
    // -------------------------------------------------------------
    console.log('Test 12: Administrative verification of organizations');
    // Non-admin user tries to verify organization
    const nonAdminVerifyRes = await request(`/api/admin/organizations/${createdOrgId}/verification`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: { status: 'VERIFIED', notes: 'Unauthorized attempt' },
    });
    assert(nonAdminVerifyRes.status === 403, `Non-admin verification should return 403, got ${nonAdminVerifyRes.status}`);

    // Admin verifies the organization
    const adminVerifyRes = await request(`/api/admin/organizations/${createdOrgId}/verification`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        status: 'VERIFIED',
        notes: 'Tax exemption certificate and NGO registration verified by Admin',
      },
    });

    assert(adminVerifyRes.status === 200, `Admin verification should return 200 OK, got ${adminVerifyRes.status}`);
    assert(adminVerifyRes.data.data.verificationStatus === 'VERIFIED', 'Status should be updated to VERIFIED');
    assert(adminVerifyRes.data.data.reviewedBy !== null, 'reviewedBy administrator ID must be recorded');
    assert(adminVerifyRes.data.data.reviewedAt !== null, 'reviewedAt timestamp must be recorded');

    // Test invalid state transition: Cannot revert VERIFIED back to PENDING
    const revertRes = await request(`/api/admin/organizations/${createdOrgId}/verification`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'PENDING' },
    });
    assert(revertRes.status === 400, `Reverting to PENDING should be rejected with 400, got ${revertRes.status}`);
    console.log('  ✅ PASSED: Only Admin can verify; audit fields recorded; invalid state transitions rejected\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 13: ADMIN cannot be assigned through public registration
    // -------------------------------------------------------------
    console.log('Test 13: Prevent ADMIN assignment through public registration');
    const adminAttemptRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Sneaky User',
        email: `hacker_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'ADMIN', // Forbidden public registration role
      },
    });

    assert(adminAttemptRes.status === 403, `Expected 403 Forbidden for public ADMIN registration, got ${adminAttemptRes.status}`);
    assert(adminAttemptRes.data.success === false, 'Expected success: false');
    assert(adminAttemptRes.data.message.includes('not permitted through public registration'), `Expected clear message, got: ${adminAttemptRes.data.message}`);
    console.log(`  ✅ PASSED: Public registration as ADMIN strictly rejected with 403 Forbidden: "${adminAttemptRes.data.message}"\n`);
    passedTests++;

    // -------------------------------------------------------------
    // Test 14: API errors are handled correctly
    // -------------------------------------------------------------
    console.log('Test 14: Consistent API error handling & security response structure');
    // 404 Not Found
    const notFoundRes = await request('/api/route-that-does-not-exist');
    assert(notFoundRes.status === 404, `Expected 404 for non-existent route, got ${notFoundRes.status}`);
    assert(notFoundRes.data.success === false, 'Expected success: false on 404');
    assert(typeof notFoundRes.data.message === 'string', 'Expected human-readable message on 404');

    // 400 Validation Error (e.g. short password)
    const valErrorRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Valid Name',
        email: 'valid_email@example.com',
        password: '123', // Less than 6 characters
        role: 'DONOR',
      },
    });
    assert(valErrorRes.status === 400, `Expected 400 for validation failure, got ${valErrorRes.status}`);
    assert(valErrorRes.data.success === false, 'Expected success: false on validation error');
    assert(valErrorRes.data.stack === undefined, 'Error response must never leak server stack traces');
    console.log('  ✅ PASSED: Clean error formats ({ success: false, message: ... }), no stack traces or secret leaks\n');
    passedTests++;

    // -------------------------------------------------------------
    // Test 15 (Bonus): Server-side Logout & Token Invalidation
    // -------------------------------------------------------------
    console.log('Test 15: Token invalidation on POST /api/auth/logout');
    // Call logout endpoint with valid donor token
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(logoutRes.status === 200, `Expected 200 OK on logout, got ${logoutRes.status}`);
    assert(logoutRes.data.success === true, 'Expected success: true on logout');

    // Immediately attempt to reuse donor token
    const reusedTokenRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(reusedTokenRes.status === 401, `Reused token should be rejected with 401, got ${reusedTokenRes.status}`);
    assert(reusedTokenRes.data.message.includes('invalidated'), `Expected token invalidated message, got: ${reusedTokenRes.data.message}`);
    console.log('  ✅ PASSED: Token invalidation verified (Reused token rejected with 401 Unauthorized)\n');
    passedTests++;

    // Summary
    console.log('================================================================');
    console.log(`🎉 ALL ${passedTests} PHASE 1 INTEGRATION TESTS COMPLETED SUCCESSFULLY!`);
    console.log('================================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN ABORTED WITH ERROR:', error.message);
    if (server) server.close();
    process.exit(1);
  }
}

runPhase1Tests();

