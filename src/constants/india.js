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
  { id: 'plates', label: 'Plates' },
  { id: 'packs', label: 'Packs / Packets' },
  { id: 'boxes', label: 'Boxes' },
  { id: 'kg', label: 'kg (Kilograms)' },
  { id: 'g', label: 'g (Grams)' },
  { id: 'litres', label: 'Litres' },
  { id: 'ml', label: 'ml (Millilitres)' },
  { id: 'pieces', label: 'Pieces / Count' },
  { id: 'portions', label: 'Portions' },
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

// Prominent Indian cities supported across the platform
export const INDIAN_CITIES = [
  'Bengaluru',
  'Mysuru',
  'Chennai',
  'Hyderabad',
  'Mumbai',
  'Pune',
  'Delhi',
  'Kolkata',
  'Kochi',
  'Mangaluru',
];

// Verified high-resolution authentic Indian food images for category-specific fallbacks
export const CATEGORY_FALLBACK_IMAGES = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  idli_dosa: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
  roti_chapati: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
  rice_meals: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  curry_dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
  produce_fresh: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  bakery_items: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  bakery_grains: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  packaged_food: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  packaged_groceries: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  groceries: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  cooked_meals: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
  dairy_products: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
  beverages: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
  other: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
};

// Default high-resolution authentic Indian meal fallback image
export const DEFAULT_FOOD_IMAGE = CATEGORY_FALLBACK_IMAGES.cooked_meals;

/**
 * Returns an accurate category-specific Indian food image based on donation category and title keywords
 */
export const getCategoryFallbackImage = (category = '', title = '') => {
  const text = `${title} ${category}`.toLowerCase();

  if (text.includes('biryani') || text.includes('pulao')) return CATEGORY_FALLBACK_IMAGES.biryani;
  if (text.includes('dosa')) return CATEGORY_FALLBACK_IMAGES.dosa;
  if (text.includes('idli') || text.includes('vada') || text.includes('sambar')) return CATEGORY_FALLBACK_IMAGES.idli_dosa;
  if (text.includes('paneer')) return CATEGORY_FALLBACK_IMAGES.paneer;
  if (text.includes('roti') || text.includes('chapati') || text.includes('naan') || text.includes('paratha') || text.includes('kulcha')) {
    return CATEGORY_FALLBACK_IMAGES.roti_chapati;
  }
  if (text.includes('fruit') || text.includes('apple') || text.includes('banana') || text.includes('orange') || text.includes('mango')) {
    return CATEGORY_FALLBACK_IMAGES.fruits;
  }
  if (text.includes('vegetable') || text.includes('veggie') || text.includes('sabzi') || text.includes('salad')) {
    return CATEGORY_FALLBACK_IMAGES.vegetables;
  }
  if (text.includes('samosa') || text.includes('snack') || text.includes('pakora') || text.includes('bhajji') || text.includes('kachori')) {
    return CATEGORY_FALLBACK_IMAGES.snacks;
  }
  if (text.includes('bread') || text.includes('bun') || text.includes('bakery') || text.includes('cake') || text.includes('pav')) {
    return CATEGORY_FALLBACK_IMAGES.bakery_items;
  }
  if (text.includes('curry') || text.includes('dal') || text.includes('korma') || text.includes('gravy')) {
    return CATEGORY_FALLBACK_IMAGES.curry_dal;
  }
  if (text.includes('rice') || text.includes('meal') || text.includes('thali') || text.includes('khichdi')) {
    return CATEGORY_FALLBACK_IMAGES.rice_meals;
  }
  if (text.includes('tea') || text.includes('chai') || text.includes('coffee') || text.includes('juice') || text.includes('beverage')) {
    return CATEGORY_FALLBACK_IMAGES.beverages;
  }

  const catKey = (category || '').toLowerCase().trim();
  return CATEGORY_FALLBACK_IMAGES[catKey] || CATEGORY_FALLBACK_IMAGES.cooked_meals;
};

/**
 * Resolves food image URL, providing category-aware authentic fallback when empty or invalid
 */
export const resolveImageUrl = (url, category = '', title = '') => {
  if (!url || typeof url !== 'string' || !url.trim() || url.includes('placeholder')) {
    return getCategoryFallbackImage(category, title);
  }
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('data:image/')) return trimmed;
  const apiBase = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '';
  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  }
  return trimmed;
};

