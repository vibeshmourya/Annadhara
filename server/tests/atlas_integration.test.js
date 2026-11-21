/**
 * ANNADHARA — MONGODB ATLAS CLOUD DATABASE INTEGRATION TEST SUITE
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies:
 * 1. Live connection to MongoDB Atlas cloud database
 * 2. Database connection initializes before server operations
 * 3. Health check reporting live connected status
 * 4. User registration persisted in Atlas
 * 5. User authentication & JWT generation against Atlas
 * 6. Food donation creation persisted in Atlas
 * 7. Food donation retrieval and filtering from Atlas
 * 8. Food reservation creation with atomic inventory update on Atlas
 * 9. Food reservation retrieval from Atlas
 * 10. Demo seeding idempotency (no duplicate records, no data wipe on restart)
 */

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { startServer } = require('../server');
const { seedDatabase } = require('../src/utils/seedData');
const User = require('../src/models/User');
const Donation = require('../src/models/Donation');
const Reservation = require('../src/models/Reservation');

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
  return { status: response.status, body: data };
}

async function runAtlasTests() {
  console.log('\n================================================================');
  console.log('🌿 ANNADHARA: MONGODB ATLAS LIVE CLOUD INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // 1. Start Server & Connect to Live Atlas Database
  total++;
  try {
    process.env.NODE_ENV = 'development';
    const serverInstance = await startServer(0);
    server = serverInstance;
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    assert(mongoose.connection.readyState === 1, 'MongoDB connection readyState must be 1 (connected)');
    console.log(`  ✅ PASSED: Test 1 - Live connection established to MongoDB Atlas [Cluster: ${mongoose.connection.host}, DB: ${mongoose.connection.name}]`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 1 - Could not connect to Atlas: ${err.message}`);
    process.exit(1);
  }

  // 2. Health check endpoint (GET /api/health)
  total++;
  try {
    const res = await request('/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Response success must be true');
    assert(res.body.status === 'online', 'Status must be online');
    assert(res.body.database === 'connected' || res.body.database?.status === 'connected', 'Database status must be connected');
    console.log(`  ✅ PASSED: Test 2 - Health check verified live Atlas connection (status: ${res.body.status}, db: ${res.body.database})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 2 - Health check failed: ${err.message}`);
  }

  // 3. Register New Donor on MongoDB Atlas (POST /api/auth/register)
  total++;
  const uniqueSuffix = Date.now();
  const testDonorEmail = `donor_${uniqueSuffix}@example.com`;
  let donorToken = null;
  let donorId = null;

  try {
    const regPayload = {
      name: 'Atlas Test Restaurant',
      email: testDonorEmail,
      password: 'Password@123',
      role: 'DONOR',
      phone: '+91 98765 00112',
      organizationName: 'Atlas Test Kitchen',
      organizationType: 'Restaurant',
      address: {
        street: '100 MG Road',
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
      body: JSON.stringify(regPayload),
    });

    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Success must be true');
    assert(res.body.data.token, 'Token must be returned');
    donorToken = res.body.data.token;
    donorId = res.body.data.user.id || res.body.data.user._id;

    // Verify record directly in MongoDB Atlas
    const dbUser = await User.findOne({ email: testDonorEmail });
    assert(dbUser !== null, 'User document must be found in Atlas MongoDB');
    assert(dbUser.role === 'DONOR', 'User role must be DONOR');
    console.log(`  ✅ PASSED: Test 3 - User registered & persisted in MongoDB Atlas (ID: ${donorId})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 3 - Registration failed: ${err.message}`);
  }

  // 4. Authenticate & Login via MongoDB Atlas (POST /api/auth/login)
  total++;
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testDonorEmail,
        password: 'Password@123',
      }),
    });

    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Success must be true');
    assert(res.body.data.token, 'JWT token must be returned on login');
    donorToken = res.body.data.token;
    console.log('  ✅ PASSED: Test 4 - Login authenticated against MongoDB Atlas credentials');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 4 - Login failed: ${err.message}`);
  }

  // 5. Create Food Donation in MongoDB Atlas (POST /api/donations)
  total++;
  let donationId = null;
  try {
    const donationPayload = {
      title: 'Atlas Test Fresh Paneer Biryani',
      category: 'biryani',
      dietaryType: 'Vegetarian',
      description: 'Freshly prepared vegetarian biryani in food-grade sealed trays',
      totalQuantity: 30,
      unit: 'plates',
      storageHandling: 'hot_held',
      allergens: ['Dairy'],
      pickupStartTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      pickupEndTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      pickupLocation: {
        address: {
          street: '100 MG Road',
          areaLocality: 'Indiranagar',
          city: 'Bengaluru',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
        location: {
          type: 'Point',
          coordinates: [77.6412, 12.9719],
        },
      },
      safetyGuidelinesAccepted: true,
    };

    const res = await request('/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`,
      },
      body: JSON.stringify(donationPayload),
    });

    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Success must be true');
    assert(res.body.data._id, 'Donation ID must exist');
    donationId = res.body.data._id;

    // Direct Atlas check
    const dbDonation = await Donation.findById(donationId);
    assert(dbDonation !== null, 'Donation document must exist in MongoDB Atlas');
    assert(dbDonation.availableQuantity === 30, 'Available quantity must be 30');
    assert(dbDonation.category === 'biryani', 'Category must match biryani');
    console.log(`  ✅ PASSED: Test 5 - Food donation published and saved to Atlas (ID: ${donationId})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 5 - Donation creation failed: ${err.message}`);
  }

  // 6. Retrieve & Search Food Donations from MongoDB Atlas (GET /api/donations)
  total++;
  try {
    const res = await request(`/api/donations?search=Biryani`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Success must be true');
    assert(Array.isArray(res.body.data), 'Data must be an array');
    const found = res.body.data.some((d) => (d._id || d.id) === donationId);
    assert(found, 'Newly created donation must be returned in query results from Atlas');

    // Also get single donation details
    const singleRes = await request(`/api/donations/${donationId}`, {
      headers: {
        Authorization: `Bearer ${donorToken}`,
      },
    });
    assert(singleRes.status === 200, 'Single donation retrieval must succeed');
    assert(singleRes.body.data.title === 'Atlas Test Fresh Paneer Biryani', 'Title must match');
    console.log(`  ✅ PASSED: Test 6 - Food donation successfully retrieved & searched from Atlas`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 6 - Donation retrieval failed: ${err.message}`);
  }

  // 7. Create Reservation & Atomic Quantity Update in MongoDB Atlas (POST /api/reservations)
  total++;
  let recipientToken = null;
  let reservationId = null;
  try {
    // Login as pre-seeded verified recipient
    const recipientLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ngo@hopeharvest.org',
        password: 'Recipient@123',
      }),
    });

    assert(recipientLogin.status === 200, `Recipient login failed: ${JSON.stringify(recipientLogin.body)}`);
    recipientToken = recipientLogin.body.data.token;

    // Reserve 10 plates of the 30 available
    const reservePayload = {
      donationId,
      requestedQuantity: 10,
      requestNotes: 'Need 10 plates for evening shelter distribution',
    };

    const res = await request('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recipientToken}`,
      },
      body: JSON.stringify(reservePayload),
    });

    assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert(res.body.success === true, 'Reservation must succeed');
    const createdReservation = res.body.data.reservation || res.body.data;
    assert(createdReservation.handoverCode, 'Handover code must be generated');
    reservationId = createdReservation._id;

    // Verify atomic quantity decrement directly on Atlas
    const updatedDonation = await Donation.findById(donationId);
    assert(updatedDonation.availableQuantity === 20, `Available quantity should be 20, got ${updatedDonation.availableQuantity}`);
    assert(updatedDonation.reservedQuantity === 10, `Reserved quantity should be 10, got ${updatedDonation.reservedQuantity}`);
    console.log(`  ✅ PASSED: Test 7 - Reservation created on Atlas with atomic inventory protection (Code: ${createdReservation.handoverCode})`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 7 - Reservation creation failed: ${err.message}`);
  }

  // 8. Retrieve Reservations from MongoDB Atlas (GET /api/reservations)
  total++;
  try {
    const res = await request('/api/reservations', {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });

    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Success must be true');
    assert(Array.isArray(res.body.data), 'Data must be array');
    const foundRes = res.body.data.some((r) => (r._id || r.id) === reservationId);
    assert(foundRes, 'Newly created reservation must be in recipient reservations list from Atlas');
    console.log('  ✅ PASSED: Test 8 - Reservation retrieved successfully from MongoDB Atlas');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 8 - Reservation retrieval failed: ${err.message}`);
  }

  // 9. Seeding Idempotency: Restart check must preserve data without duplicates
  total++;
  try {
    const initialUserCount = await User.countDocuments();
    const initialDonationCount = await Donation.countDocuments();

    // Call seedDatabase without forceClean (simulating backend restart)
    await seedDatabase({ forceClean: false });

    const postSeedUserCount = await User.countDocuments();
    const postSeedDonationCount = await Donation.countDocuments();

    assert(initialUserCount === postSeedUserCount, `User count should remain ${initialUserCount}, got ${postSeedUserCount}`);
    assert(initialDonationCount === postSeedDonationCount, `Donation count should remain ${initialDonationCount}, got ${postSeedDonationCount}`);
    console.log(`  ✅ PASSED: Test 9 - Seeding idempotency verified (Records preserved: ${initialUserCount} users, ${initialDonationCount} donations, 0 duplicates)`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 9 - Seeding idempotency failed: ${err.message}`);
  }

  // Clean up test documents created during this test
  try {
    if (reservationId) await Reservation.findByIdAndDelete(reservationId);
    if (donationId) await Donation.findByIdAndDelete(donationId);
    if (donorId) await User.findByIdAndDelete(donorId);
  } catch (_) {}

  // Teardown
  if (server) await new Promise((r) => server.close(r));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  console.log(`\n================================================================`);
  console.log(`🌿 Atlas Cloud Integration Test Result: ${passed}/${total} PASSED!`);
  console.log(`================================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runAtlasTests().catch((err) => {
  console.error('Atlas test runner execution error:', err);
  process.exit(1);
});
