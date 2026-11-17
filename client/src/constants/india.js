/**
 * ANNADHARA — INDIAN LOCALIZATION CONSTANTS & HELPERS
 * Team Seva Shakti (MERNOVA X 2026)
 * Complete Indian address system (28 States + 8 UTs, 6-digit PIN codes),
 * +91 phone formatting, INR currency, and India-specific food categories.
 */

export const DEFAULT_COUNTRY = 'India';
export const DEFAULT_COUNTRY_CODE = 'IN';
export const DEFAULT_CALLING_CODE = '+91';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

// 28 Indian States & 8 Union Territories
export const INDIAN_STATES = [
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

// Indian Food Donor Organization Types
export const DONOR_ORGANIZATION_TYPES = [
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
  'Other',
];

// Indian Recipient Organization Types
export const RECIPIENT_ORGANIZATION_TYPES = [
  'Registered NGO',
  'Charitable Trust',
  'Orphanage',
  'Old Age Home',
  'Community Kitchen',
  'Shelter Home',
  'Food Distribution Organization',
  'Other',
];

// Volunteer Roles
export const VOLUNTEER_TYPES = [
  'Individual Volunteer',
  'NGO Volunteer',
  'College Volunteer',
  'Delivery / Pickup Partner',
];

// Indian Food Categories
export const FOOD_CATEGORIES = [
  { id: 'rice_meals', label: 'Rice and Meals', icon: '🍚' },
  { id: 'roti_chapati', label: 'Roti / Chapati', icon: '🫓' },
  { id: 'idli_dosa', label: 'Idli / Dosa', icon: '🥞' },
  { id: 'biryani', label: 'Biryani', icon: '🍲' },
  { id: 'snacks', label: 'Snacks & Savouries', icon: '🥟' },
  { id: 'bakery_items', label: 'Bakery Items', icon: '🍞' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'vegetables', label: 'Vegetables', icon: '🥦' },
  { id: 'packaged_food', label: 'Packaged Food', icon: '📦' },
  { id: 'groceries', label: 'Groceries & Grains', icon: '🌾' },
  { id: 'dairy_products', label: 'Dairy Products', icon: '🥛' },
  { id: 'cooked_meals', label: 'Cooked Meals (General)', icon: '🍱' },
  { id: 'bakery_grains', label: 'Breads & Grains', icon: '🥖' },
  { id: 'produce_fresh', label: 'Fresh Produce', icon: '🥕' },
  { id: 'other', label: 'Other', icon: '🍽️' },
];

export const getCategoryLabel = (catId) => {
  const found = FOOD_CATEGORIES.find((c) => c.id === catId);
  if (found) return found.label;
  if (!catId) return 'General Meal';
  return catId
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// Dietary Classification
export const DIETARY_TYPES = [
  { id: 'Vegetarian', label: 'Vegetarian', color: 'text-green-700 bg-green-50 border-green-200', symbol: '🟢' },
  { id: 'Non-Vegetarian', label: 'Non-Vegetarian', color: 'text-red-700 bg-red-50 border-red-200', symbol: '🔴' },
  { id: 'Vegan', label: 'Vegan', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', symbol: '🌱' },
];

// Measurement Units (Metric & Portions)
export const FOOD_UNITS = [
  { id: 'meals', label: 'Meals' },
  { id: 'portions', label: 'Portions' },
  { id: 'kg', label: 'kg (Kilograms)' },
  { id: 'g', label: 'g (Grams)' },
  { id: 'litres', label: 'Litres' },
  { id: 'ml', label: 'ml (Millilitres)' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'packs', label: 'Packs' },
];

// Currency Formatter (INR - ₹) with Indian Comma System (e.g. ₹1,50,000)
export const formatINR = (amount = 0) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Indian Date Formatter (DD/MM/YYYY, 12-hour format with AM/PM)
export const formatIndianDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = String(hours).padStart(2, '0');

  if (options.dateOnly) {
    return `${day}/${month}/${year}`;
  }
  if (options.timeOnly) {
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  return `${day}/${month}/${year}, ${formattedHours}:${minutes} ${ampm}`;
};

// Indian Phone Validator
export const isValidIndianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  // Indian 10-digit mobile (starts with 6, 7, 8, or 9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) return true;
  // Indian mobile with +91 or 91
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) return true;
  // Indian landline with STD code (8-11 digits)
  if (digits.length >= 8 && digits.length <= 11) return true;
  // General fallback for demo credentials (7-15 digits)
  return digits.length >= 7 && digits.length <= 15;
};

// Formats phone into readable Indian format: +91 98765 43210
export const formatIndianPhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
};

// 6-digit Indian PIN Code Validator
export const isValidPINCode = (pin) => {
  if (!pin) return false;
  const trimmed = String(pin).trim();
  // Standard 6-digit Indian PIN code (1st digit 1-9)
  if (/^[1-9][0-9]{5}$/.test(trimmed)) return true;
  // General alphanumeric fallback for testing
  return /^[A-Za-z0-9\s-]{4,10}$/.test(trimmed);
};

// Food Safety Disclaimer in compliance with FSSAI Surplus Food Guidelines
export const FOOD_SAFETY_DISCLAIMER =
  'In accordance with FSSAI surplus food regulations, all food donations must be hygienically prepared, temperature-controlled, and fit for human consumption before handover. Annadhara coordinates logistics and does not independently inspect or certify food safety.';

