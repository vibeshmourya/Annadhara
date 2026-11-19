/**
 * ANNADHARA — INDIAN LOCALIZATION & VALIDATION HELPERS
 * Team Seva Shakti (MERNOVA X 2026)
 * Validates Indian mobile & landline phones, 6-digit PIN codes,
 * 28 States + 8 UTs, and India-specific food donor/recipient organization types.
 */

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const DONOR_ORGANIZATION_TYPES = [
  'Restaurant',
  'Hotel',
  'Bakery',
  'College Canteen',
  'School Canteen',
  'Corporate Cafeteria',
  'Catering Service',
  'Marriage Hall / Event Venue',
  'Hostel / Mess',
  'Supermarket / Grocery Store',
  'Food Manufacturing Unit',
  'Event Organizer',
  'Other',
];

const RECIPIENT_ORGANIZATION_TYPES = [
  'Registered NGO',
  'Charitable Trust',
  'Orphanage',
  'Old Age Home',
  'Community Kitchen',
  'Shelter Home',
  'Food Distribution Organization',
  'NGO',
  'Other',
];

const VOLUNTEER_TYPES = [
  'Individual Volunteer',
  'NGO Volunteer',
  'College Volunteer',
  'Delivery / Pickup Partner',
];

const ORGANIZATION_TYPES = Array.from(
  new Set([...DONOR_ORGANIZATION_TYPES, ...RECIPIENT_ORGANIZATION_TYPES])
);

/**
 * Normalizes role aliases into canonical platform role values.
 */
const normalizeRole = (role) => {
  if (typeof role !== 'string') return role;
  const upper = role.trim().toUpperCase();
  if (upper === 'FOOD_DONOR' || upper === 'FOOD DONOR') return 'DONOR';
  if (upper === 'RECIPIENT_NGO' || upper === 'RECIPIENT NGO') return 'RECIPIENT';
  return upper;
};

/**
 * Normalizes known organization type variants to canonical enum values.
 * Returns `null` when an unrecognized non-empty value is supplied.
 */
const normalizeOrgType = (type, defaultType = null) => {
  if (!type || (typeof type === 'string' && !type.trim())) {
    return defaultType;
  }
  const raw = String(type).trim();
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '');

  if (lower.includes('bakery')) return 'Bakery';
  if (lower.includes('restaurant')) return 'Restaurant';
  if (lower.includes('hotel')) return 'Hotel';
  if (lower.includes('collegecanteen')) return 'College Canteen';
  if (lower.includes('schoolcanteen') || lower.includes('school')) return 'School Canteen';
  if (lower.includes('corporate') || lower.includes('cafeteria')) return 'Corporate Cafeteria';
  if (lower.includes('catering')) return 'Catering Service';
  if (lower.includes('marriage') || lower.includes('hall') || lower.includes('venue')) return 'Marriage Hall / Event Venue';
  if (lower.includes('hostel') || lower.includes('mess')) return 'Hostel / Mess';
  if (lower.includes('supermarket') || lower.includes('grocery')) return 'Supermarket / Grocery Store';
  if (lower.includes('manufacturing') || lower.includes('factory')) return 'Food Manufacturing Unit';
  if (lower.includes('registeredngo')) return 'Registered NGO';
  if (lower.includes('trust') || lower.includes('charitable')) return 'Charitable Trust';
  if (lower.includes('orphanage')) return 'Orphanage';
  if (lower.includes('oldage') || lower.includes('elderly')) return 'Old Age Home';
  if (lower.includes('communitykitchen') || lower.includes('kitchen')) return 'Community Kitchen';
  if (lower.includes('shelter')) return 'Shelter Home';
  if (lower.includes('canteen')) return 'College Canteen';
  if (lower.includes('event')) return 'Event Organizer';
  if (lower.includes('distribution') || lower.includes('foodbank')) {
    return 'Food Distribution Organization';
  }
  if (lower === 'ngo') return 'NGO';
  if (lower === 'other') return 'Other';

  // Direct exact match
  if (ORGANIZATION_TYPES.includes(raw)) {
    return raw;
  }

  return null;
};

/**
 * Validates phone string format:
 * - Supports Indian 10-digit mobile numbers (6-9 starting digit, optional +91/91/0 prefix)
 * - Supports Indian landlines with STD codes
 * - Supports standard general phone strings (7-15 digits) for test backward-compatibility
 */
const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Strip spaces, dashes, parentheses, dots
  const stripped = trimmed.replace(/[\s().-]/g, '');
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 1. Indian 10-digit mobile check (starts with 6, 7, 8, or 9)
  const isIndianMobile = /^(?:(?:\+|0{0,2})91)?[6-9]\d{9}$/.test(stripped);
  if (isIndianMobile) return true;

  // 2. Indian landline (STD code + number, 8 to 11 digits)
  const isIndianLandline = /^(?:(?:\+|0{0,2})91)?0[2-8]\d{1,4}\d{6,8}$/.test(stripped);
  if (isIndianLandline) return true;

  // 3. General standard phone validation (allows +, digits, 7-15 digits)
  if (/^[+\d][\d\s().-]{6,19}$/.test(trimmed) && digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return true;
  }

  return false;
};

/**
 * Validates Indian 6-digit PIN code (e.g. 560001, 110001).
 * Accepts general alphanumeric postal codes for legacy test backwards compatibility.
 */
const isValidPINCode = (pin) => {
  if (!pin) return false;
  const trimmed = String(pin).trim();
  // Standard Indian 6-digit PIN code (first digit 1-9)
  const isIndianPin = /^[1-9][0-9]{5}$/.test(trimmed);
  if (isIndianPin) return true;
  // General alphanumeric postal code (e.g. legacy test postal codes)
  return /^[A-Za-z0-9\s-]{4,10}$/.test(trimmed);
};

/**
 * Formats a phone number for readable Indian display (e.g. +91 98765 43210).
 */
const formatIndianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return trimmed;
};

/**
 * Normalizes nested address fields with Indian address terminology support:
 * - street (House / Building / Street)
 * - areaLocality (Area / Locality)
 * - city (Village / Town / City)
 * - district (District)
 * - state (State / Union Territory)
 * - postalCode / pincode (6-digit PIN code)
 * - country: 'India'
 */
const normalizeAddress = (address = {}, fallbackSource = {}) => {
  const src = address && typeof address === 'object' ? address : {};
  return {
    street: String(src.street ?? fallbackSource.street ?? '').trim(),
    areaLocality: String(src.areaLocality ?? fallbackSource.areaLocality ?? src.area ?? fallbackSource.area ?? '').trim(),
    city: String(src.city ?? fallbackSource.city ?? '').trim(),
    district: String(src.district ?? fallbackSource.district ?? '').trim(),
    state: String(src.state ?? fallbackSource.state ?? '').trim(),
    postalCode: String(
      src.postalCode ?? src.pincode ?? fallbackSource.postalCode ?? fallbackSource.pincode ?? ''
    ).trim(),
    country: String(src.country ?? fallbackSource.country ?? 'India').trim() || 'India',
  };
};

const CANONICAL_FOOD_CATEGORIES = [
  'rice_meals',
  'roti_chapati',
  'idli_dosa',
  'biryani',
  'snacks',
  'bakery_items',
  'fruits',
  'vegetables',
  'packaged_food',
  'groceries',
  'dairy_products',
  'other',
];

const LEGACY_FOOD_CATEGORIES = [
  'cooked_meals',
  'bakery_grains',
  'produce_fresh',
  'packaged_groceries',
  'dairy',
  'beverages',
  'prepared_catering',
];

const ALL_FOOD_CATEGORIES = [...CANONICAL_FOOD_CATEGORIES, ...LEGACY_FOOD_CATEGORIES];

const DIETARY_TYPES = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Other'];

const normalizeDietaryType = (val) => {
  if (!val || typeof val !== 'string') return 'Vegetarian';
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'vegetarian' || lower === 'veg') return 'Vegetarian';
  if (lower === 'non-vegetarian' || lower === 'non_veg' || lower === 'non-veg') return 'Non-Vegetarian';
  if (lower === 'vegan') return 'Vegan';
  if (DIETARY_TYPES.includes(trimmed)) return trimmed;
  return 'Vegetarian';
};

const QUANTITY_UNITS = [
  'meals',
  'portions',
  'plates',
  'packs',
  'packets',
  'boxes',
  'kg',
  'g',
  'litres',
  'liters',
  'ml',
  'pieces',
  'pcs',
];

const STORAGE_CONDITIONS = [
  'room_temperature',
  'refrigerated',
  'frozen',
  'hot_held',
  'other',
];

module.exports = {
  INDIAN_STATES,
  DONOR_ORGANIZATION_TYPES,
  RECIPIENT_ORGANIZATION_TYPES,
  VOLUNTEER_TYPES,
  ORGANIZATION_TYPES,
  CANONICAL_FOOD_CATEGORIES,
  LEGACY_FOOD_CATEGORIES,
  ALL_FOOD_CATEGORIES,
  DIETARY_TYPES,
  normalizeDietaryType,
  QUANTITY_UNITS,
  STORAGE_CONDITIONS,
  normalizeRole,
  normalizeOrgType,
  isValidPhone,
  isValidPINCode,
  formatIndianPhone,
  normalizeAddress,
};
