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

const seed = async ({ forceClean = false } = {}) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Only clean existing data if explicitly requested with forceClean
    if (forceClean) {
      console.log('[Seed] Clean flag enabled. Removing existing demo data...');
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
    }

    console.log('[Seed] Initializing / updating idempotent demo accounts and pan-Indian listings...');

    // Helper: upsert user idempotently
    const upsertUser = async (userDef) => {
      let user = await User.findOne({ email: userDef.email });
      if (!user) {
        user = new User({
          name: userDef.name,
          email: userDef.email,
          role: userDef.role,
          accountStatus: userDef.accountStatus || 'ACTIVE',
          phone: userDef.phone,
          isVerified: userDef.isVerified !== undefined ? userDef.isVerified : true,
          address: userDef.address,
          location: userDef.location,
        });
        user.password = userDef.plainPassword;
        await user.save();
        console.log(`[Seed] Created user: ${user.name} (${user.email})`);
      } else {
        user.name = userDef.name;
        user.role = userDef.role;
        user.phone = userDef.phone;
        user.isVerified = userDef.isVerified !== undefined ? userDef.isVerified : true;
        user.address = userDef.address;
        user.location = userDef.location;
        user.password = userDef.plainPassword; // refresh password
        await user.save();
      }
      return user;
    };

    // Helper: upsert organization idempotently
    const upsertOrg = async (orgDef, ownerUser) => {
      let org = await Organization.findOne({ email: orgDef.email });
      if (!org) {
        org = await Organization.create({
          ...orgDef,
          createdBy: ownerUser._id,
        });
        console.log(`[Seed] Created org: ${org.organizationName}`);
      } else {
        Object.assign(org, orgDef);
        org.createdBy = ownerUser._id;
        await org.save();
      }
      if (!ownerUser.organizationId || String(ownerUser.organizationId) !== String(org._id)) {
        ownerUser.organizationId = org._id;
        await ownerUser.save();
      }
      return org;
    };

    // 1. Primary Evaluation Demo Users (Exact specification)
    // Admin: Vibesh
    const adminVibesh = await upsertUser({
      name: 'Vibesh (Admin)',
      email: 'vibesh.admin@annadhara.in',
      plainPassword: 'Admin@123',
      role: 'ADMIN',
      phone: '+91 98765 01234',
      isVerified: true,
      address: {
        street: '104, Seva Bhavan, MG Road',
        areaLocality: 'Ashok Nagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });

    // Legacy Admin alias
    const adminLegacy = await upsertUser({
      name: 'Vibesh (Admin Platform)',
      email: 'admin@foodbridge.org',
      plainPassword: 'Admin@123',
      role: 'ADMIN',
      phone: '+91 98765 01234',
      isVerified: true,
      address: {
        street: '104, Seva Bhavan, MG Road',
        areaLocality: 'Ashok Nagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });

    // Donor: Tarun
    const donorTarun = await upsertUser({
      name: 'Tarun (Chef & Donor)',
      email: 'tarun.donor@annadhara.in',
      plainPassword: 'Donor@123',
      role: 'DONOR',
      phone: '+91 98765 34981',
      isVerified: true,
      address: {
        street: '42/1, 12th Main Road',
        areaLocality: 'HAL 2nd Stage, Indiranagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560038',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.6412, 12.9719] },
    });

    const orgDonorTarun = await upsertOrg(
      {
        organizationName: "Tarun's Rasoi & Tiffin Kitchen",
        organizationType: 'Restaurant',
        registrationNumber: 'FSSAI-11224189000124',
        fssaiNumber: '11224189000124',
        email: 'tarun.kitchen@annadhara.in',
        phone: '+91 98765 34981',
        address: donorTarun.address,
        location: donorTarun.location,
        verificationStatus: 'VERIFIED',
      },
      donorTarun
    );

    // Legacy Donor alias
    const donorLegacy = await upsertUser({
      name: 'Chef Vikram Mehta (Tarun Rasoi)',
      email: 'donor@greengarden.com',
      plainPassword: 'Donor@123',
      role: 'DONOR',
      phone: '+91 98765 34981',
      isVerified: true,
      address: donorTarun.address,
      location: donorTarun.location,
    });
    donorLegacy.organizationId = orgDonorTarun._id;
    await donorLegacy.save();

    // Additional Donor: Sunrise Bakery
    const donorSunrise = await upsertUser({
      name: 'Priya Kulkarni',
      email: 'sunrise@bakery.com',
      plainPassword: 'Donor@123',
      role: 'DONOR',
      phone: '+91 98765 88293',
      isVerified: true,
      address: {
        street: '78, Commercial Street',
        areaLocality: 'Tasker Town, Shivajinagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.6088, 12.9822] },
    });

    const orgSunrise = await upsertOrg(
      {
        organizationName: 'Sunrise Artisanal Bakery',
        organizationType: 'Bakery',
        registrationNumber: 'FSSAI-11223344556688',
        fssaiNumber: '11223344556688',
        email: 'orders@sunrisebakery.com',
        phone: '+91 98765 88293',
        address: donorSunrise.address,
        location: donorSunrise.location,
        verificationStatus: 'VERIFIED',
      },
      donorSunrise
    );

    // NGO / Recipient: Fathima
    const recipientFathima = await upsertUser({
      name: 'Fathima (NGO Director)',
      email: 'fathima.ngo@annadhara.in',
      plainPassword: 'Recipient@123',
      role: 'RECIPIENT',
      phone: '+91 98765 43177',
      isVerified: true,
      address: {
        street: '12, Ananda Nilaya, 5th Cross',
        areaLocality: 'Margosa Road, Malleshwaram',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560003',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.5713, 13.0031] },
    });

    const orgFathima = await upsertOrg(
      {
        organizationName: 'Karuna Aahar Relief Trust',
        organizationType: 'Registered NGO',
        registrationNumber: 'KA-BLR-TRUST-2019-482',
        email: 'karuna@aahar.org',
        phone: '+91 98765 43177',
        address: recipientFathima.address,
        location: recipientFathima.location,
        verificationStatus: 'VERIFIED',
      },
      recipientFathima
    );

    // Legacy Recipient alias
    const recipientLegacy = await upsertUser({
      name: 'Suresh Kumar (Karuna Trust)',
      email: 'ngo@hopeharvest.org',
      plainPassword: 'Recipient@123',
      role: 'RECIPIENT',
      phone: '+91 98765 43177',
      isVerified: true,
      address: recipientFathima.address,
      location: recipientFathima.location,
    });
    recipientLegacy.organizationId = orgFathima._id;
    await recipientLegacy.save();

    // Pending Verification Recipient for Admin Approval Testing
    const recipientPending = await upsertUser({
      name: 'Lakshmi Devi',
      email: 'care@communityfood.org',
      plainPassword: 'Recipient@123',
      role: 'RECIPIENT',
      phone: '+91 98765 67211',
      isVerified: false,
      address: {
        street: '89, Shanti Marg, 1st Block',
        areaLocality: 'Dr. Rajkumar Road, Rajajinagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560010',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.5539, 12.9915] },
    });

    await upsertOrg(
      {
        organizationName: 'Community Care Shelter',
        organizationType: 'Community Kitchen',
        registrationNumber: 'PENDING-REG-2026',
        email: 'contact@communitycare.org',
        phone: '+91 98765 67211',
        address: recipientPending.address,
        location: recipientPending.location,
        verificationStatus: 'PENDING',
        verificationNotes: 'Submitted Trust Deed and NGO Darpan verification proof. Awaiting admin review.',
      },
      recipientPending
    );

    // Volunteer: Swathi
    const volunteerSwathi = await upsertUser({
      name: 'Swathi (Volunteer)',
      email: 'swathi.volunteer@annadhara.in',
      plainPassword: 'Volunteer@123',
      role: 'VOLUNTEER',
      phone: '+91 98765 72844',
      isVerified: true,
      address: {
        street: '310, 80 Feet Road',
        areaLocality: '4th Block, Koramangala',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
      },
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
    });

    // Legacy Volunteer alias
    const volunteerLegacy = await upsertUser({
      name: 'Alex Rivera (Swathi Partner)',
      email: 'alex@volunteer.org',
      plainPassword: 'Volunteer@123',
      role: 'VOLUNTEER',
      phone: '+91 98765 72844',
      isVerified: true,
      address: volunteerSwathi.address,
      location: volunteerSwathi.location,
    });

    const now = new Date();
    const in12Hours = new Date(now.getTime() + 12 * 3600 * 1000);
    const in24Hours = new Date(now.getTime() + 24 * 3600 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 3600 * 1000);

    // 2. 10 Authentic Pan-Indian Food Donations with exact category & verified matching food images
    const sampleDonations = [
      {
        title: 'Hyderabadi Vegetable Dum Biryani & Mirchi Ka Salan',
        category: 'biryani',
        dietaryType: 'Vegetarian',
        description:
          'Fragrant basmati rice layered with fresh farm vegetables, saffron, mint and slow-cooked in traditional dum handi. Kept hot at 65°C in insulated food-grade containers.',
        totalQuantity: 45,
        availableQuantity: 45,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'meals',
        prepDateTime: new Date(now.getTime() - 2 * 3600 * 1000),
        expiryDateTime: in12Hours,
        storageHandling: 'hot_held',
        allergens: ['Dairy (Ghee)'],
        pickupLocation: {
          address: {
            street: '15/2, Banjara Hills Road No. 12',
            areaLocality: 'Banjara Hills',
            city: 'Hyderabad',
            district: 'Hyderabad',
            state: 'Telangana',
            postalCode: '500034',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [78.4482, 17.4156] },
        },
        pickupStartTime: now,
        pickupEndTime: in12Hours,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'South Indian Steamed Idli, Medu Vada & Sambar Meal Packs',
        category: 'idli_dosa',
        dietaryType: 'Vegetarian',
        description:
          'Soft steamed rice idlis with crispy medu vadas, piping hot drumstick sambar and fresh coconut chutney. Sealed in recyclable meal containers.',
        totalQuantity: 50,
        availableQuantity: 35,
        reservedQuantity: 15,
        collectedQuantity: 0,
        unit: 'meals',
        prepDateTime: new Date(now.getTime() - 1 * 3600 * 1000),
        expiryDateTime: in12Hours,
        storageHandling: 'hot_held',
        allergens: ['Mustard', 'Coconut'],
        pickupLocation: {
          address: {
            street: '42/1, 12th Main Road',
            areaLocality: 'HAL 2nd Stage, Indiranagar',
            city: 'Bengaluru',
            district: 'Bengaluru Urban',
            state: 'Karnataka',
            postalCode: '560038',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [77.6412, 12.9719] },
        },
        pickupStartTime: now,
        pickupEndTime: in12Hours,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
        status: 'partially_reserved',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Crispy Masala Dosa with Coconut & Tomato Chutneys',
        category: 'idli_dosa',
        dietaryType: 'Vegetarian',
        description:
          'Golden crispy dosas with spiced potato masala filling, accompanied by fresh coconut chutney and spicy tomato red chutney.',
        totalQuantity: 30,
        availableQuantity: 30,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'plates',
        prepDateTime: new Date(now.getTime() - 1 * 3600 * 1000),
        expiryDateTime: in12Hours,
        storageHandling: 'hot_held',
        allergens: ['Mustard', 'Coconut'],
        pickupLocation: {
          address: {
            street: '28, Sayyaji Rao Road',
            areaLocality: 'Devaraja Mohalla',
            city: 'Mysuru',
            district: 'Mysuru',
            state: 'Karnataka',
            postalCode: '570001',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [76.6552, 12.3118] },
        },
        pickupStartTime: now,
        pickupEndTime: in12Hours,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Fresh Tawa Roti & Whole Wheat Chapati Meal Packs',
        category: 'roti_chapati',
        dietaryType: 'Vegetarian',
        description:
          'Hot, soft whole-wheat phulkas and tawa rotis baked fresh from chakki atta, wrapped neatly in hygienic food-grade foil packs.',
        totalQuantity: 60,
        availableQuantity: 60,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'packs',
        prepDateTime: new Date(now.getTime() - 2 * 3600 * 1000),
        expiryDateTime: in24Hours,
        storageHandling: 'room_temperature',
        allergens: ['Wheat', 'Gluten'],
        pickupLocation: {
          address: {
            street: '14, Connaught Circus, Block B',
            areaLocality: 'Connaught Place',
            city: 'Delhi',
            district: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [77.2197, 28.6328] },
        },
        pickupStartTime: now,
        pickupEndTime: in24Hours,
        imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Traditional South Indian Sambar Rice & Curd Rice (Bisi Bele Bath)',
        category: 'rice_meals',
        dietaryType: 'Vegetarian',
        description:
          'Classic hot bisi bele bath packed with lentils, assorted vegetables and aromatic ghee tempering, served alongside soothing temple-style curd rice.',
        totalQuantity: 40,
        availableQuantity: 40,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'meals',
        prepDateTime: new Date(now.getTime() - 2 * 3600 * 1000),
        expiryDateTime: in12Hours,
        storageHandling: 'hot_held',
        allergens: ['Dairy', 'Mustard'],
        pickupLocation: {
          address: {
            street: '18, Anna Salai',
            areaLocality: 'Teynampet',
            city: 'Chennai',
            district: 'Chennai',
            state: 'Tamil Nadu',
            postalCode: '600018',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [80.2505, 13.0418] },
        },
        pickupStartTime: now,
        pickupEndTime: in12Hours,
        imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Shahi Paneer Makhani & Mixed Veg Dal Tadka with Jeera Rice',
        category: 'cooked_meals',
        dietaryType: 'Vegetarian',
        description:
          'Rich tomato cashew gravy with soft malai paneer cubes, yellow dal tadka with cumin ghee tempering, and fragrant steamed jeera rice.',
        totalQuantity: 35,
        availableQuantity: 35,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'meals',
        prepDateTime: new Date(now.getTime() - 3 * 3600 * 1000),
        expiryDateTime: in12Hours,
        storageHandling: 'hot_held',
        allergens: ['Dairy', 'Nuts (Cashews)'],
        pickupLocation: {
          address: {
            street: '52, Fergusson College Road',
            areaLocality: 'Shivajinagar',
            city: 'Pune',
            district: 'Pune',
            state: 'Maharashtra',
            postalCode: '411004',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [73.8415, 18.5284] },
        },
        pickupStartTime: now,
        pickupEndTime: in12Hours,
        imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Crispy Vegetable Samosa & Mint Coriander Chutney',
        category: 'snacks',
        dietaryType: 'Vegetarian',
        description:
          'Golden flaky samosas stuffed with spiced potatoes, green peas and ginger, accompanied by refreshing mint-coriander green chutney.',
        totalQuantity: 80,
        availableQuantity: 80,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'pieces',
        prepDateTime: new Date(now.getTime() - 2 * 3600 * 1000),
        expiryDateTime: in24Hours,
        storageHandling: 'room_temperature',
        allergens: ['Wheat', 'Gluten'],
        pickupLocation: {
          address: {
            street: '108, Linking Road',
            areaLocality: 'Bandra West',
            city: 'Mumbai',
            district: 'Mumbai Suburban',
            state: 'Maharashtra',
            postalCode: '400050',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [72.8347, 19.0596] },
        },
        pickupStartTime: now,
        pickupEndTime: in24Hours,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Fresh Farm Shimla Apples, Bananas & Seasonal Fruits',
        category: 'fruits',
        dietaryType: 'Vegetarian',
        description:
          'Crate of fresh ripe apples, Robusta bananas, and sweet seasonal oranges sourced from cold storage. Ideal for orphanage and shelter children nutrition.',
        totalQuantity: 50,
        availableQuantity: 50,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'kg',
        prepDateTime: new Date(now.getTime() - 4 * 3600 * 1000),
        expiryDateTime: in48Hours,
        storageHandling: 'room_temperature',
        allergens: ['None'],
        pickupLocation: {
          address: {
            street: '24, Park Street',
            areaLocality: 'Taltala',
            city: 'Kolkata',
            district: 'Kolkata',
            state: 'West Bengal',
            postalCode: '700016',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [88.3516, 22.5511] },
        },
        pickupStartTime: now,
        pickupEndTime: in48Hours,
        imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
      {
        title: 'Freshly Baked Whole Wheat Pav Buns, Bread Loaves & Rusks',
        category: 'bakery_items',
        dietaryType: 'Vegetarian',
        description:
          'Surplus morning bake of soft whole wheat pav buns, sandwich bread loaves, and crunchy milk rusks. Sealed in airtight bakery cartons.',
        totalQuantity: 35,
        availableQuantity: 35,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'boxes',
        prepDateTime: new Date(now.getTime() - 5 * 3600 * 1000),
        expiryDateTime: in48Hours,
        storageHandling: 'room_temperature',
        allergens: ['Wheat', 'Gluten'],
        pickupLocation: {
          address: {
            street: '8, KS Rao Road',
            areaLocality: 'Hampankatta',
            city: 'Mangaluru',
            district: 'Dakshina Kannada',
            state: 'Karnataka',
            postalCode: '575001',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [74.8427, 12.8698] },
        },
        pickupStartTime: now,
        pickupEndTime: in48Hours,
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorSunrise._id,
        organization: orgSunrise._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11223344556688',
      },
      {
        title: 'Sealed Atta, Dal, Mustard Oil & Rice Grocery Relief Packs',
        category: 'packaged_food',
        dietaryType: 'Vegetarian',
        description:
          'Standard relief dry grocery packs containing 5kg Chakki Atta, 2kg Toor Dal, 1L Kachi Ghani Mustard Oil, and 5kg Sona Masoori Rice in manufacturer packaging.',
        totalQuantity: 25,
        availableQuantity: 25,
        reservedQuantity: 0,
        collectedQuantity: 0,
        unit: 'packs',
        prepDateTime: new Date(now.getTime() - 6 * 3600 * 1000),
        expiryDateTime: in48Hours,
        storageHandling: 'room_temperature',
        allergens: ['Wheat', 'Gluten', 'Mustard'],
        pickupLocation: {
          address: {
            street: '33, MG Road',
            areaLocality: 'Ernakulam South',
            city: 'Kochi',
            district: 'Ernakulam',
            state: 'Kerala',
            postalCode: '682016',
            country: 'India',
          },
          location: { type: 'Point', coordinates: [76.2882, 9.9674] },
        },
        pickupStartTime: now,
        pickupEndTime: in48Hours,
        imageUrl: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
        status: 'available',
        donor: donorTarun._id,
        organization: orgDonorTarun._id,
        safetyGuidelinesAccepted: true,
        fssaiNumber: '11224189000124',
      },
    ];

    let seededDonations = [];
    for (const donDef of sampleDonations) {
      let existing = await Donation.findOne({ title: donDef.title });
      if (!existing) {
        existing = await Donation.create(donDef);
        console.log(`[Seed] Created donation: ${existing.title} (${existing.pickupLocation.address.city})`);
      } else {
        existing.imageUrl = donDef.imageUrl;
        existing.category = donDef.category;
        existing.dietaryType = donDef.dietaryType;
        existing.pickupLocation = donDef.pickupLocation;
        existing.pickupStartTime = donDef.pickupStartTime;
        existing.pickupEndTime = donDef.pickupEndTime;
        existing.expiryDateTime = donDef.expiryDateTime;
        existing.status = donDef.status;
        existing.availableQuantity = donDef.availableQuantity;
        existing.totalQuantity = donDef.totalQuantity;
        await existing.save();
      }
      seededDonations.push(existing);
    }

    // 3. Connect Sample Reservation & Handover Workflow
    const idliDonation = seededDonations[1]; // South Indian Steamed Idli
    let res1 = await Reservation.findOne({ donation: idliDonation._id });
    if (!res1) {
      res1 = await Reservation.create({
        donation: idliDonation._id,
        recipient: recipientFathima._id,
        recipientOrg: orgFathima._id,
        donor: donorTarun._id,
        requestedQuantity: 15,
        unit: 'meals',
        status: 'approved',
        handoverCode: 'AD-7294',
        requestNotes: 'Collection for midday shelter meal service by Karuna Aahar Relief Trust.',
        donorNotes: 'Approved! Hot packs ready at kitchen counter side entrance.',
        approvedAt: new Date(now.getTime() - 30 * 60 * 1000),
      });

      const pickupTask1 = await PickupTask.create({
        reservation: res1._id,
        donation: idliDonation._id,
        donor: donorTarun._id,
        recipient: recipientFathima._id,
        volunteer: volunteerSwathi._id,
        status: 'assigned',
        pickupAddress: idliDonation.pickupLocation.address,
        deliveryAddress: orgFathima.address,
        instructions: "Pick up from Tarun's Rasoi & Tiffin Kitchen side door. Handle with insulated thermal bag.",
        pickupWindowStart: idliDonation.pickupStartTime,
        pickupWindowEnd: idliDonation.pickupEndTime,
        assignedAt: new Date(now.getTime() - 20 * 60 * 1000),
        trackingNotes: [
          { status: 'assigned', note: 'Claimed by Swathi (Volunteer)', updatedBy: volunteerSwathi._id },
        ],
      });

      await Notification.create([
        {
          recipient: recipientFathima._id,
          title: 'Reservation Approved!',
          message:
            'Your reservation for 15 meals of "South Indian Steamed Idli, Medu Vada & Sambar" was approved! Handover Code: AD-7294',
          type: 'reservation_approved',
          relatedId: res1._id,
          relatedModel: 'Reservation',
        },
        {
          recipient: donorTarun._id,
          title: 'Volunteer Assigned',
          message: 'Swathi accepted the pickup task for your donation.',
          type: 'pickup_assigned',
          relatedId: pickupTask1._id,
          relatedModel: 'PickupTask',
        },
        {
          recipient: adminVibesh._id,
          title: 'New Organization Pending Review',
          message: 'Community Care Shelter registered and is awaiting admin verification.',
          type: 'org_verification',
          relatedId: recipientPending._id,
          relatedModel: 'Organization',
        },
      ]);
    }

    let audit = await AuditLog.findOne({ action: 'SYSTEM_INITIALIZED' });
    if (!audit) {
      await AuditLog.create({
        action: 'SYSTEM_INITIALIZED',
        role: 'system',
        entityType: 'System',
        details: { message: 'Annadhara pan-Indian food rescue database initialized idempotently' },
      });
    }

    console.log('-----------------------------------------------------------');
    console.log('✅ Annadhara Pan-Indian database successfully verified & seeded!');
    console.log('-----------------------------------------------------------');
    console.log('Official Evaluation Demo Accounts:');
    console.log('1. Admin:     vibesh.admin@annadhara.in     / Admin@123     (Vibesh)');
    console.log('2. Donor:     tarun.donor@annadhara.in      / Donor@123     (Tarun Rasoi)');
    console.log('3. Recipient: fathima.ngo@annadhara.in      / Recipient@123 (Karuna Trust)');
    console.log('4. Volunteer: swathi.volunteer@annadhara.in / Volunteer@123 (Swathi)');
    console.log('-----------------------------------------------------------');
    console.log('Active Pan-Indian Cities Seeded:');
    console.log('Hyderabad, Bengaluru, Mysuru, Delhi, Chennai, Pune, Mumbai, Kolkata, Mangaluru, Kochi');
    console.log('-----------------------------------------------------------');

    return true;
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

if (require.main === module) {
  const forceClean = process.argv.includes('--clean') || process.argv.includes('-c');
  seed({ forceClean })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase: seed };
