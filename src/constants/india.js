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

// Self-contained, brand-aligned SVG placeholder for zero-network / offline / error states
export const NEUTRAL_FOOD_PLACEHOLDER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" fill="#EAF4EE"/>
    <circle cx="300" cy="180" r="70" fill="#2E7D5B" fill-opacity="0.12"/>
    <path d="M260 210C260 210 270 230 300 230C330 230 340 210 340 210H260Z" fill="#2E7D5B"/>
    <path d="M250 200C250 172.386 272.386 150 300 150C327.614 150 350 172.386 350 200H250Z" fill="#2E7D5B"/>
    <circle cx="300" cy="142" r="6" fill="#2E7D5B"/>
    <rect x="235" y="202" width="130" height="6" rx="3" fill="#205B43"/>
    <text x="300" y="275" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#205B43" text-anchor="middle">Annadhara Food Rescue</text>
    <text x="300" y="298" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#718078" text-anchor="middle">Surplus Food • Shared Hope</text>
  </svg>`
)}`;

// Verified high-resolution authentic dish-specific food images
export const FOOD_DISH_IMAGES = {
  // Biryani & Rice Specialities
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  pulao: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
  fried_rice: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
  curd_rice: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  lemon_rice: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  dal_rice: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  sambar_rice: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  rice_meals: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
  veg_meals: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',

  // Indian Breads & Tandoor
  roti_chapati: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
  paratha: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80',
  poori: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
  naan: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',

  // South Indian Tiffin
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
  sambar: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',

  // Curries & Gravies
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
  chicken_curry: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
  curry_dal: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',

  // Snacks & Fast Food
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  snacks: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
  sandwich: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  noodles: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=800&auto=format&fit=crop&q=80',

  // Bakery, Sweets & Produce
  cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
  sweets: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
  bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  packaged_food: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
  beverages: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
  default_meal: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
};

// Backwards-compatible category image dictionary
export const CATEGORY_FALLBACK_IMAGES = {
  biryani: FOOD_DISH_IMAGES.biryani,
  idli_dosa: FOOD_DISH_IMAGES.idli,
  dosa: FOOD_DISH_IMAGES.dosa,
  roti_chapati: FOOD_DISH_IMAGES.roti_chapati,
  rice_meals: FOOD_DISH_IMAGES.rice_meals,
  curry_dal: FOOD_DISH_IMAGES.curry_dal,
  paneer: FOOD_DISH_IMAGES.paneer,
  snacks: FOOD_DISH_IMAGES.snacks,
  fruits: FOOD_DISH_IMAGES.fruits,
  produce_fresh: FOOD_DISH_IMAGES.fruits,
  vegetables: FOOD_DISH_IMAGES.vegetables,
  bakery_items: FOOD_DISH_IMAGES.bread,
  bakery_grains: FOOD_DISH_IMAGES.bread,
  packaged_food: FOOD_DISH_IMAGES.packaged_food,
  packaged_groceries: FOOD_DISH_IMAGES.packaged_food,
  groceries: FOOD_DISH_IMAGES.packaged_food,
  cooked_meals: FOOD_DISH_IMAGES.veg_meals,
  dairy_products: FOOD_DISH_IMAGES.paneer,
  beverages: FOOD_DISH_IMAGES.beverages,
  other: FOOD_DISH_IMAGES.default_meal,
};

// Default authentic Indian meal fallback image
export const DEFAULT_FOOD_IMAGE = FOOD_DISH_IMAGES.default_meal;

/**
 * Returns an authentic, visually accurate food image based on exact food dish title and category.
 * Exact dish matches in title take precedence over broad category mappings.
 */
export const getFoodSpecificImage = (title = '', category = '') => {
  const t = (title || '').toLowerCase().trim();
  const c = (category || '').toLowerCase().trim();

  // 1. Biryani (Hyderabadi, Dum, Chicken, Veg, Mutton)
  if (t.includes('biryani') || t.includes('briyani') || t.includes('biriyani')) {
    return FOOD_DISH_IMAGES.biryani;
  }

  // 2. Curd Rice
  if (t.includes('curd rice') || t.includes('thayir sadam') || t.includes('mosaranna') || t.includes('dahi chawal') || t.includes('dahi rice')) {
    return FOOD_DISH_IMAGES.curd_rice;
  }

  // 3. Lemon Rice / Tamarind Rice
  if (t.includes('lemon rice') || t.includes('chitranna') || t.includes('pulihora') || t.includes('puliyodharai') || t.includes('tamarind rice')) {
    return FOOD_DISH_IMAGES.lemon_rice;
  }

  // 4. Fried Rice
  if (t.includes('fried rice') || t.includes('schezwan rice') || t.includes('egg fried rice')) {
    return FOOD_DISH_IMAGES.fried_rice;
  }

  // 5. Pulao / Pilaf
  if (t.includes('pulao') || t.includes('pulav') || t.includes('pilaf') || t.includes('pehra')) {
    return FOOD_DISH_IMAGES.pulao;
  }

  // 6. Dal Rice / Rajma Chawal / Chole Chawal / Khichdi / Pongal / Bisi Bele Bath
  if (
    t.includes('dal rice') ||
    t.includes('dal chawal') ||
    t.includes('rajma chawal') ||
    t.includes('chole chawal') ||
    t.includes('khichdi') ||
    t.includes('pongal') ||
    t.includes('bisi bele bath') ||
    t.includes('sambar rice')
  ) {
    return FOOD_DISH_IMAGES.dal_rice;
  }

  // 7. Paratha / Parotta / Aloo Paratha
  if (t.includes('paratha') || t.includes('parotta') || t.includes('pratha')) {
    return FOOD_DISH_IMAGES.paratha;
  }

  // 8. Poori / Puri / Bhature / Chole Bhature
  if (t.includes('poori') || t.includes('puri') || t.includes('bhature') || t.includes('bhatura')) {
    return FOOD_DISH_IMAGES.poori;
  }

  // 9. Chapati / Roti / Phulka / Naan / Kulcha
  if (t.includes('roti') || t.includes('chapati') || t.includes('chapatti') || t.includes('phulka') || t.includes('fulka') || t.includes('tandoori roti')) {
    return FOOD_DISH_IMAGES.roti_chapati;
  }
  if (t.includes('naan') || t.includes('kulcha')) {
    return FOOD_DISH_IMAGES.naan;
  }

  // 10. Dosa / Masala Dosa / Uttapam
  if (t.includes('dosa') || t.includes('dosai') || t.includes('uttapam') || t.includes('oothappam') || t.includes('pesrattu')) {
    return FOOD_DISH_IMAGES.dosa;
  }

  // 11. Idli / Steamed Idli / Thatte Idli / Vada
  if (t.includes('idli') || t.includes('idly') || t.includes('vada') || t.includes('vadai') || t.includes('medu vada')) {
    return FOOD_DISH_IMAGES.idli;
  }

  // 12. Sambar / Rasam
  if (t.includes('sambar') || t.includes('sambhar') || t.includes('rasam')) {
    return FOOD_DISH_IMAGES.sambar;
  }

  // 13. Paneer
  if (t.includes('paneer') || t.includes('panir')) {
    return FOOD_DISH_IMAGES.paneer;
  }

  // 14. Non-Veg Curries: Chicken, Mutton, Fish, Egg
  if (
    t.includes('chicken') ||
    t.includes('murgh') ||
    t.includes('mutton') ||
    t.includes('fish curry') ||
    t.includes('egg curry') ||
    t.includes('meat') ||
    t.includes('butter chicken')
  ) {
    return FOOD_DISH_IMAGES.chicken_curry;
  }

  // 15. Dal / Lentils / Sambar / Curry
  if (t.includes('dal') || t.includes('daal') || t.includes('dhal') || t.includes('tadka') || t.includes('makhani') || t.includes('korma') || t.includes('kurma') || t.includes('curry') || t.includes('gravy')) {
    return FOOD_DISH_IMAGES.curry_dal;
  }

  // 16. Samosa / Pakora / Bhajiya / Vada Pav / Kachori
  if (t.includes('samosa') || t.includes('pakora') || t.includes('pakoda') || t.includes('bhajji') || t.includes('bhajiya') || t.includes('vada pav') || t.includes('kachori') || t.includes('dhokla')) {
    return FOOD_DISH_IMAGES.samosa;
  }

  // 17. Pizza
  if (t.includes('pizza') || t.includes('calzone')) {
    return FOOD_DISH_IMAGES.pizza;
  }

  // 18. Burger
  if (t.includes('burger') || t.includes('patty')) {
    return FOOD_DISH_IMAGES.burger;
  }

  // 19. Sandwich (exclude "sandwich bread" which is a loaf of bread)
  if (t.includes('sandwich bread') || t.includes('bread loaf') || t.includes('loaf of bread')) {
    return FOOD_DISH_IMAGES.bread;
  }
  if (t.includes('sandwich') || t.includes('toast') || t.includes('sub')) {
    return FOOD_DISH_IMAGES.sandwich;
  }

  // 20. Noodles / Chowmein / Pasta
  if (t.includes('noodle') || t.includes('noodles') || t.includes('chowmein') || t.includes('chow mein') || t.includes('maggi')) {
    return FOOD_DISH_IMAGES.noodles;
  }
  if (t.includes('pasta') || t.includes('macaroni') || t.includes('spaghetti') || t.includes('penne')) {
    return FOOD_DISH_IMAGES.pasta;
  }

  // 21. Cake / Pastry / Cupcake
  if (t.includes('cake') || t.includes('pastry') || t.includes('cupcake') || t.includes('muffin')) {
    return FOOD_DISH_IMAGES.cake;
  }

  // 22. Indian Sweets / Mithai
  if (t.includes('sweet') || t.includes('mithai') || t.includes('gulab jamun') || t.includes('laddu') || t.includes('halwa') || t.includes('jalebi') || t.includes('kheer') || t.includes('pedha') || t.includes('barfi')) {
    return FOOD_DISH_IMAGES.sweets;
  }

  // 23. Breads / Pav / Bakery
  if (t.includes('bread') || t.includes('pav') || t.includes('bun') || t.includes('buns') || t.includes('bakery') || t.includes('loaf')) {
    return FOOD_DISH_IMAGES.bread;
  }

  // 24. Fruits
  if (t.includes('fruit') || t.includes('fruits') || t.includes('apple') || t.includes('banana') || t.includes('orange') || t.includes('mango') || t.includes('grape') || t.includes('papaya')) {
    return FOOD_DISH_IMAGES.fruits;
  }

  // 25. Vegetables / Salad
  if (t.includes('vegetable') || t.includes('vegetables') || t.includes('veggie') || t.includes('salad') || t.includes('sabzi') || t.includes('subzi') || t.includes('tarkari')) {
    return FOOD_DISH_IMAGES.vegetables;
  }

  // 26. General Rice / Meals / Thali
  if (t.includes('thali') || t.includes('meal') || t.includes('meals') || t.includes('bhojan') || t.includes('oota')) {
    return FOOD_DISH_IMAGES.veg_meals;
  }
  if (t.includes('rice') || t.includes('chawal') || t.includes('anna')) {
    return FOOD_DISH_IMAGES.rice_meals;
  }

  // 27. Tea / Coffee / Beverages
  if (t.includes('tea') || t.includes('chai') || t.includes('coffee') || t.includes('juice') || t.includes('beverage') || t.includes('drink') || t.includes('lassi') || t.includes('buttermilk')) {
    return FOOD_DISH_IMAGES.beverages;
  }

  // Level 2: Category-based Fallback (when title is too generic or non-specific)
  if (c === 'biryani') return FOOD_DISH_IMAGES.biryani;
  if (c === 'idli_dosa') return FOOD_DISH_IMAGES.idli;
  if (c === 'roti_chapati') return FOOD_DISH_IMAGES.roti_chapati;
  if (c === 'rice_meals') return FOOD_DISH_IMAGES.rice_meals;
  if (c === 'curry_dal') return FOOD_DISH_IMAGES.curry_dal;
  if (c === 'paneer') return FOOD_DISH_IMAGES.paneer;
  if (c === 'snacks') return FOOD_DISH_IMAGES.snacks;
  if (c === 'fruits' || c === 'produce_fresh') return FOOD_DISH_IMAGES.fruits;
  if (c === 'vegetables') return FOOD_DISH_IMAGES.vegetables;
  if (c === 'bakery_items' || c === 'bakery_grains') return FOOD_DISH_IMAGES.bread;
  if (c === 'packaged_food' || c === 'packaged_groceries' || c === 'groceries') return FOOD_DISH_IMAGES.packaged_food;
  if (c === 'beverages') return FOOD_DISH_IMAGES.beverages;
  if (c === 'cooked_meals') return FOOD_DISH_IMAGES.veg_meals;

  return FOOD_DISH_IMAGES.default_meal;
};

/**
 * Returns an accurate category-specific Indian food image based on donation category and title keywords
 */
export const getCategoryFallbackImage = (category = '', title = '') => {
  return getFoodSpecificImage(title, category);
};

/**
 * Resolves food image URL, prioritizing user uploads and ensuring accurate dish matching for stock images
 */
export const resolveImageUrl = (url, category = '', title = '') => {
  if (!url || typeof url !== 'string' || !url.trim() || url.includes('placeholder') || url.includes('default')) {
    return getFoodSpecificImage(title, category);
  }

  const trimmed = url.trim();

  // 1. Prioritize user-uploaded data URLs and blob URLs — NEVER override
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // 2. Prioritize local backend uploads (/uploads/...) — NEVER override
  if (trimmed.startsWith('/uploads') || trimmed.includes('/uploads/')) {
    const apiBase = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '';
    if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
      const origin = apiBase.replace(/\/api\/?$/, '');
      return `${origin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
    }
    return trimmed;
  }

  // 3. Remote HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If the image URL is a generic fallback or stock image, but the title specifies a distinct dish,
    // upgrade to the dish-specific image so that Biryani never displays pizza, etc.
    const isGenericStock =
      trimmed.includes('photo-1585937421612-70a008356fbe') || // yellow dal / general meal
      trimmed.includes('photo-1546069901-ba9599a7e63c') || // generic salad
      (trimmed.includes('photo-1610057099443-fde8c4d50f91') && !title.toLowerCase().includes('rice')); // rice preset for non-rice

    if (isGenericStock && title && title.trim().length > 0) {
      const specific = getFoodSpecificImage(title, category);
      if (specific !== FOOD_DISH_IMAGES.default_meal) {
        return specific;
      }
    }
    return trimmed;
  }

  return trimmed;
};

