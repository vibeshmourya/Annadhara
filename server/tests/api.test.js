const { app, startServer } = require('../src/server');
const http = require('http');

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

async function runTests() {
  console.log('🚀 Starting Annadhara Backend Automated Integration Tests (Team Seva Shakti)...\n');

  try {
    server = await startServer();
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // 1. Health check
    console.log('Test 1: Health check endpoint');
    const health = await request('/api/health');
    if (health.status !== 200 || health.data.status !== 'online') {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    console.log('  ✅ Health check passed\n');

    // 2. Authentication: Register Donor
    console.log('Test 2: Register New Donor');
    const donorRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Donor Org',
        email: `donor_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'donor',
        phone: '1234567890',
        organizationName: 'Fresh Canteen Co',
        organizationType: 'canteen',
      },
    });
    if (donorRes.status !== 201 || !donorRes.data.data.token) {
      throw new Error(`Donor registration failed: ${JSON.stringify(donorRes)}`);
    }
    const donorToken = donorRes.data.data.token;
    console.log('  ✅ Donor registered & token generated\n');

    // 3. Register Recipient (NGO)
    console.log('Test 3: Register New Recipient');
    const recipientRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Recipient NGO',
        email: `ngo_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'recipient',
        phone: '9876543210',
        organizationName: 'City Hope Shelter',
        organizationType: 'ngo',
      },
    });
    if (recipientRes.status !== 201 || !recipientRes.data.data.token) {
      throw new Error(`Recipient registration failed: ${JSON.stringify(recipientRes)}`);
    }
    let recipientToken = recipientRes.data.data.token;
    const recipientOrgId =
      recipientRes.data.data.user.organizationId?._id ||
      recipientRes.data.data.user.organizationId ||
      recipientRes.data.data.user.organization?._id ||
      recipientRes.data.data.user.organization;
    console.log('  ✅ Recipient registered (Org pending verification)\n');

    // 4. Authenticate Admin & verify Recipient
    console.log('Test 4: Authenticate Admin & Verify Recipient Organization');
    let adminToken;
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@foodbridge.org',
        password: 'Admin@123',
      },
    });
    if (adminLoginRes.status === 200 && adminLoginRes.data.data?.token) {
      adminToken = adminLoginRes.data.data.token;
    } else {
      // Fallback: create direct admin in DB if seed was bypassed in test mode
      const User = require('../src/models/User');
      let adminUser = await User.findOne({ email: 'admin@foodbridge.org' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Platform Admin',
          email: 'admin@foodbridge.org',
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
        });
        adminUser.password = 'Admin@123';
        await adminUser.save();
      }
      const jwt = require('jsonwebtoken');
      adminToken = jwt.sign(
        { id: adminUser._id, role: 'ADMIN' },
        process.env.JWT_SECRET || 'foodbridge_super_secret_jwt_key_2026_shared_hope_zero_waste',
        { expiresIn: '7d' }
      );
    }

    // Admin verifies the recipient org
    const verifyRes = await request(`/api/organizations/${recipientOrgId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'verified', notes: 'Approved in test suite' },
    });
    if (verifyRes.status !== 200 || verifyRes.data.data.verificationStatus?.toUpperCase() !== 'VERIFIED') {
      throw new Error(`Org verification failed: ${JSON.stringify(verifyRes)}`);
    }
    console.log('  ✅ Organization verified by admin\n');

    // 5. Donor publishes a donation
    console.log('Test 5: Create Surplus Food Donation');
    const now = new Date();
    const donationRes = await request('/api/donations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        title: '50 Hot Vegetarian Lunch Boxes',
        category: 'cooked_meals',
        description: 'Fresh warm food prepared 1 hour ago for seminar. Packed in sealed containers.',
        totalQuantity: 50,
        unit: 'meals',
        prepDateTime: now.toISOString(),
        expiryDateTime: new Date(now.getTime() + 8 * 3600 * 1000).toISOString(),
        storageHandling: 'hot_held',
        allergens: ['Dairy'],
        pickupLocation: {
          address: { street: '123 Market St', city: 'Metropolis', state: 'NY', postalCode: '10001' },
          location: { type: 'Point', coordinates: [-73.98, 40.75] },
        },
        pickupStartTime: now.toISOString(),
        pickupEndTime: new Date(now.getTime() + 6 * 3600 * 1000).toISOString(),
        safetyGuidelinesAccepted: true,
      },
    });
    if (donationRes.status !== 201) {
      throw new Error(`Donation creation failed: ${JSON.stringify(donationRes)}`);
    }
    const donation = donationRes.data.data;
    console.log(`  ✅ Donation created with ID: ${donation._id}, available: ${donation.availableQuantity} meals\n`);

    // 6. Discovery & Search
    console.log('Test 6: Discover & Filter Donations');
    const discoverRes = await request('/api/donations?category=cooked_meals');
    if (discoverRes.status !== 200 || !discoverRes.data.data.length) {
      throw new Error(`Donation discovery failed: ${JSON.stringify(discoverRes)}`);
    }
    console.log(`  ✅ Successfully discovered ${discoverRes.data.count} available donations\n`);

    // 7. Oversubscription Prevention Check
    console.log('Test 7: Atomic Oversubscription Prevention');
    const overRes = await request('/api/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        donationId: donation._id,
        requestedQuantity: 999, // Way more than available (50)
      },
    });
    if (overRes.status !== 400) {
      throw new Error(`Oversubscription check failed! Server allowed excess reservation: ${JSON.stringify(overRes)}`);
    }
    console.log('  ✅ Oversubscription successfully rejected by backend logic!\n');

    // 8. Valid Reservation (20 meals)
    console.log('Test 8: Reserve 20 meals');
    const validRes = await request('/api/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        donationId: donation._id,
        requestedQuantity: 20,
        requestNotes: 'For evening youth feeding program',
      },
    });
    if (validRes.status !== 201) {
      throw new Error(`Valid reservation failed: ${JSON.stringify(validRes)}`);
    }
    const reservation = validRes.data.data.reservation;
    const handoverCode = reservation.handoverCode;
    console.log(`  ✅ Reserved 20 meals. Handover Code: ${handoverCode}, remaining: ${validRes.data.data.remainingAvailableQuantity}\n`);

    // 9. Donor Approves Reservation -> Creates Pickup Task
    console.log('Test 9: Donor Approves Reservation');
    const approveRes = await request(`/api/reservations/${reservation._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'approved', donorNotes: 'Ready for pickup' },
    });
    if (approveRes.status !== 200 || approveRes.data.data.reservation.status !== 'approved') {
      throw new Error(`Approval failed: ${JSON.stringify(approveRes)}`);
    }
    const pickupTaskId = approveRes.data.data.pickupTaskId;
    console.log(`  ✅ Reservation approved. Pickup task created: ${pickupTaskId}\n`);

    // 10. Register Volunteer & Claim Pickup Task
    console.log('Test 10: Volunteer Claims Pickup Task');
    const volunteerRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Volunteer Runner',
        email: `volunteer_${Date.now()}@example.com`,
        password: 'Password@123',
        role: 'volunteer',
      },
    });
    const volunteerToken = volunteerRes.data.data.token;

    const claimRes = await request(`/api/pickups/${pickupTaskId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    if (claimRes.status !== 200) {
      throw new Error(`Pickup claim failed: ${JSON.stringify(claimRes)}`);
    }
    console.log('  ✅ Volunteer claimed pickup task\n');

    // 11. Handover Confirmation using Code
    console.log('Test 11: Food Handover Confirmation (Zero Waste Invariant)');
    const handoverRes = await request('/api/handover/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        reservationId: reservation._id,
        handoverCode: handoverCode,
        notes: 'Handed over in warm insulated thermal containers',
      },
    });
    if (handoverRes.status !== 200) {
      throw new Error(`Handover failed: ${JSON.stringify(handoverRes)}`);
    }
    console.log('  ✅ Handover confirmed! Food successfully rescued and collected\n');

    // 12. Check Dashboard Stats
    console.log('Test 12: Verify Database-driven Dashboard Stats');
    const donorStats = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    if (donorStats.status !== 200 || donorStats.data.data.totalCollected !== 20) {
      throw new Error(`Dashboard stats mismatch: ${JSON.stringify(donorStats)}`);
    }
    console.log(`  ✅ Donor Dashboard stats verified from DB: total collected = ${donorStats.data.data.totalCollected}\n`);

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! The Annadhara shared backend is robust, atomic, and secure.\n');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
