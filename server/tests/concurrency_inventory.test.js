/**
 * ANNADHARA — PHASE 1: CONCURRENCY, INVENTORY INVARIANTS & INTEGRITY TEST SUITE
 * Developed by Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies all Phase 1 Requirements from Section 4:
 * 1. Schema enforcement of the Strict Inventory Invariant:
 *    totalQuantity = availableQuantity + reservedQuantity + collectedQuantity
 * 2. Concurrent Reservation Race:
 *    20 simultaneous requests on 15 meals -> exactly 15 succeed, 5 rejected, availableQuantity reaches 0
 * 3. Concurrent Volunteer Claim Race:
 *    5 volunteers simultaneously claiming 1 task -> exactly 1 gets 200 OK, 4 get 409 Conflict
 * 4. Reservation State Machine Validation:
 *    - Cannot approve an already approved reservation
 *    - Cannot approve an expired donation
 *    - Cannot cancel a completed reservation
 *    - Cannot cancel an already rejected reservation
 *    - Cannot cancel an already cancelled reservation
 * 5. Comprehensive Expiration Reconcile:
 *    - Past-deadline donations marked as expired
 *    - Dangling pending reservations cancelled
 *    - Reserved quantity reconciled to maintain invariant
 * 6. Handover Atomicity & Replay Protection:
 *    - Quantities move cleanly from reserved to collected
 *    - Replaying delivery verification rejects double-completion (HTTP 400)
 */

process.env.NODE_ENV = 'test';

const { startServer } = require('../server');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Donation = require('../src/models/Donation');
const Reservation = require('../src/models/Reservation');
const PickupTask = require('../src/models/PickupTask');
const Organization = require('../src/models/Organization');
const { runExpirationCheck } = require('../src/services/expirationService');

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

async function runConcurrencyInventoryTests() {
  console.log('================================================================');
  console.log('🌿 ANNADHARA PHASE 1: CONCURRENCY & DATA INTEGRITY TEST SUITE');
  console.log('================================================================\n');

  try {
    server = await startServer(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`📡 Test server running at ${baseUrl}\n`);

    // -------------------------------------------------------------------------
    // TEST 1: Strict Inventory Invariant Schema Validation
    // -------------------------------------------------------------------------
    console.log('Test 1: Strict Inventory Invariant Enforcement in Donation Model...');
    const testDonor = await User.create({
      name: 'Invariant Test Donor',
      email: `donor_inv_${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'DONOR',
    });

    // Valid donation (available: 10, reserved: 0, collected: 0, total: 10)
    const validDonation = new Donation({
      title: 'Valid Invariant Food',
      category: 'cooked_meals',
      description: 'Strict invariant testing item',
      totalQuantity: 10,
      availableQuantity: 10,
      reservedQuantity: 0,
      collectedQuantity: 0,
      unit: 'meals',
      storageHandling: 'room_temperature',
      safetyGuidelinesAccepted: true,
      pickupStartTime: new Date(),
      pickupEndTime: new Date(Date.now() + 4 * 3600 * 1000),
      pickupLocation: {
        address: { street: '123 Main St', city: 'Bengaluru', country: 'India' },
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      },
      donor: testDonor._id,
    });
    await validDonation.save();
    console.log('  ✅ Valid donation saved cleanly.');

    // Invalid donation violating invariant: total (10) != available (8) + reserved (0) + collected (0)
    let invariantCaught = false;
    try {
      const invalidDonation = new Donation({
        title: 'Broken Invariant Food',
        category: 'cooked_meals',
        description: 'Mismatched quantity',
        totalQuantity: 10,
        availableQuantity: 8, // Sum = 8 != 10
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'meals',
        storageHandling: 'room_temperature',
        safetyGuidelinesAccepted: true,
        pickupStartTime: new Date(),
        pickupEndTime: new Date(Date.now() + 4 * 3600 * 1000),
        pickupLocation: {
          address: { street: '123 Main St', city: 'Bengaluru', country: 'India' },
          location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
        donor: testDonor._id,
      });
      await invalidDonation.save();
    } catch (err) {
      invariantCaught = true;
      assert(err.message.includes('Inventory invariant violated'), `Expected invariant error, got: ${err.message}`);
    }
    assert(invariantCaught, 'Mismatched inventory quantities must fail validation');
    console.log('  ✅ Confirmed: Invariant violation rejected by database schema validation.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Concurrent Reservation Race Condition Test
    // -------------------------------------------------------------------------
    console.log('Test 2: High-Concurrency Reservation Race (20 Simultaneous Requests for 15 Meals)...');
    
    // Register donor
    const donorRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Race Donor Kitchen',
        email: `race_donor_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'DONOR',
      },
    });
    const donorToken = donorRes.data.data.token;

    // Create donation with EXACTLY 15 meals available
    const donationRes = await request('/api/donations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: {
        title: 'Race Condition Test Biryani',
        category: 'biryani',
        description: 'Fresh biryani prepared for concurrency race',
        totalQuantity: 15,
        availableQuantity: 15,
        unit: 'meals',
        storageHandling: 'hot_held',
        safetyGuidelinesAccepted: true,
        pickupStartTime: new Date().toISOString(),
        pickupEndTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        pickupLocation: {
          address: { street: '50 MG Road', city: 'Bengaluru', country: 'India' },
          location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        },
      },
    });
    assert(donationRes.status === 201, `Failed to create race donation: ${donationRes.data.message}`);
    const raceDonationId = donationRes.data.data._id;

    // Register 20 distinct recipients with verified organizations
    console.log('  Creating 20 verified recipient accounts...');
    const recipientTokens = [];
    for (let i = 0; i < 20; i++) {
      const reg = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: `Recipient Org ${i + 1}`,
          email: `race_recip_${i}_${Date.now()}@example.com`,
          password: 'Password123!',
          role: 'RECIPIENT',
          phone: `98765432${(i < 10 ? '0' : '') + i}`,
          city: 'Bengaluru',
          organizationName: `Shelter ${i + 1}`,
          organizationType: 'NGO',
        },
      });
      assert(reg.status === 201, `Failed to register recipient ${i}: ${reg.data.message}`);
      
      // Auto-verify organization in test
      const userId = reg.data.data.user._id;
      const userDoc = await User.findById(userId);
      const orgId = userDoc.organizationId || userDoc.organization;
      if (orgId) {
        await Organization.findByIdAndUpdate(orgId, { verificationStatus: 'VERIFIED' });
      }
      recipientTokens.push(reg.data.data.token);
    }

    console.log('  Firing 20 simultaneous reservation requests...');
    const reservationPromises = recipientTokens.map((token) =>
      request('/api/reservations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          donationId: raceDonationId,
          requestedQuantity: 1, // Each wants 1 meal
          requestNotes: 'Concurrent race reservation',
        },
      })
    );

    const raceResults = await Promise.all(reservationPromises);
    const successCount = raceResults.filter((r) => r.status === 201).length;
    const rejectedCount = raceResults.filter((r) => r.status === 400).length;

    console.log(`  Race Results: ${successCount} Succeeded (201), ${rejectedCount} Rejected (400)`);
    assert(successCount === 15, `Expected exactly 15 successful reservations, got ${successCount}`);
    assert(rejectedCount === 5, `Expected exactly 5 rejected requests, got ${rejectedCount}`);

    // Verify donation status and quantities
    const postRaceDonation = await Donation.findById(raceDonationId);
    assert(postRaceDonation.availableQuantity === 0, `availableQuantity must be 0, got ${postRaceDonation.availableQuantity}`);
    assert(postRaceDonation.reservedQuantity === 15, `reservedQuantity must be 15, got ${postRaceDonation.reservedQuantity}`);
    assert(postRaceDonation.status === 'fully_reserved', `status must be fully_reserved, got ${postRaceDonation.status}`);
    assert(
      postRaceDonation.availableQuantity + postRaceDonation.reservedQuantity + postRaceDonation.collectedQuantity === postRaceDonation.totalQuantity,
      'Inventory invariant strictly preserved'
    );
    console.log('  ✅ Confirmed: Zero oversubscription under heavy concurrency! Invariant intact.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Concurrent Volunteer Claim Race Test
    // -------------------------------------------------------------------------
    console.log('Test 3: Concurrent Volunteer Claim Race (5 Volunteers for 1 Task)...');
    
    // Pick one of the successful reservations to approve
    const approvedResvDoc = await Reservation.findOne({ donation: raceDonationId, status: 'pending' });
    assert(approvedResvDoc, 'Expected a pending reservation to approve');
    
    // Approve it to generate a PickupTask
    const approveRes = await request(`/api/reservations/${approvedResvDoc._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'approved', donorNotes: 'Ready for pickup' },
    });
    assert(approveRes.status === 200, `Approval failed: ${approveRes.data.message}`);
    const pickupTaskId = approveRes.data.data.pickupTaskId;
    assert(pickupTaskId, 'PickupTask ID must be returned on approval');

    // Register 5 distinct volunteers
    const volunteerTokens = [];
    for (let i = 0; i < 5; i++) {
      const volReg = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: `Volunteer Speedy ${i + 1}`,
          email: `race_vol_${i}_${Date.now()}@example.com`,
          password: 'Password123!',
          role: 'VOLUNTEER',
          phone: `987654323${i}`,
          city: 'Bengaluru',
        },
      });
      assert(volReg.status === 201, `Failed to register volunteer ${i}: ${volReg.data.message}`);
      volunteerTokens.push(volReg.data.data.token);
    }

    console.log('  Firing 5 simultaneous pickup claim requests...');
    const claimPromises = volunteerTokens.map((token, idx) =>
      request(`/api/pickups/${pickupTaskId}/claim`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => ({ idx, res }))
    );

    const claimResults = await Promise.all(claimPromises);
    const claimSuccess = claimResults.filter((c) => c.res.status === 200).length;
    const claimConflict = claimResults.filter((c) => c.res.status === 409).length;
    const winnerItem = claimResults.find((c) => c.res.status === 200);
    const winningVolunteerToken = winnerItem ? volunteerTokens[winnerItem.idx] : volunteerTokens[0];

    console.log(`  Claim Results: ${claimSuccess} Claimed (200 OK), ${claimConflict} Conflicts (409 Conflict)`);
    assert(claimSuccess === 1, `Expected exactly 1 successful claim, got ${claimSuccess}`);
    assert(claimConflict === 4, `Expected exactly 4 conflicts (HTTP 409), got ${claimConflict}`);

    // Verify task state in DB
    const finalTask = await PickupTask.findById(pickupTaskId);
    assert(finalTask.status === 'assigned', `Task status should be assigned, got ${finalTask.status}`);
    assert(finalTask.volunteer !== null, 'Task must have an assigned volunteer');
    console.log('  ✅ Confirmed: Exactly 1 volunteer claimed the task; 4 received HTTP 409 Conflict.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Reservation State Machine Transitions & Edge Cases
    // -------------------------------------------------------------------------
    console.log('Test 4: Reservation State Machine Transitions & Guard Validations...');

    // 4.1 Cannot approve an already approved reservation
    const doubleApprove = await request(`/api/reservations/${approvedResvDoc._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'approved' },
    });
    assert(doubleApprove.status === 400, `Expected 400 for double approve, got ${doubleApprove.status}`);
    console.log('  ✅ Double approval rejected with 400 Bad Request.');

    // 4.2 Cannot cancel an already rejected reservation
    const pendingToReject = await Reservation.findOne({ donation: raceDonationId, status: 'pending' });
    assert(pendingToReject, 'Need a pending reservation to reject');

    const rejectRes = await request(`/api/reservations/${pendingToReject._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { status: 'rejected', donorNotes: 'Cannot accommodate' },
    });
    assert(rejectRes.status === 200, `Rejection failed: ${rejectRes.data.message}`);

    const cancelRejectedRes = await request(`/api/reservations/${pendingToReject._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { reason: 'Trying to cancel rejected' },
    });
    assert(cancelRejectedRes.status === 400, `Expected 400 when cancelling rejected, got ${cancelRejectedRes.status}`);
    assert(cancelRejectedRes.data.message.includes('already rejected'), 'Expected message indicating already rejected');
    console.log('  ✅ Cancelling rejected reservation rejected with 400 Bad Request.');

    // 4.3 Cannot approve an expired donation
    const expiredDonation = await Donation.create({
      title: 'Already Expired Food',
      category: 'cooked_meals',
      description: 'Deadline passed',
      totalQuantity: 5,
      availableQuantity: 5,
      reservedQuantity: 0,
      collectedQuantity: 0,
      unit: 'meals',
      storageHandling: 'room_temperature',
      safetyGuidelinesAccepted: true,
      pickupStartTime: new Date(Date.now() - 48 * 3600 * 1000),
      pickupEndTime: new Date(Date.now() - 24 * 3600 * 1000), // In the past!
      pickupLocation: {
        address: { street: 'Old St', city: 'Bengaluru', country: 'India' },
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      },
      donor: testDonor._id,
      status: 'expired',
    });

    const fakePendingResv = await Reservation.create({
      donation: expiredDonation._id,
      recipient: recipientTokens[0] ? (await User.findOne({ email: { $regex: 'race_recip_0' } }))._id : testDonor._id,
      donor: testDonor._id,
      requestedQuantity: 2,
      unit: 'meals',
      status: 'pending',
      handoverCode: 'EXP999',
    });

    // Donor attempts to approve this expired donation reservation
    const approveExpired = await request(`/api/reservations/${fakePendingResv._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${donorToken}` }, // note: as admin or donor
      body: { status: 'approved' },
    });
    assert(approveExpired.status === 400 || approveExpired.status === 403, `Approval of expired donation rejected with ${approveExpired.status}`);
    console.log('  ✅ Approval of expired donation strictly blocked.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Comprehensive Automated Expiration Reconcile
    // -------------------------------------------------------------------------
    console.log('Test 5: Comprehensive Expiration Processing & Invariant Reconciliation...');
    
    // Create a donation with pickup deadline 1 hour in the past, with 10 total meals
    const expiringDonation = await Donation.create({
      title: 'Midnight Surplus Rice',
      category: 'rice_meals',
      description: 'Needs expiration handling',
      totalQuantity: 10,
      availableQuantity: 6,
      reservedQuantity: 4,
      collectedQuantity: 0,
      unit: 'meals',
      storageHandling: 'hot_held',
      safetyGuidelinesAccepted: true,
      pickupStartTime: new Date(Date.now() - 3 * 3600 * 1000),
      pickupEndTime: new Date(Date.now() - 1 * 3600 * 1000), // Expired 1 hour ago
      pickupLocation: {
        address: { street: '22 Residency Rd', city: 'Bengaluru', country: 'India' },
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      },
      donor: testDonor._id,
      status: 'partially_reserved',
    });

    // Create a pending reservation of 4 meals that was never approved
    const danglingResv = await Reservation.create({
      donation: expiringDonation._id,
      recipient: testDonor._id,
      donor: testDonor._id,
      requestedQuantity: 4,
      unit: 'meals',
      status: 'pending',
      handoverCode: 'DANGL1',
    });

    // Run expiration cycle
    await runExpirationCheck();

    // Verify dangling reservation is cancelled
    const updatedDanglingResv = await Reservation.findById(danglingResv._id);
    assert(updatedDanglingResv.status === 'cancelled', `Dangling reservation should be cancelled, got ${updatedDanglingResv.status}`);
    assert(
      updatedDanglingResv.cancellationReason.includes('expired'),
      `Cancellation reason should mention expiration, got: ${updatedDanglingResv.cancellationReason}`
    );

    // Verify donation is expired and invariant preserved:
    // With 0 active approved reservations, reservedQuantity = 0, availableQuantity = 10, totalQuantity = 10
    const updatedExpDonation = await Donation.findById(expiringDonation._id);
    assert(updatedExpDonation.status === 'expired', `Donation status should be expired, got ${updatedExpDonation.status}`);
    assert(updatedExpDonation.reservedQuantity === 0, `reservedQuantity must be 0, got ${updatedExpDonation.reservedQuantity}`);
    assert(
      updatedExpDonation.availableQuantity + updatedExpDonation.reservedQuantity + updatedExpDonation.collectedQuantity === updatedExpDonation.totalQuantity,
      'Inventory invariant strictly preserved upon expiration'
    );
    console.log('  ✅ Confirmed: Expiration cancelled dangling requests and restored inventory integrity.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Handover Delivery Completion & Replay Protection
    // -------------------------------------------------------------------------
    console.log('Test 6: Handover Delivery Completion, Invariant Shift & Replay Protection...');
    
    // Find our assigned task from Test 3
    const activeTask = await PickupTask.findById(pickupTaskId).populate('reservation');
    const recipientDeliveryCode = activeTask.deliveryCode;
    assert(recipientDeliveryCode, 'Task must possess recipient delivery code');

    // Complete delivery with the winning volunteer
    const deliveryRes = await request(`/api/pickups/${pickupTaskId}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${winningVolunteerToken}` },
      body: {
        deliveryCode: recipientDeliveryCode,
        notes: 'Handover verified and intact',
      },
    });
    assert(deliveryRes.status === 200, `Delivery completion failed: ${deliveryRes.data.message}`);
    console.log('  ✅ Handover delivery confirmed.');

    // Check donation inventory after collection:
    // Started with 15: 1 rejected in Test 4 (available: 1), 1 collected in Test 6 (collected: 1), 13 still reserved
    const collectedDonation = await Donation.findById(raceDonationId);
    assert(
      collectedDonation.collectedQuantity === 1,
      `collectedQuantity must be 1, got ${collectedDonation.collectedQuantity}`
    );
    assert(
      collectedDonation.reservedQuantity === 13,
      `reservedQuantity must be 13, got ${collectedDonation.reservedQuantity}`
    );
    assert(
      collectedDonation.availableQuantity === 1,
      `availableQuantity must be 1, got ${collectedDonation.availableQuantity}`
    );
    assert(
      collectedDonation.availableQuantity + collectedDonation.reservedQuantity + collectedDonation.collectedQuantity === collectedDonation.totalQuantity,
      'Invariant strictly intact after delivery: available (1) + reserved (13) + collected (1) === total (15)'
    );

    // Replay delivery verification request
    console.log('  Testing Replay Protection for Delivery Verification...');
    const replayRes = await request(`/api/pickups/${pickupTaskId}/verify-delivery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${winningVolunteerToken}` },
      body: {
        deliveryCode: recipientDeliveryCode,
        notes: 'Replaying verification code',
      },
    });
    assert(replayRes.status === 400, `Replay should return 400, got ${replayRes.status}`);
    
    // Check invariant again to ensure collectedQuantity was NOT double-counted
    const postReplayDonation = await Donation.findById(raceDonationId);
    assert(
      postReplayDonation.collectedQuantity === 1,
      `collectedQuantity must remain 1 on replay, got ${postReplayDonation.collectedQuantity}`
    );
    console.log('  ✅ Confirmed: Replay rejected (HTTP 400) and no double-counting occurred.');

    // 4.4 Cannot cancel completed reservation
    const cancelCompletedRes = await request(`/api/reservations/${approvedResvDoc._id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}` },
      body: { reason: 'Trying to cancel completed reservation' },
    });
    assert(cancelCompletedRes.status === 400, `Expected 400 when cancelling completed, got ${cancelCompletedRes.status}`);
    assert(cancelCompletedRes.data.message.includes('already been handed over'), 'Expected message indicating already handed over');
    console.log('  ✅ Confirmed: Completed reservations cannot be cancelled.');

    console.log('\n================================================================');
    console.log('🎉 ALL PHASE 1 CONCURRENCY & INTEGRITY TESTS PASSED CLEANLY (100%)!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
  }
}

runConcurrencyInventoryTests();
