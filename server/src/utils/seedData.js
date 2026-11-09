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
    await connectDB();
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
    const admin = await User.create({
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@foodbridge.org',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 (555) 019-2834',
      isVerified: true,
      address: { street: '100 Metro Tower, Suite 400', city: 'Metropolis', state: 'NY', postalCode: '10001' },
      location: { type: 'Point', coordinates: [-73.9851, 40.7488] },
    });

    // 2. Donors
    const donor1 = await User.create({
      name: 'Chef Marco Rossi',
      email: 'donor@greengarden.com',
      password: 'Donor@123',
      role: 'donor',
      phone: '+1 (555) 349-8120',
      isVerified: true,
      address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
      location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
    });

    const orgDonor1 = await Organization.create({
      name: 'Green Garden Bistro',
      type: 'restaurant',
      registrationNumber: 'REST-NY-84920',
      contactEmail: 'contact@greengarden.com',
      contactPhone: '+1 (555) 349-8120',
      address: { street: '425 Garden Way', city: 'Metropolis', state: 'NY', postalCode: '10012' },
      location: { type: 'Point', coordinates: [-73.9912, 40.7258] },
      verificationStatus: 'verified',
      createdBy: donor1._id,
    });
    donor1.organization = orgDonor1._id;
    await donor1.save();

    const donor2 = await User.create({
      name: 'Elena Rostova',
      email: 'sunrise@bakery.com',
      password: 'Donor@123',
      role: 'donor',
      phone: '+1 (555) 882-9341',
      isVerified: true,
      address: { street: '78 Bakery Square', city: 'Metropolis', state: 'NY', postalCode: '10014' },
      location: { type: 'Point', coordinates: [-74.0048, 40.7335] },
    });

    const orgDonor2 = await Organization.create({
      name: 'Sunrise Artisanal Bakery',
      type: 'bakery',
      registrationNumber: 'BAKE-NY-19342',
      contactEmail: 'orders@sunrisebakery.com',
      contactPhone: '+1 (555) 882-9341',
      address: { street: '78 Bakery Square', city: 'Metropolis', state: 'NY', postalCode: '10014' },
      location: { type: 'Point', coordinates: [-74.0048, 40.7335] },
      verificationStatus: 'verified',
      createdBy: donor2._id,
    });
    donor2.organization = orgDonor2._id;
    await donor2.save();

    // 3. Recipients (NGOs)
    const recipient1 = await User.create({
      name: 'David Miller',
      email: 'ngo@hopeharvest.org',
      password: 'Recipient@123',
      role: 'recipient',
      phone: '+1 (555) 431-7729',
      isVerified: true,
      address: { street: '12 Community Ave', city: 'Metropolis', state: 'NY', postalCode: '10009' },
      location: { type: 'Point', coordinates: [-73.9805, 40.7262] },
    });

    const orgRecipient1 = await Organization.create({
      name: 'Hope Harvest Food Rescue',
      type: 'ngo',
      registrationNumber: '501C3-89472',
      contactEmail: 'info@hopeharvest.org',
      contactPhone: '+1 (555) 431-7729',
      address: { street: '12 Community Ave', city: 'Metropolis', state: 'NY', postalCode: '10009' },
      location: { type: 'Point', coordinates: [-73.9805, 40.7262] },
      verificationStatus: 'verified',
      verifiedBy: admin._id,
      verifiedAt: new Date(),
      createdBy: recipient1._id,
    });
    recipient1.organization = orgRecipient1._id;
    await recipient1.save();

    // Recipient 2 (Pending verification for admin module demo)
    const recipient2 = await User.create({
      name: 'Maria Santos',
      email: 'care@communityfood.org',
      password: 'Recipient@123',
      role: 'recipient',
      phone: '+1 (555) 672-1194',
      isVerified: false,
      address: { street: '89 Haven Shelter Way', city: 'Metropolis', state: 'NY', postalCode: '10002' },
      location: { type: 'Point', coordinates: [-73.992, 40.715] },
    });

    const orgRecipient2 = await Organization.create({
      name: 'Community Care Shelter',
      type: 'shelter',
      registrationNumber: 'PENDING-REG-2026',
      contactEmail: 'contact@communitycare.org',
      contactPhone: '+1 (555) 672-1194',
      address: { street: '89 Haven Shelter Way', city: 'Metropolis', state: 'NY', postalCode: '10002' },
      location: { type: 'Point', coordinates: [-73.992, 40.715] },
      verificationStatus: 'pending',
      verificationNotes: 'Submitted tax exempt proof. Awaiting certificate verification.',
      createdBy: recipient2._id,
    });
    recipient2.organization = orgRecipient2._id;
    await recipient2.save();

    // 4. Volunteers
    const volunteer1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@volunteer.org',
      password: 'Volunteer@123',
      role: 'volunteer',
      phone: '+1 (555) 728-4491',
      isVerified: true,
      address: { street: '310 Hudson St', city: 'Metropolis', state: 'NY', postalCode: '10013' },
      location: { type: 'Point', coordinates: [-74.006, 40.728] },
    });

    const volunteer2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@volunteer.org',
      password: 'Volunteer@123',
      role: 'volunteer',
      phone: '+1 (555) 914-3829',
      isVerified: true,
      address: { street: '55 5th Ave', city: 'Metropolis', state: 'NY', postalCode: '10003' },
      location: { type: 'Point', coordinates: [-73.994, 40.735] },
    });

    console.log('[Seed] Creating Donations...');

    const now = new Date();
    const in3Hours = new Date(now.getTime() + 3 * 3600 * 1000);
    const in6Hours = new Date(now.getTime() + 6 * 3600 * 1000);
    const in12Hours = new Date(now.getTime() + 12 * 3600 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 3600 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 3600 * 1000);

    // Donation 1: Fresh Cooked Trays from Bistro
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

    // Donation 2: Artisan Breads from Bakery
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

    // Donation 3: Fresh Produce Crates
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

    // Donation 4: Completed Historical Donation
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

    // Reservation 1: Approved reservation on Donation 1
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

    // Pickup Task for Reservation 1 assigned to volunteer Alex
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

    // Historical Reservation & Handover for Donation 4
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

