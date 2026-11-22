/**
 * ANNADHARA: CLOSED-LOOP DELIVERY VERIFICATION & SECURITY REGRESSION TEST
 * Tests:
 * 1. Dual-Code Handover (Pickup Code + Recipient Delivery Verification Code)
 * 2. Volunteer delivery confirmation via POST /api/pickups/:id/verify-delivery
 * 3. Handover delivery confirmation via POST /api/handover/confirm-delivery
 * 4. Role normalization and data isolation across recipients, donors, and volunteers
 * 5. Admin account status deactivation toggle
 */

const { startServer } = require('../server');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Donation = require('../src/models/Donation');
const Reservation = require('../src/models/Reservation');
const PickupTask = require('../src/models/PickupTask');
const HandoverRecord = require('../src/models/HandoverRecord');

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

async function runTests() {
  console.log('🚀 Starting Delivery Handover Verification Test Suite...\n');

  try {
    process.env.NODE_ENV = 'test';
    server = await startServer(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;

    // Clean test records
    await User.deleteMany({ email: { $regex: /@deliverytest\.org$/ } });
    await Donation.deleteMany({ title: { $regex: /Delivery Test/ } });

    // Step 1: Register Donor, Recipient, Volunteer, Admin
    console.log('1. Registering Users...');
    const donorRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Delivery Test Donor',
        email: 'donor@deliverytest.org',
        password: 'Password@123',
        role: 'DONOR',
        phone: '9876543201',
      },
    });
    assert(donorRes.status === 201, 'Donor registered');
    const donorToken = donorRes.data.data.token;
    const donorUser = donorRes.data.data.user;

    const recipientRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Delivery Test Recipient',
        email: 'recipient@deliverytest.org',
        password: 'Password@123',
        role: 'RECIPIENT',
        phone: '9876543202',
        organizationName: 'Delivery Hope Shelter',
        organizationType: 'Shelter',
      },
    });
    assert(recipientRes.status === 201, 'Recipient registered');
    const recipientToken = recipientRes.data.data.token;
    const recipientUser = recipientRes.data.data.user;

    const volunteerRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Delivery Test Volunteer',
        email: 'volunteer@deliverytest.org',
        password: 'Password@123',
        role: 'VOLUNTEER',
        phone: '9876543203',
      },
    });
    assert(volunteerRes.status === 201, 'Volunteer registered');
    const volunteerToken = volunteerRes.data.data.token;
    const volunteerUser = volunteerRes.data.data.user;

    // Login as Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@foodbridge.org',
        password: 'Admin@123',
      },
    });
    assert(adminLogin.status === 200, 'Admin login');
    const adminToken = adminLogin.data.data.token;

    // Verify Recipient Org so they can reserve food
    const orgId = typeof recipientUser.organizationId === 'object' && recipientUser.organizationId
      ? recipientUser.organizationId._id || recipientUser.organizationId.id
      : (typeof recipientUser.organization === 'object' && recipientUser.organization
          ? recipientUser.organization._id || recipientUser.organization.id
          : recipientUser.organizationId || recipientUser.organization);

    if (orgId) {
      await request(`/api/admin/organizations/${orgId}/verification`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { status: 'VERIFIED', notes: 'Verified for delivery testing' },
      });
    }

    console.log('  ✅ Users and organizations established.\n');

    // Step 2: Create Surplus Donation
    console.log('2. Publishing Food Donation...');
    const now = new Date();
    const donationRes = await request('/api/donations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        title: 'Delivery Test Rice & Curry',
        description: 'Freshly prepared nutritious rice and vegetable curry prepared today.',
        category: 'rice_meals',
        totalQuantity: 50,
        unit: 'meals',
        storageHandling: 'hot_held',
        pickupStartTime: new Date(now.getTime() - 10 * 60000).toISOString(),
        pickupEndTime: new Date(now.getTime() + 4 * 3600000).toISOString(),
        pickupLocation: {
          address: { street: '10, MG Road', city: 'Bengaluru', postalCode: '560001' },
          location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
        safetyGuidelinesAccepted: true,
      },
    });
    if (donationRes.status !== 201) {
      console.error('Donation create error:', donationRes.data);
    }
    assert(donationRes.status === 201, 'Donation created');
    const donationId = donationRes.data.data._id;
    console.log('  ✅ Food donation published with 50 meals.\n');

    // Step 3: Recipient Creates Reservation
    console.log('3. Requesting Reservation with Delivery Code Generation...');
    const reservationRes = await request('/api/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        donationId,
        requestedQuantity: 20,
        requestNotes: 'Need 20 meals for shelter residents.',
      },
    });
    assert(reservationRes.status === 201, 'Reservation requested');
    const resvData = reservationRes.data.data.reservation;
    assert(Boolean(resvData.handoverCode), 'handoverCode exists');
    assert(Boolean(resvData.deliveryCode), 'deliveryCode exists for recipient');
    console.log(`  ✅ Reservation created! Pickup Code: ${resvData.handoverCode} | Delivery Code: ${resvData.deliveryCode}\n`);

    // Step 4: Donor Approves Reservation
    console.log('4. Donor Approving Reservation...');
    const approveRes = await request(`/api/reservations/${resvData._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'approved', donorNotes: 'Ready at kitchen counter.' },
    });
    assert(approveRes.status === 200, 'Reservation approved');
    const pickupTaskId = approveRes.data.data.pickupTaskId;
    assert(Boolean(pickupTaskId), 'Coordinated PickupTask auto-created');
    console.log(`  ✅ Reservation approved. Pickup Task ID: ${pickupTaskId}\n`);

    // Step 5: Volunteer Claims Pickup Task & Collects Food
    console.log('5. Volunteer Claiming and Transporting Food...');
    const claimRes = await request(`/api/pickups/${pickupTaskId}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    assert(claimRes.status === 200, 'Volunteer claimed task');

    const progressRes = await request(`/api/pickups/${pickupTaskId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volunteerToken}` },
      body: { status: 'in_progress', note: 'En route to restaurant' },
    });
    assert(progressRes.status === 200, 'Pickup marked in_progress');

    const collectRes = await request(`/api/pickups/${pickupTaskId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volunteerToken}` },
      body: { status: 'collected', note: 'Food collected from donor kitchen' },
    });
    assert(collectRes.status === 200, 'Pickup marked collected');
    console.log('  ✅ Food collected from donor. Volunteer traveling to recipient shelter.\n');

    // Step 6: Verify Delivery Handover using Delivery Code
    console.log('6. Verifying Delivery Handover via Recipient Delivery Code...');

    // Test 6a: Reject with wrong code
    const invalidVerify = await request(`/api/pickups/${pickupTaskId}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${volunteerToken}` },
      body: { deliveryCode: 'DL-WRONG' },
    });
    assert(invalidVerify.status === 400, 'Invalid delivery code rejected with 400');
    console.log('  ✅ Invalid delivery code correctly rejected.');

    // Test 6b: Success with correct deliveryCode
    const validVerify = await request(`/api/pickups/${pickupTaskId}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${volunteerToken}` },
      body: {
        deliveryCode: resvData.deliveryCode,
        notes: 'Handed over 20 hot meals to shelter supervisor.',
      },
    });
    assert(validVerify.status === 200, 'Delivery verified successfully with 200');
    assert(validVerify.data.data.status === 'completed', 'Task marked completed');

    // Check reservation status
    const updatedResv = await Reservation.findById(resvData._id);
    assert(updatedResv.status === 'completed', 'Reservation marked completed');
    assert(updatedResv.deliveryCodeVerified === true, 'deliveryCodeVerified flag is true');

    // Check donation inventory invariant
    const updatedDonation = await Donation.findById(donationId);
    assert(updatedDonation.collectedQuantity === 20, '20 meals moved to collectedQuantity');
    assert(updatedDonation.availableQuantity === 30, '30 meals remaining available (50 - 20 = 30)');
    console.log('  ✅ Delivery successfully verified! Invariant preserved (collected=20, available=30).\n');

    // Step 7: Code-Free Donor Handover Verification (Donor never asked for code)
    console.log('7. Verifying Code-Free Donor Handover (Verification code strictly between volunteer and recipient)...');
    
    // Create second reservation on remaining 30 meals
    const resv2Res = await request('/api/reservations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: {
        donationId,
        requestedQuantity: 10,
        requestNotes: 'Need 10 meals for day shelter.',
      },
    });
    assert(resv2Res.status === 201, 'Second reservation created');
    const resv2 = resv2Res.data.data.reservation;

    // Donor approves second reservation
    await request(`/api/reservations/${resv2._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'approved' },
    });

    // 7a. Non-donor (recipient) tries to confirm handover without code -> MUST FAIL (400)
    const nonDonorFail = await request('/api/handover/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${recipientToken}` },
      body: { reservationId: resv2._id },
    });
    assert(nonDonorFail.status === 400, 'Non-donor without code rejected with 400');
    console.log('  ✅ Non-donor cannot confirm handover without code.');

    // 7b. Food Donor confirms handover WITHOUT ANY CODE -> MUST SUCCEED (200)
    const donorSuccess = await request('/api/handover/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        reservationId: resv2._id,
        notes: 'Handed over directly to volunteer runner at kitchen pickup bay',
      },
    });
    if (donorSuccess.status !== 200) {
      console.log('donorSuccess error response:', donorSuccess.status, donorSuccess.data);
    }
    assert(donorSuccess.status === 200, 'Donor handover confirmation succeeded without code');
    console.log('  ✅ Donor confirmed food handover with ZERO verification code required.');

    const resv2Updated = await Reservation.findById(resv2._id);
    assert(resv2Updated.status === 'completed', 'Reservation 2 completed');

    const handoverRecord2 = await HandoverRecord.findOne({ reservation: resv2._id });
    assert(Boolean(handoverRecord2), 'HandoverRecord 2 created');
    assert(handoverRecord2.confirmedByDonor === true, 'confirmedByDonor is true');
    assert(handoverRecord2.verificationMethod === 'donor_confirmation', 'verificationMethod is donor_confirmation');
    console.log('  ✅ Code-free donor handover verified and persisted.\n');

    // Step 8: Data Isolation & Role Normalization Check
    console.log('8. Verifying Role Normalization and Data Isolation...');
    const recipientResvs = await request('/api/reservations', {
      headers: { Authorization: `Bearer ${recipientToken}` },
    });
    assert(recipientResvs.status === 200, 'Get recipient reservations');
    assert(
      recipientResvs.data.data.every((r) => r.recipient?._id === recipientUser.id || r.recipient === recipientUser.id),
      'Recipient only sees their own reservations'
    );
    console.log('  ✅ Recipient data isolation confirmed (no cross-organization leaks).\n');

    // Step 9: Admin User Deactivation Toggle
    console.log('9. Verifying Admin User Deactivation...');
    const toggleRes = await request(`/api/admin/users/${donorUser.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(toggleRes.status === 200, 'Admin toggled status');
    assert(toggleRes.data.data.accountStatus === 'INACTIVE', 'Account status transitioned to INACTIVE');

    const verifyUser = await User.findById(donorUser.id);
    assert(verifyUser.accountStatus === 'INACTIVE', 'Database document persisted as INACTIVE');
    assert(verifyUser.isActive === false, 'isActive virtual returned false');
    console.log('  ✅ Admin account deactivation confirmed (accountStatus=INACTIVE).\n');

    console.log('================================================================');
    console.log('🎉 ALL DELIVERY VERIFICATION & UPGRADE TESTS PASSED CLEANLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runTests();
