/**
 * ANNADHARA — IMAGE UPLOAD & VALIDATION REGRESSION TEST SUITE
 * Team Seva Shakti (MERNOVA X 2026)
 */

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');

let mongoServer;
let server;
let baseUrl;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runUploadTests() {
  console.log('\n================================================================');
  console.log('🌿 ANNADHARA IMAGE UPLOAD & VALIDATION TEST SUITE');
  console.log('================================================================\n');

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  // Seed a test donor
  const donor = await User.create({
    name: 'Test Kitchen',
    email: 'testkitchen@example.com',
    password: 'Password@123',
    role: 'DONOR',
    phone: '+91 98765 43210',
  });

  // Log in to get JWT token
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testkitchen@example.com',
      password: 'Password@123',
    }),
  });
  const loginBody = await loginRes.json();
  const donorToken = loginBody.data?.token;
  assert(donorToken, 'Donor token acquired');

  let passed = 0;
  let total = 0;

  // Test 1: Reject unauthenticated upload
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/upload/image`, { method: 'POST' });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    console.log('  ✅ PASSED: Test 1 - Unauthenticated image upload rejected with 401');
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 1 -', err.message);
  }

  // Test 2: Reject upload without file
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const body = await res.json();
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(body.success === false, 'Body success is false');
    console.log('  ✅ PASSED: Test 2 - Empty upload payload rejected with 400');
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 2 -', err.message);
  }

  // Test 3: Upload valid PNG image
  total++;
  try {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = new FormData();
    formData.append('image', new Blob([pngBuffer], { type: 'image/png' }), 'test-dish.png');

    const res = await fetch(`${baseUrl}/api/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: formData,
    });
    const body = await res.json();
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(body.success === true, 'Body success is true');
    assert(body.data.url.startsWith('/uploads/donations/'), `Expected upload url, got ${body.data.url}`);

    // Verify static serving of uploaded image
    const staticRes = await fetch(`${baseUrl}${body.data.url}`);
    assert(staticRes.status === 200, `Expected 200 for static image, got ${staticRes.status}`);
    console.log(`  ✅ PASSED: Test 3 - Valid image uploaded successfully (${body.data.url}) & served statically`);
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 3 -', err.message);
  }

  // Test 4: SSRF Prevention: Localhost / internal URL rejected
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/upload/validate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({ url: 'http://localhost:5000/internal-data' }),
    });
    const body = await res.json();
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(body.success === false, 'Body success is false');
    console.log('  ✅ PASSED: Test 4 - SSRF protection blocked localhost/internal URL');
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 4 -', err.message);
  }

  // Test 5: Valid public image URL passed
  total++;
  try {
    const res = await fetch(`${baseUrl}/api/upload/validate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({ url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }),
    });
    const body = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(body.success === true, 'Body success is true');
    console.log('  ✅ PASSED: Test 5 - Valid public image URL validated successfully');
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 5 -', err.message);
  }

  // Test 6: Create donation with Indian category and NO prepDateTime/expiryDateTime
  total++;
  try {
    const donationRes = await fetch(`${baseUrl}/api/donations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify({
        title: 'Dal Makhani & Jeera Rice',
        category: 'rice_meals', // India-specific category that was previously failing
        dietaryType: 'Vegetarian',
        description: 'Freshly prepared vegetarian meal from college canteen',
        totalQuantity: 25,
        unit: 'plates',
        storageHandling: 'hot_held',
        allergens: ['Dairy'],
        pickupLocation: {
          address: {
            street: '12 Temple Road',
            areaLocality: 'Indiranagar',
            city: 'Bengaluru',
            district: 'Bengaluru Urban',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
          },
        },
        pickupStartTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        pickupEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        safetyGuidelinesAccepted: true,
      }),
    });
    const donationBody = await donationRes.json();
    assert(donationRes.status === 201, `Expected 201, got ${donationRes.status}: ${JSON.stringify(donationBody)}`);
    assert(donationBody.success === true, 'Donation created successfully');
    assert(donationBody.data.category === 'rice_meals', 'Category matches rice_meals');
    assert(donationBody.data.unit === 'plates', 'Unit matches plates');
    console.log('  ✅ PASSED: Test 6 - Donation created with rice_meals, plates, and no prep/expiry dates (Validation Fix Verified!)');
    passed++;
  } catch (err) {
    console.error('  ❌ FAILED: Test 6 -', err.message);
  }

  // Teardown
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongoServer.stop();

  console.log(`\n================================================================`);
  console.log(`Upload & Category Regression: ${passed}/${total} tests passed!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runUploadTests().catch((err) => {
  console.error('Upload test runner failed:', err);
  process.exit(1);
});
