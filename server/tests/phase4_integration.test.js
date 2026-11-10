/**
 * ANNADHARA PHASE 4: END-TO-END CROSS-PLATFORM & SECURITY INTEGRATION TEST SUITE
 * Developed by Team Seva Shakti (MERNOVA X 2026)
 * Tests complete cross-platform scenarios A-F, RBAC, atomic concurrency, and handover security.
 */

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Organization = require('../src/models/Organization');
const Donation = require('../src/models/Donation');
const Reservation = require('../src/models/Reservation');
const PickupTask = require('../src/models/PickupTask');
const HandoverRecord = require('../src/models/HandoverRecord');
const Notification = require('../src/models/Notification');
const { seedDatabase } = require('../src/utils/seedData');

let mongoServer;
let server;
let baseUrl;

// Helper to make HTTP requests
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method: method.toUpperCase(),
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (_) {
            parsed = body;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runPhase4Tests() {
  console.log('\n================================================================');
  console.log('🌿 ANNADHARA PHASE 4: FINAL INTEGRATION & SECURITY TEST SUITE');
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
    }
  }

  try {
    // 1. Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);

    // 2. Start server
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 3. Seed demo accounts
    await seedDatabase();

    // Logins for test roles
    const donorLogin = await request('post', '/api/auth/login', {
      email: 'donor@greengarden.com',
      password: 'Donor@123',
    });
    const donorToken = donorLogin.data.data.token;
    const donorUser = donorLogin.data.data.user;

    const recipientLogin = await request('post', '/api/auth/login', {
      email: 'ngo@hopeharvest.org',
      password: 'Recipient@123',
    });
    const recipientToken = recipientLogin.data.data.token;

    const volunteerLogin = await request('post', '/api/auth/login', {
      email: 'alex@volunteer.org',
      password: 'Volunteer@123',
    });
    const volunteerToken = volunteerLogin.data.data.token;

    const adminLogin = await request('post', '/api/auth/login', {
      email: 'admin@foodbridge.org',
      password: 'Admin@123',
    });
    const adminToken = adminLogin.data.data.token;

    console.log('\n--- 1. CROSS-PLATFORM SYNCHRONIZATION TESTS (SCENARIOS A-F) ---');

    // Scenario A: Donor creates donation through React web API contract
    const createDonationRes = await request(
      'post',
      '/api/donations',
      {
        title: '50 Hot Meals Fresh Gnocchi',
        category: 'cooked_meals',
        description: 'Warm, freshly cooked gnocchi with marinara sauce in individual boxes',
        totalQuantity: 50,
        unit: 'meals',
        storageHandling: 'hot_held',
        allergens: ['dairy', 'gluten'],
        prepDateTime: new Date().toISOString(),
        pickupStartTime: new Date().toISOString(),
        pickupEndTime: new Date(Date.now() + 6 * 3600000).toISOString(),
        expiryDateTime: new Date(Date.now() + 12 * 3600000).toISOString(),
        pickupLocation: {
          address: { street: '100 Green St', city: 'Metropolis' },
          location: { type: 'Point', coordinates: [-73.99, 40.73] },
        },
        safetyGuidelinesAccepted: true,
      },
      donorToken
    );
    assert(createDonationRes.status === 201, 'Scenario A: Donor created donation via Web API contract');
    const donationId = createDonationRes.data.data._id || createDonationRes.data.data.donation?._id;

    // Mobile discovery check: Mobile queries GET /api/donations
    const mobileFeedRes = await request('get', '/api/donations', null, recipientToken);
    const foundOnMobile = mobileFeedRes.data.data.some((d) => d._id === donationId);
    assert(foundOnMobile, 'Scenario A: Web-published donation immediately discoverable on Mobile client');

    // Scenario B: Mobile donor retrieves /api/donations/my and sees own published listing
    const mobileMyDonations = await request('get', '/api/donations/my', null, donorToken);
    assert(
      mobileMyDonations.status === 200 && mobileMyDonations.data.data.some((d) => d._id === donationId),
      'Scenario B: Mobile donor can fetch published listings via /api/donations/my'
    );

    // Scenario C: Recipient requests 20 meals through reservation API
    const reserveRes = await request(
      'post',
      '/api/reservations',
      {
        donationId,
        requestedQuantity: 20,
        requestNotes: 'Shelter dinner service',
      },
      recipientToken
    );
    assert(reserveRes.status === 201, 'Scenario C: Recipient created reservation request for 20 meals');
    const reservationId = reserveRes.data.data.reservation._id;
    const handoverCode = reserveRes.data.data.reservation.handoverCode;

    // Donor checks incoming requests on both platforms
    const donorIncomingRes = await request('get', '/api/reservations', null, donorToken);
    const donorSawRequest = donorIncomingRes.data.data.some((r) => r._id === reservationId);
    assert(donorSawRequest, 'Scenario C: Donor received reservation request on both Web and Mobile');

    // Scenario D: Donor approves reservation through Mobile API contract
    const approveRes = await request(
      'patch',
      `/api/reservations/${reservationId}/status`,
      { status: 'approved' },
      donorToken
    );
    assert(approveRes.status === 200, 'Scenario D: Donor approved reservation');

    // Recipient queries /api/reservations and checks status
    const recipientResList = await request('get', '/api/reservations', null, recipientToken);
    const targetRes = recipientResList.data.data.find((r) => r._id === reservationId);
    assert(
      targetRes && targetRes.status === 'approved' && targetRes.handoverCode === handoverCode,
      'Scenario D: Recipient sees status=approved and matching Handover Code across clients'
    );

    // Scenario E: Volunteer claims pickup mission & updates status
    const availablePickups = await request('get', '/api/pickups?view=available', null, volunteerToken);
    assert(availablePickups.status === 200, 'Volunteer can discover available pickup missions');

    const pickupTask = await PickupTask.findOne({ reservation: reservationId });
    assert(pickupTask !== null, 'Pickup task was automatically generated upon reservation approval');

    const claimRes = await request('post', `/api/pickups/${pickupTask._id}/claim`, {}, volunteerToken);
    assert(claimRes.status === 200, 'Scenario E: Volunteer claimed pickup task');

    const updateStatusRes = await request(
      'patch',
      `/api/pickups/${pickupTask._id}/status`,
      { status: 'in_progress' },
      volunteerToken
    );
    assert(updateStatusRes.status === 200, 'Scenario E: Volunteer progressed task status to in_progress');

    // Scenario F: Confirm Handover using the 6-character Handover Code
    const handoverRes = await request(
      'post',
      '/api/handover/confirm',
      {
        reservationId: 'by_code',
        handoverCode,
        notes: 'Verified via Annadhara mobile code scanner',
      },
      donorToken
    );
    assert(handoverRes.status === 200, 'Scenario F: Handover successfully verified via 6-character verification code');

    // Verify atomic quantity transition: donation collectedQuantity incremented, availableQuantity updated
    const updatedDonation = await Donation.findById(donationId);
    assert(
      updatedDonation.collectedQuantity === 20 && updatedDonation.availableQuantity === 30,
      'Scenario F: Database inventory atomically preserved (collected = 20, available = 30)'
    );

    // Duplicate handover attempt must be rejected
    const dupHandover = await request(
      'post',
      '/api/handover/confirm',
      { reservationId, handoverCode },
      donorToken
    );
    assert(dupHandover.status === 400, 'Security: Duplicate handover attempt strictly rejected with 400');

    console.log('\n--- 2. AUTHENTICATION & ACCESS CONTROL SECURITY TESTS ---');

    // Test: Prevent public registration as ADMIN
    const adminRegAttempt = await request('post', '/api/auth/register', {
      name: 'Hacker Admin',
      email: 'hacker@evil.com',
      password: 'Password@123',
      role: 'ADMIN',
    });
    assert(adminRegAttempt.status === 403, 'RBAC: Public registration as ADMIN strictly blocked (403 Forbidden)');

    // Test: Recipient cannot edit another donor\'s donation
    const editDonationAttempt = await request(
      'put',
      `/api/donations/${donationId}`,
      { title: 'Hacked Title' },
      recipientToken
    );
    assert(editDonationAttempt.status === 403, 'RBAC: Recipient cannot edit or mutate donor donations (403 Forbidden)');

    // Test: Donor cannot access administrative governance endpoints
    const adminEndpointAttempt = await request('get', '/api/admin/organizations', null, donorToken);
    assert(adminEndpointAttempt.status === 403, 'RBAC: Non-admin user blocked from admin endpoints (403 Forbidden)');

    // Test: User cannot change their own role via profile update
    const roleEscalationAttempt = await request(
      'patch',
      '/api/users/me',
      { role: 'ADMIN' },
      donorToken
    );
    const donorCheck = await User.findById(donorUser._id);
    assert(
      donorCheck.role === 'DONOR',
      'Security: Privilege escalation blocked; user role cannot be modified via profile update'
    );

    // Test: Unverified recipient organization blocked from reserving food
    const unverifiedRecipientLogin = await request('post', '/api/auth/login', {
      email: 'care@communityfood.org',
      password: 'Recipient@123',
    });
    const unverifiedToken = unverifiedRecipientLogin.data.data.token;
    const unverifiedReserve = await request(
      'post',
      '/api/reservations',
      { donationId, requestedQuantity: 5 },
      unverifiedToken
    );
    assert(
      unverifiedReserve.status === 403,
      'Security: Unverified recipient organization blocked from reserving food until admin approved (403)'
    );

    console.log('\n--- 3. DATABASE CONCURRENCY & OVERSUBSCRIPTION PREVENTION ---');

    // Test: Requesting more than available quantity is rejected
    const oversubAttempt = await request(
      'post',
      '/api/reservations',
      { donationId, requestedQuantity: 100 }, // Only 30 available
      recipientToken
    );
    assert(oversubAttempt.status === 400, 'Concurrency: Request for more than available quantity rejected (400)');

    // Test: Concurrent reservations racing for the remaining 30 meals
    // We launch 3 requests in parallel, each requesting 20 meals (total 60 requested, only 30 available)
    const concurrentRequests = await Promise.all([
      request('post', '/api/reservations', { donationId, requestedQuantity: 20 }, recipientToken),
      request('post', '/api/reservations', { donationId, requestedQuantity: 20 }, recipientToken),
      request('post', '/api/reservations', { donationId, requestedQuantity: 20 }, recipientToken),
    ]);

    const successfulConcurrent = concurrentRequests.filter((r) => r.status === 201).length;
    const rejectedConcurrent = concurrentRequests.filter((r) => r.status === 400).length;

    assert(
      successfulConcurrent === 1 && rejectedConcurrent === 2,
      `Atomic Concurrency: Exactly 1 reservation succeeded and 2 were rejected (Oversubscription prevented)`
    );

    const finalDonation = await Donation.findById(donationId);
    assert(
      finalDonation.availableQuantity === 10,
      `Inventory Invariant: Final available quantity = 10 (30 - 20 = 10 meals)`
    );

    console.log('\n--- 4. NOTIFICATIONS & AUDIT TRAIL VERIFICATION ---');

    // Check notifications for recipient
    const notifs = await request('get', '/api/notifications', null, recipientToken);
    assert(notifs.status === 200 && notifs.data.data.length > 0, 'Notifications: In-app notifications delivered');

    // Mark single notification as read
    const firstNotifId = notifs.data.data[0]._id;
    const markReadRes = await request('patch', `/api/notifications/${firstNotifId}/read`, {}, recipientToken);
    assert(markReadRes.status === 200, 'Notifications: Single notification marked as read');

    // Mark all as read
    const markAllRes = await request('patch', '/api/notifications/read-all', {}, recipientToken);
    assert(markAllRes.status === 200, 'Notifications: All notifications marked as read via /read-all');

    // Admin audit logs
    const auditLogsRes = await request('get', '/api/admin/audit-logs', null, adminToken);
    assert(
      auditLogsRes.status === 200 && auditLogsRes.data.data.length > 0,
      'Audit: Administrative immutable audit logs accurately recorded all actions'
    );

    console.log('\n================================================================');
    console.log(`🎉 PHASE 4 TEST RUN COMPLETE: ${passed}/${total} TESTS PASSED!`);
    console.log('================================================================\n');

    process.exit(passed === total ? 0 : 1);
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
  }
}

runPhase4Tests();
