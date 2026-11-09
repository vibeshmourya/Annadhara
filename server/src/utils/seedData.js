require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const Reservation = require('../models/Reservation');
const PickupTask = require('../models/PickupTask');
const HandoverRecord = require('../models/HandoverRecord');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seed = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('[Seed] Cleaning existing data...');

    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Donation.deleteMany({}),
      Reservation.deleteMany({}),
      PickupTask.deleteMany({}),
      HandoverRecord.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Creating Users & Organizations...');

    // 1. Admin
    const admin = new User({
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@foodbridge.org',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 019-2834',
      isVerified: true,
      address: { street: '100 Metro Tower, Suite 400', city: 'Metropolis', state: 'NY', postalCode: '10001' },
      location: { type: 'Point', coordinates: [-73.9851, 40.7488] },
    });
    admin.password = 'Admin@123';
    await admin.save();

    // 2. Donors
    const donor1 = new User({
      name: 'Chef Marco Rossi',
      email: 'donor@greengarden.com',
      role: 'DONOR',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 349-8120',
      isVerified: true,
      address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
      location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
    });
    donor1.password = 'Donor@123';
    await donor1.save();

    const orgDonor1 = await Organization.create({
      organizationName: 'Green Garden Bistro',
      organizationType: 'Restaurant',
      registrationNumber: 'REST-NY-84920',
      email: 'contact@greengarden.com',
      phone: '+1 (555) 349-8120',
      address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
      location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
      verificationStatus: 'VERIFIED',
      submittedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      reviewedAt: new Date(Date.now() - 29 * 24 * 3600 * 1000),
      reviewedBy: admin._id,
      createdBy: donor1._id,
    });
    donor1.organizationId = orgDonor1._id;
    await donor1.save();

    const donor2 = new User({
      name: 'Elena Rostova',
      email: 'sunrise@bakery.com',
      role: 'DONOR',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 882-9341',
      isVerified: true,
      address: { street: '78 Bakery Square', city: 'Metropolis', state: 'NY', postalCode: '10014' },
      location: { type: 'Point', coordinates: [-74.0048, 40.7335] },
    });
    donor2.password = 'Donor@123';
    await donor2.save();

    const orgDonor2 = await Organization.create({
      organizationName: 'Sunrise Artisanal Bakery',
      organizationType: 'Restaurant',
      registrationNumber: 'BAKE-NY-19342',
      email: 'orders@sunrisebakery.com',
      phone: '+1 (555) 882-9341',
      address: { street: '78 Bakery Square', city: 'Metropolis', state: 'NY', postalCode: '10014' },
      location: { type: 'Point', coordinates: [-74.0048, 40.7335] },
      verificationStatus: 'VERIFIED',
      submittedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000),
      reviewedAt: new Date(Date.now() - 19 * 24 * 3600 * 1000),
      reviewedBy: admin._id,
      createdBy: donor2._id,
    });
    donor2.organizationId = orgDonor2._id;
    await donor2.save();

    // 3. Recipients (NGOs)
    const recipient1 = new User({
      name: 'David Miller',
      email: 'ngo@hopeharvest.org',
      role: 'RECIPIENT',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 431-7729',
      isVerified: true,
      address: { street: '12 Community Ave', city: 'Metropolis', state: 'NY', postalCode: '10009' },
      location: { type: 'Point', coordinates: [-73.9805, 40.7262] },
    });
    recipient1.password = 'Recipient@123';
    await recipient1.save();

    const orgRecipient1 = await Organization.create({
      organizationName: 'Hope Harvest Food Rescue',
      organizationType: 'NGO',
      registrationNumber: '501C3-89472',
      email: 'info@hopeharvest.org',
      phone: '+1 (555) 431-7729',
      address: { street: '12 Community Ave', city: 'Metropolis', state: 'NY', postalCode: '10009' },
      location: { type: 'Point', coordinates: [-73.9805, 40.7262] },
      verificationStatus: 'VERIFIED',
      submittedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
      reviewedAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      reviewedBy: admin._id,
      createdBy: recipient1._id,
    });
    recipient1.organizationId = orgRecipient1._id;
    await recipient1.save();

    // Recipient 2 (Pending verification for admin module demonstration)
    const recipient2 = new User({
      name: 'Maria Santos',
      email: 'care@communityfood.org',
      role: 'RECIPIENT',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 672-1194',
      isVerified: false,
      address: { street: '89 Haven Shelter Way', city: 'Metropolis', state: 'NY', postalCode: '10002' },
      location: { type: 'Point', coordinates: [-73.992, 40.715] },
    });
    recipient2.password = 'Recipient@123';
    await recipient2.save();

    const orgRecipient2 = await Organization.create({
      organizationName: 'Community Care Shelter',
      organizationType: 'Food Distribution Organization',
      registrationNumber: 'PENDING-REG-2026',
      email: 'contact@communitycare.org',
      phone: '+1 (555) 672-1194',
      address: { street: '89 Haven Shelter Way', city: 'Metropolis', state: 'NY', postalCode: '10002' },
      location: { type: 'Point', coordinates: [-73.992, 40.715] },
      verificationStatus: 'PENDING',
      verificationNotes: 'Submitted tax exempt proof. Awaiting certificate verification.',
      submittedAt: new Date(),
      createdBy: recipient2._id,
    });
    recipient2.organizationId = orgRecipient2._id;
    await recipient2.save();

    // 4. Volunteers
    const volunteer1 = new User({
      name: 'Alex Rivera',
      email: 'alex@volunteer.org',
      role: 'VOLUNTEER',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 728-4491',
      isVerified: true,
      address: { street: '310 Hudson St', city: 'Metropolis', state: 'NY', postalCode: '10013' },
      location: { type: 'Point', coordinates: [-74.006, 40.728] },
    });
    volunteer1.password = 'Volunteer@123';
    await volunteer1.save();

    const volunteer2 = new User({
      name: 'Priya Sharma',
      email: 'priya@volunteer.org',
      role: 'VOLUNTEER',
      accountStatus: 'ACTIVE',
      phone: '+1 (555) 914-3829',
      isVerified: true,
      address: { street: '55 5th Ave', city: 'Metropolis', state: 'NY', postalCode: '10003' },
      location: { type: 'Point', coordinates: [-73.994, 40.735] },
    });
    volunteer2.password = 'Volunteer@123';
    await volunteer2.save();

    console.log('[Seed] Creating Donations...');

    const now = new Date();
    const in6Hours = new Date(now.getTime() + 6 * 3600 * 1000);
    const in12Hours = new Date(now.getTime() + 12 * 3600 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 3600 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 3600 * 1000);

    const donation1 = await Donation.create({
      title: 'Nutritious Vegetable & Lentil Curry with Rice',
      category: 'cooked_meals',
      description:
        'Prepared fresh today for an executive lunch event. Kept consistently at proper hot-holding temperature. Packaged in sanitized, heat-sealed aluminum catering containers.',
      totalQuantity: 40,
      availableQuantity: 30,
      reservedQuantity: 10,
      collectedQuantity: 0,
      unit: 'meals',
      prepDateTime: new Date(now.getTime() - 2 * 3600 * 1000),
      expiryDateTime: in6Hours,
      storageHandling: 'hot_held',
      allergens: ['None reported'],
      pickupLocation: {
        address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
        location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
      },
      pickupStartTime: now,
      pickupEndTime: in6Hours,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      status: 'partially_reserved',
      donor: donor1._id,
      organization: orgDonor1._id,
      safetyGuidelinesAccepted: true,
    });

    const donation2 = await Donation.create({
      title: 'Assorted Sourdough & Multigrain Artisan Breads',
      category: 'bakery_grains',
      description:
        'End-of-day surplus of daily baked sourdough loaves, baguettes, and multigrain batards. Baked this morning with organic flour.',
      totalQuantity: 25,
      availableQuantity: 25,
      reservedQuantity: 0,
      collectedQuantity: 0,
      unit: 'boxes',
      prepDateTime: new Date(now.getTime() - 8 * 3600 * 1000),
      expiryDateTime: in48Hours,
      storageHandling: 'room_temperature',
      allergens: ['Gluten', 'Wheat'],
      pickupLocation: {
        address: { street: '78 Bakery Square', city: 'Metropolis', state: 'NY', postalCode: '10014' },
        location: { type: 'Point', coordinates: [-74.0048, 40.7335] },
      },
      pickupStartTime: now,
      pickupEndTime: in12Hours,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      status: 'available',
      donor: donor2._id,
      organization: orgDonor2._id,
      safetyGuidelinesAccepted: true,
    });

    const donation3 = await Donation.create({
      title: 'Fresh Organic Apples, Bananas & Crisp Greens',
      category: 'produce_fresh',
      description:
        'Surplus fresh farm delivery from local co-op growers. Clean, wholesome, and ready for immediate consumption or salad distribution.',
      totalQuantity: 50,
      availableQuantity: 50,
      reservedQuantity: 0,
      collectedQuantity: 0,
      unit: 'kg',
      prepDateTime: new Date(now.getTime() - 4 * 3600 * 1000),
      expiryDateTime: in48Hours,
      storageHandling: 'refrigerated',
      allergens: ['None'],
      pickupLocation: {
        address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
        location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
      },
      pickupStartTime: now,
      pickupEndTime: in24Hours,
      imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop&q=80',
      status: 'available',
      donor: donor1._id,
      organization: orgDonor1._id,
      safetyGuidelinesAccepted: true,
    });

    const donation4 = await Donation.create({
      title: 'Roasted Herb Chicken & Steamed Quinoa Bowls',
      category: 'cooked_meals',
      description: 'Surplus buffet banquet dinners, fully packaged in eco-friendly meal cartons.',
      totalQuantity: 30,
      availableQuantity: 0,
      reservedQuantity: 0,
      collectedQuantity: 30,
      unit: 'meals',
      prepDateTime: new Date(now.getTime() - 26 * 3600 * 1000),
      expiryDateTime: new Date(now.getTime() - 12 * 3600 * 1000),
      storageHandling: 'refrigerated',
      allergens: ['None reported'],
      pickupLocation: {
        address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
        location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
      },
      pickupStartTime: new Date(now.getTime() - 20 * 3600 * 1000),
      pickupEndTime: new Date(now.getTime() - 14 * 3600 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
      status: 'completed',
      donor: donor1._id,
      organization: orgDonor1._id,
      safetyGuidelinesAccepted: true,
    });

    console.log('[Seed] Creating Reservations & Handover records...');

    const res1 = await Reservation.create({
      donation: donation1._id,
      recipient: recipient1._id,
      recipientOrg: orgRecipient1._id,
      donor: donor1._id,
      requestedQuantity: 10,
      unit: 'meals',
      status: 'approved',
      handoverCode: 'FB-7294',
      requestNotes: 'Can collect this evening for our evening family shelter feeding program.',
      donorNotes: 'Approved! Please pick up from side kitchen entrance.',
      approvedAt: new Date(now.getTime() - 30 * 60 * 1000),
    });

    const pickupTask1 = await PickupTask.create({
      reservation: res1._id,
      donation: donation1._id,
      donor: donor1._id,
      recipient: recipient1._id,
      volunteer: volunteer1._id,
      status: 'assigned',
      pickupAddress: donation1.pickupLocation.address,
      deliveryAddress: orgRecipient1.address,
      instructions: 'Pick up from Green Garden Bistro side kitchen door. Handle with thermal bag.',
      pickupWindowStart: donation1.pickupStartTime,
      pickupWindowEnd: donation1.pickupEndTime,
      assignedAt: new Date(now.getTime() - 20 * 60 * 1000),
      trackingNotes: [
        { status: 'assigned', note: 'Claimed by Alex Rivera', updatedBy: volunteer1._id },
      ],
    });

    const resHistorical = await Reservation.create({
      donation: donation4._id,
      recipient: recipient1._id,
      recipientOrg: orgRecipient1._id,
      donor: donor1._id,
      requestedQuantity: 30,
      unit: 'meals',
      status: 'completed',
      handoverCode: 'FB-3810',
      requestNotes: 'Shelter food service distribution',
      approvedAt: new Date(now.getTime() - 18 * 3600 * 1000),
      completedAt: new Date(now.getTime() - 15 * 3600 * 1000),
    });

    await HandoverRecord.create({
      reservation: resHistorical._id,
      donation: donation4._id,
      donor: donor1._id,
      recipient: recipient1._id,
      volunteer: volunteer1._id,
      quantityHandedOver: 30,
      unit: 'meals',
      handoverCode: 'FB-3810',
      verificationMethod: 'code',
      confirmedByDonor: true,
      confirmedByRecipient: true,
      donorConfirmedAt: new Date(now.getTime() - 15 * 3600 * 1000),
      recipientConfirmedAt: new Date(now.getTime() - 15 * 3600 * 1000),
      notes: 'Handover verified and completed successfully.',
    });

    console.log('[Seed] Creating Sample Notifications & Audit Logs...');

    await Notification.create([
      {
        recipient: recipient1._id,
        title: 'Reservation Approved!',
        message: 'Your reservation for 10 meals of "Nutritious Vegetable & Lentil Curry with Rice" was approved! Handover Code: FB-7294',
        type: 'reservation_approved',
        relatedId: res1._id,
        relatedModel: 'Reservation',
      },
      {
        recipient: donor1._id,
        title: 'Volunteer Assigned',
        message: 'Alex Rivera accepted the pickup task for your donation.',
        type: 'pickup_assigned',
        relatedId: pickupTask1._id,
        relatedModel: 'PickupTask',
      },
      {
        recipient: admin._id,
        title: 'New Organization Pending Review',
        message: 'Community Care Shelter registered and is awaiting admin verification.',
        type: 'org_verification',
        relatedId: orgRecipient2._id,
        relatedModel: 'Organization',
      },
    ]);

    await AuditLog.create([
      {
        action: 'SYSTEM_INITIALIZED',
        role: 'system',
        entityType: 'System',
        details: { message: 'FoodBridge database seeded with demo data' },
      },
    ]);

    console.log('-----------------------------------------------------------');
    console.log('✅ FoodBridge database successfully seeded!');
    console.log('-----------------------------------------------------------');
    console.log('Sample Accounts for Testing:');
    console.log('1. Admin:     admin@foodbridge.org        / Admin@123');
    console.log('2. Donor:     donor@greengarden.com       / Donor@123 (Green Garden Bistro)');
    console.log('3. Donor 2:   sunrise@bakery.com          / Donor@123 (Sunrise Bakery)');
    console.log('4. Recipient: ngo@hopeharvest.org         / Recipient@123 (Hope Harvest - Verified)');
    console.log('5. Recipient: care@communityfood.org      / Recipient@123 (Pending Verification)');
    console.log('6. Volunteer: alex@volunteer.org          / Volunteer@123 (Alex Rivera)');
    console.log('7. Volunteer: priya@volunteer.org         / Volunteer@123 (Priya Sharma)');
    console.log('-----------------------------------------------------------');

    return true;
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seedDatabase: seed };
