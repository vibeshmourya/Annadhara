/**
 * ANNADHARA — REGISTRATION WORKFLOW REGRESSION TEST SUITE
 * Verifies donor, recipient NGO, and volunteer registration, validation consistency,
 * orphan-user rollback prevention, login continuity, and dashboard access.
 */

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');

let mongoServer;
let server;
let baseUrl;

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = http.request(url, { method: method.toUpperCase(), headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (data !== null) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runRegistrationRegressionTests() {
  console.log('\n================================================================');
  console.log('🌿 ANNADHARA REGISTRATION WORKFLOW REGRESSION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });

    // 1. Orphan prevention & retry on missing organization phone (Screenshot Reproduction Pre-check)
    const retryEmail = `vibesh.donor.${Date.now()}@example.com`;
    const missingPhoneRes = await request('post', '/api/auth/register', {
      name: 'Vibesh',
      email: retryEmail,
      password: 'Password@123',
      role: 'FOOD_DONOR',
      phone: '',
      address: { street: '', city: 'Bengaluru', state: 'KA', postalCode: '560064' },
      organizationName: 'Presidency Huduga',
      organizationType: 'College Canteen',
    });
    assert(
      missingPhoneRes.status === 400 || missingPhoneRes.status === 422,
      `Missing org phone cleanly rejected with HTTP ${missingPhoneRes.status}`
    );
    const orphanCheck = await User.findOne({ email: retryEmail });
    assert(!orphanCheck, 'No orphaned User persisted when organization validation failed');

    // 2. Successful Food Donor registration + retry with same email now works
    const donorRegRes = await request('post', '/api/auth/register', {
      name: 'Vibesh',
      email: retryEmail,
      password: 'Password@123',
      role: 'FOOD_DONOR',
      phone: '+91 9876543210',
      address: { street: '', city: 'Bengaluru', state: 'KA', pincode: '560064' },
      organizationName: 'Presidency Huduga',
      organizationType: 'College Canteen',
    });
    assert(donorRegRes.status === 201 && donorRegRes.data.success === true, 'Food Donor registered (201 Created)');
    assert(donorRegRes.data.data.user.role === 'DONOR', 'FOOD_DONOR normalized to DONOR role');
    assert(Boolean(donorRegRes.data.data.token), 'JWT token returned on donor registration');
    assert(!donorRegRes.data.data.user.passwordHash && !donorRegRes.data.data.user.password, 'Password hash stripped from response');

    const donorUserDb = await User.findOne({ email: retryEmail }).select('+passwordHash');
    const donorOrgDb = await Organization.findById(donorUserDb.organizationId);
    assert(Boolean(donorUserDb.passwordHash) && donorUserDb.passwordHash.startsWith('$2'), 'Password bcrypt hashed in MongoDB');
    assert(Boolean(donorOrgDb) && donorOrgDb.organizationName === 'Presidency Huduga', 'Linked Organization created in MongoDB');
    assert(donorOrgDb.organizationType === 'College Canteen', 'Organization type College Canteen stored accurately');
    assert(donorOrgDb.verificationStatus === 'VERIFIED', 'Donor organization auto-verified');
    assert(donorOrgDb.address.city === 'Bengaluru' && donorOrgDb.address.postalCode === '560064', 'Address city and pincode saved');

    // Immediate login + Donor dashboard check
    const donorLoginRes = await request('post', '/api/auth/login', {
      email: retryEmail,
      password: 'Password@123',
    });
    assert(donorLoginRes.status === 200 && Boolean(donorLoginRes.data.data.token), 'Donor can immediately log in after registration');
    const donorDashRes = await request('get', '/api/dashboard/stats', null, donorLoginRes.data.data.token);
    assert(donorDashRes.status === 200 && donorDashRes.data.success === true, 'Registered Donor accesses /api/dashboard/stats');

    // 3. Recipient NGO Registration
    const ngoEmail = `ngo.reg.${Date.now()}@example.com`;
    const ngoRegRes = await request('post', '/api/auth/register', {
      name: 'Asha Trust Coordinator',
      email: ngoEmail,
      password: 'Password@123',
      role: 'RECIPIENT',
      phone: '+91 9845012345',
      address: { street: '12 Main Rd', city: 'Bengaluru', state: 'KA', postalCode: '560001' },
      organizationName: 'Asha Annadan NGO',
      organizationType: 'NGO',
      registrationId: 'REG-NGO-2026',
    });
    assert(ngoRegRes.status === 201 && ngoRegRes.data.data.user.role === 'RECIPIENT', 'Recipient NGO registered (201 Created)');
    const ngoOrgDb = await Organization.findById(ngoRegRes.data.data.user.organizationId._id || ngoRegRes.data.data.user.organizationId);
    assert(ngoOrgDb.verificationStatus === 'PENDING', 'Recipient NGO starts with PENDING verificationStatus');
    assert(ngoOrgDb.registrationNumber === 'REG-NGO-2026', 'Optional registrationId alias persisted');

    const ngoLoginRes = await request('post', '/api/auth/login', { email: ngoEmail, password: 'Password@123' });
    assert(ngoLoginRes.status === 200, 'Recipient NGO can immediately log in after registration');
    const ngoDashRes = await request('get', '/api/dashboard/stats', null, ngoLoginRes.data.data.token);
    assert(ngoDashRes.status === 200, 'Registered Recipient accesses /api/dashboard/stats');

    // 4. Volunteer Registration (phone/address optional for volunteers)
    const volEmail = `vol.reg.${Date.now()}@example.com`;
    const volRegRes = await request('post', '/api/auth/register', {
      name: 'Kiran Runner',
      email: volEmail,
      password: 'Password@123',
      role: 'VOLUNTEER',
      phone: '+91 9900112233',
      address: { street: '', city: 'Bengaluru', state: 'KA', postalCode: '560064' },
    });
    assert(volRegRes.status === 201 && volRegRes.data.data.user.role === 'VOLUNTEER', 'Volunteer registered (201 Created)');
    assert(!volRegRes.data.data.user.organizationId, 'Volunteer has no organization attached');

    const volLoginRes = await request('post', '/api/auth/login', { email: volEmail, password: 'Password@123' });
    assert(volLoginRes.status === 200, 'Volunteer can immediately log in after registration');
    const volDashRes = await request('get', '/api/dashboard/stats', null, volLoginRes.data.data.token);
    assert(volDashRes.status === 200, 'Registered Volunteer accesses /api/dashboard/stats');

    // 5. Validation & Security Edge Cases
    // Duplicate email -> 409 Conflict
    const dupEmailRes = await request('post', '/api/auth/register', {
      name: 'Duplicate',
      email: retryEmail,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 9876543210',
      organizationName: 'Another Org',
      organizationType: 'Restaurant',
    });
    assert(dupEmailRes.status === 409 && Array.isArray(dupEmailRes.data.errors), 'Duplicate email returns 409 Conflict with field errors');

    // Invalid email -> 400
    const badEmailRes = await request('post', '/api/auth/register', {
      name: 'Bad Email',
      email: 'not-an-email',
      password: 'Password@123',
      role: 'VOLUNTEER',
    });
    assert(badEmailRes.status === 400 && badEmailRes.data.errors?.some((e) => e.field === 'email'), 'Invalid email rejected with 400');

    // Invalid phone -> 400
    const badPhoneRes = await request('post', '/api/auth/register', {
      name: 'Bad Phone',
      email: `badphone.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'DONOR',
      phone: 'abc12',
      organizationName: 'Test Org',
      organizationType: 'Restaurant',
    });
    assert(badPhoneRes.status === 400 && badPhoneRes.data.errors?.some((e) => e.field === 'phone'), 'Invalid phone rejected with 400');

    // Short password -> 400
    const shortPwdRes = await request('post', '/api/auth/register', {
      name: 'Short Pwd',
      email: `shortpwd.${Date.now()}@example.com`,
      password: '123',
      role: 'VOLUNTEER',
    });
    assert(shortPwdRes.status === 400 && shortPwdRes.data.errors?.some((e) => e.field === 'password'), 'Short password rejected with 400');

    // Missing organization name when organizationType provided -> 400
    const missingOrgRes = await request('post', '/api/auth/register', {
      name: 'No Org Name',
      email: `noorg.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 9876543210',
      organizationName: '',
      organizationType: 'College Canteen',
    });
    assert(missingOrgRes.status === 400, 'Missing organization name rejected with 400');

    // Invalid organization type -> 400
    const badOrgTypeRes = await request('post', '/api/auth/register', {
      name: 'Bad Org Type',
      email: `badtype.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 9876543210',
      organizationName: 'Valid Name',
      organizationType: 'SpaceStation',
    });
    assert(badOrgTypeRes.status === 400, 'Invalid organization type rejected with 400');

    // Missing mandatory city in address payload -> 400
    const missingCityRes = await request('post', '/api/auth/register', {
      name: 'Missing City',
      email: `nocity.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 9876543210',
      address: { street: '', city: '', state: 'KA', postalCode: '560064' },
      organizationName: 'Presidency Huduga',
      organizationType: 'College Canteen',
    });
    assert(missingCityRes.status === 400, 'Empty city in organization address rejected with 400');

    // Unauthorized role escalation -> 403
    const adminAttempt = await request('post', '/api/auth/register', {
      name: 'Admin Attempt',
      email: `admin.attempt.${Date.now()}@example.com`,
      password: 'Password@123',
      role: 'ADMIN',
    });
    assert(adminAttempt.status === 403, 'Public registration as ADMIN blocked (403 Forbidden)');

    // Unauthenticated dashboard access -> 401
    const unauthDash = await request('get', '/api/dashboard/stats');
    assert(unauthDash.status === 401, 'Unauthenticated dashboard access rejected (401)');

    // Donor cannot access admin endpoints -> 403
    const donorAdminAttempt = await request('get', '/api/admin/organizations', null, donorLoginRes.data.data.token);
    assert(donorAdminAttempt.status === 403, 'Donor blocked from admin endpoints (403)');

    console.log(`\n🎉 REGISTRATION REGRESSION SUITE PASSED: ${passed}/${total} TESTS PASSED!\n`);
    await mongoose.disconnect();
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    process.exit(0);
  } catch (err) {
    console.error('❌ Regression test failed:', err);
    try {
      await mongoose.disconnect();
      if (server) server.close();
      if (mongoServer) await mongoServer.stop();
    } catch {}
    process.exit(1);
  }
}

runRegistrationRegressionTests();

