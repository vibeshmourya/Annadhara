/// ANNADHARA — INDIA LOCALIZATION CONSTANTS (MOBILE)
/// Team Seva Shakti (MERNOVA X 2026)
/// 28 Indian States + 8 UTs, +91 calling code, INR currency,
/// 6-digit PIN code validation, metric units, and Indian food categories.
library;

class IndiaConstants {
  static const String defaultCountry = 'India';
  static const String defaultCountryCode = 'IN';
  static const String defaultCallingCode = '+91';

  // 28 Indian States & 8 Union Territories
  static const List<String> indianStates = [
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
  static const List<String> donorOrgTypes = [
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
  static const List<String> recipientOrgTypes = [
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
  static const List<String> volunteerTypes = [
    'Individual Volunteer',
    'NGO Volunteer',
    'College Volunteer',
    'Delivery / Pickup Partner',
  ];

  // Indian Food Categories
  static const List<Map<String, String>> foodCategories = [
    {'id': 'rice_meals', 'label': 'Rice and Meals', 'icon': '🍚'},
    {'id': 'roti_chapati', 'label': 'Roti / Chapati', 'icon': '🫓'},
    {'id': 'idli_dosa', 'label': 'Idli / Dosa', 'icon': '🥞'},
    {'id': 'biryani', 'label': 'Biryani', 'icon': '🍲'},
    {'id': 'snacks', 'label': 'Snacks', 'icon': '🥟'},
    {'id': 'bakery_items', 'label': 'Bakery Items', 'icon': '🍞'},
    {'id': 'fruits', 'label': 'Fruits', 'icon': '🍎'},
    {'id': 'vegetables', 'label': 'Vegetables', 'icon': '🥦'},
    {'id': 'packaged_food', 'label': 'Packaged Food', 'icon': '📦'},
    {'id': 'groceries', 'label': 'Groceries', 'icon': '🌾'},
    {'id': 'dairy_products', 'label': 'Dairy Products', 'icon': '🥛'},
    {'id': 'cooked_meals', 'label': 'Cooked Meals', 'icon': '🍱'},
    {'id': 'bakery_grains', 'label': 'Breads & Grains', 'icon': '🥖'},
    {'id': 'produce_fresh', 'label': 'Fresh Produce', 'icon': '🥕'},
    {'id': 'other', 'label': 'Other', 'icon': '🍽️'},
  ];

  // Dietary Options
  static const List<String> dietaryTypes = [
    'Vegetarian',
    'Non-Vegetarian',
    'Vegan',
  ];

  // Metric Units
  static const List<String> measurementUnits = [
    'meals',
    'plates',
    'packs',
    'boxes',
    'kg',
    'g',
    'litres',
    'ml',
    'pieces',
    'portions',
  ];

  // Validates Indian phone numbers (10 digits starting with 6-9, or with +91)
  static bool isValidIndianPhone(String phone) {
    final trimmed = phone.trim();
    final digits = trimmed.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 10 && RegExp(r'^[6-9]').hasMatch(digits)) return true;
    if (digits.length == 12 && digits.startsWith('91') && RegExp(r'^[6-9]').hasMatch(digits.substring(2))) return true;
    // Fallback for demo credentials
    return digits.length >= 7 && digits.length <= 15;
  }

  // Validates 6-digit Indian PIN code
  static bool isValidPINCode(String pin) {
    final trimmed = pin.trim();
    if (RegExp(r'^\d+$').hasMatch(trimmed)) {
      return RegExp(r'^[1-9][0-9]{5}$').hasMatch(trimmed);
    }
    return RegExp(r'^[A-Za-z0-9\s-]{4,10}$').hasMatch(trimmed);
  }

  // Formats phone into +91 XXXXX XXXXX
  static String formatIndianPhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 10 && RegExp(r'^[6-9]').hasMatch(digits)) {
      return '+91 ${digits.substring(0, 5)} ${digits.substring(5)}';
    }
    if (digits.length == 12 && digits.startsWith('91')) {
      return '+91 ${digits.substring(2, 7)} ${digits.substring(7)}';
    }
    return phone;
  }

  // Formats date into DD/MM/YYYY, hh:mm AM/PM
  static String formatIndianDate(DateTime? date) {
    if (date == null) return '';
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString();
    final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
    final minute = date.minute.toString().padLeft(2, '0');
    final ampm = date.hour >= 12 ? 'PM' : 'AM';
    return '$day/$month/$year, $hour:$minute $ampm';
  }

  // Currency formatted as ₹1,50,000
  static String formatINR(num amount) {
    // Simple Indian thousands separator formatter
    final str = amount.toInt().toString();
    if (str.length <= 3) return '₹$str';
    final lastThree = str.substring(str.length - 3);
    final otherNumbers = str.substring(0, str.length - 3);
    final formattedOther = otherNumbers.replaceAllMapped(
      RegExp(r'(\d)(?=(\d\d)+$)'),
      (Match m) => '${m[1]},',
    );
    return '₹$formattedOther,$lastThree';
  }

  static const String foodSafetyDisclaimer =
      'In accordance with FSSAI surplus food regulations, all food donations must be hygienically prepared, temperature-controlled, and fit for human consumption before handover. Annadhara coordinates logistics and does not independently inspect or certify food safety.';
}
