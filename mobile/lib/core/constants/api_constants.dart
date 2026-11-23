import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Production deployed backend URL for Annadhara (Vercel Serverless / Cloud)
  static const String productionApiUrl = 'https://annadhara-i83w.vercel.app/api';
  static const String productionServerUrl = 'https://annadhara-i83w.vercel.app';

  // Allows passing compile-time overrides: --dart-define=API_BASE_URL=https://...
  static const String _configuredBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _configuredServerUrl = String.fromEnvironment('SERVER_URL');

  // Automatically select the correct endpoint:
  // - If compile-time define passed, use it
  // - If kReleaseMode (production APK), use deployed Vercel productionApiUrl
  // - If debug mode, use local dev server or emulator with fallback to production
  static String get baseUrl {
    if (_configuredBaseUrl.isNotEmpty) {
      return _configuredBaseUrl;
    }
    if (kReleaseMode) {
      return productionApiUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      }
    } catch (_) {}
    return productionApiUrl;
  }

  static String get serverRootUrl {
    if (_configuredServerUrl.isNotEmpty) {
      return _configuredServerUrl;
    }
    if (kReleaseMode) {
      return productionServerUrl;
    }
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000';
      }
    } catch (_) {}
    return productionServerUrl;
  }

  // Verified high-resolution authentic dish-specific food images
  static const Map<String, String> foodDishImages = {
    'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    'pulao': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    'fried_rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
    'curd_rice': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    'lemon_rice': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    'dal_rice': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    'sambar_rice': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    'rice_meals': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80',
    'veg_meals': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
    'roti_chapati': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
    'paratha': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80',
    'poori': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    'naan': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80',
    'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    'sambar': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80',
    'chicken_curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
    'curry_dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    'snacks': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    'noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
    'pasta': 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?w=800&auto=format&fit=crop&q=80',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    'sweets': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    'bread': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    'fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80',
    'vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    'packaged_food': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=800&auto=format&fit=crop&q=80',
    'beverages': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
    'default_meal': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80',
  };

  static const String defaultFoodImage =
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80';

  /// Resolves an exact, visually accurate dish image based on title and category.
  static String getFoodSpecificImage(String? title, [String? category]) {
    final t = (title ?? '').toLowerCase().trim();
    final c = (category ?? '').toLowerCase().trim();

    // 1. Biryani
    if (t.contains('biryani') || t.contains('briyani') || t.contains('biriyani')) {
      return foodDishImages['biryani']!;
    }

    // 2. Curd Rice
    if (t.contains('curd rice') || t.contains('thayir sadam') || t.contains('mosaranna') || t.contains('dahi chawal') || t.contains('dahi rice')) {
      return foodDishImages['curd_rice']!;
    }

    // 3. Lemon Rice / Tamarind Rice
    if (t.contains('lemon rice') || t.contains('chitranna') || t.contains('pulihora') || t.contains('puliyodharai') || t.contains('tamarind rice')) {
      return foodDishImages['lemon_rice']!;
    }

    // 4. Fried Rice
    if (t.contains('fried rice') || t.contains('schezwan rice') || t.contains('egg fried rice')) {
      return foodDishImages['fried_rice']!;
    }

    // 5. Pulao / Pilaf
    if (t.contains('pulao') || t.contains('pulav') || t.contains('pilaf') || t.contains('pehra')) {
      return foodDishImages['pulao']!;
    }

    // 6. Dal Rice / Rajma Chawal / Chole Chawal / Khichdi / Pongal / Bisi Bele Bath
    if (t.contains('dal rice') ||
        t.contains('dal chawal') ||
        t.contains('rajma chawal') ||
        t.contains('chole chawal') ||
        t.contains('khichdi') ||
        t.contains('pongal') ||
        t.contains('bisi bele bath') ||
        t.contains('sambar rice')) {
      return foodDishImages['dal_rice']!;
    }

    // 7. Paratha / Parotta / Aloo Paratha
    if (t.contains('paratha') || t.contains('parotta') || t.contains('pratha')) {
      return foodDishImages['paratha']!;
    }

    // 8. Poori / Puri / Bhature / Chole Bhature
    if (t.contains('poori') || t.contains('puri') || t.contains('bhature') || t.contains('bhatura')) {
      return foodDishImages['poori']!;
    }

    // 9. Chapati / Roti / Phulka / Naan / Kulcha
    if (t.contains('roti') || t.contains('chapati') || t.contains('chapatti') || t.contains('phulka') || t.contains('fulka') || t.contains('tandoori roti')) {
      return foodDishImages['roti_chapati']!;
    }
    if (t.contains('naan') || t.contains('kulcha')) {
      return foodDishImages['naan']!;
    }

    // 10. Dosa / Masala Dosa / Uttapam
    if (t.contains('dosa') || t.contains('dosai') || t.contains('uttapam') || t.contains('oothappam') || t.contains('pesrattu')) {
      return foodDishImages['dosa']!;
    }

    // 11. Idli / Steamed Idli / Thatte Idli / Vada
    if (t.contains('idli') || t.contains('idly') || t.contains('vada') || t.contains('vadai') || t.contains('medu vada')) {
      return foodDishImages['idli']!;
    }

    // 12. Sambar / Rasam
    if (t.contains('sambar') || t.contains('sambhar') || t.contains('rasam')) {
      return foodDishImages['sambar']!;
    }

    // 13. Paneer
    if (t.contains('paneer') || t.contains('panir')) {
      return foodDishImages['paneer']!;
    }

    // 14. Non-Veg Curries: Chicken, Mutton, Fish, Egg
    if (t.contains('chicken') ||
        t.contains('murgh') ||
        t.contains('mutton') ||
        t.contains('fish curry') ||
        t.contains('egg curry') ||
        t.contains('meat') ||
        t.contains('butter chicken')) {
      return foodDishImages['chicken_curry']!;
    }

    // 15. Dal / Lentils / Sambar / Curry
    if (t.contains('dal') || t.contains('daal') || t.contains('dhal') || t.contains('tadka') || t.contains('makhani') || t.contains('korma') || t.contains('kurma') || t.contains('curry') || t.contains('gravy')) {
      return foodDishImages['curry_dal']!;
    }

    // 16. Samosa / Pakora / Bhajiya / Vada Pav / Kachori
    if (t.contains('samosa') || t.contains('pakora') || t.contains('pakoda') || t.contains('bhajji') || t.contains('bhajiya') || t.contains('vada pav') || t.contains('kachori') || t.contains('dhokla')) {
      return foodDishImages['samosa']!;
    }

    // 17. Pizza
    if (t.contains('pizza') || t.contains('calzone')) {
      return foodDishImages['pizza']!;
    }

    // 18. Burger
    if (t.contains('burger') || t.contains('patty')) {
      return foodDishImages['burger']!;
    }

    // 19. Sandwich (exclude "sandwich bread" which is a loaf of bread)
    if (t.contains('sandwich bread') || t.contains('bread loaf') || t.contains('loaf of bread')) {
      return foodDishImages['bread']!;
    }
    if (t.contains('sandwich') || t.contains('toast') || t.contains('sub')) {
      return foodDishImages['sandwich']!;
    }

    // 20. Noodles / Chowmein / Pasta
    if (t.contains('noodle') || t.contains('noodles') || t.contains('chowmein') || t.contains('chow mein') || t.contains('maggi')) {
      return foodDishImages['noodles']!;
    }
    if (t.contains('pasta') || t.contains('macaroni') || t.contains('spaghetti') || t.contains('penne')) {
      return foodDishImages['pasta']!;
    }

    // 21. Cake / Pastry / Cupcake
    if (t.contains('cake') || t.contains('pastry') || t.contains('cupcake') || t.contains('muffin')) {
      return foodDishImages['cake']!;
    }

    // 22. Indian Sweets / Mithai
    if (t.contains('sweet') || t.contains('mithai') || t.contains('gulab jamun') || t.contains('laddu') || t.contains('halwa') || t.contains('jalebi') || t.contains('kheer') || t.contains('pedha') || t.contains('barfi')) {
      return foodDishImages['sweets']!;
    }

    // 23. Breads / Pav / Bakery
    if (t.contains('bread') || t.contains('pav') || t.contains('bun') || t.contains('buns') || t.contains('bakery') || t.contains('loaf')) {
      return foodDishImages['bread']!;
    }

    // 24. Fruits
    if (t.contains('fruit') || t.contains('fruits') || t.contains('apple') || t.contains('banana') || t.contains('orange') || t.contains('mango') || t.contains('grape') || t.contains('papaya')) {
      return foodDishImages['fruits']!;
    }

    // 25. Vegetables / Salad
    if (t.contains('vegetable') || t.contains('vegetables') || t.contains('veggie') || t.contains('salad') || t.contains('sabzi') || t.contains('subzi') || t.contains('tarkari')) {
      return foodDishImages['vegetables']!;
    }

    // 26. General Rice / Meals / Thali
    if (t.contains('thali') || t.contains('meal') || t.contains('meals') || t.contains('bhojan') || t.contains('oota')) {
      return foodDishImages['veg_meals']!;
    }
    if (t.contains('rice') || t.contains('chawal') || t.contains('anna')) {
      return foodDishImages['rice_meals']!;
    }

    // 27. Tea / Coffee / Beverages
    if (t.contains('tea') || t.contains('chai') || t.contains('coffee') || t.contains('juice') || t.contains('beverage') || t.contains('drink') || t.contains('lassi') || t.contains('buttermilk')) {
      return foodDishImages['beverages']!;
    }

    // Category fallbacks
    if (c == 'biryani') return foodDishImages['biryani']!;
    if (c == 'idli_dosa') return foodDishImages['idli']!;
    if (c == 'roti_chapati') return foodDishImages['roti_chapati']!;
    if (c == 'rice_meals') return foodDishImages['rice_meals']!;
    if (c == 'curry_dal') return foodDishImages['curry_dal']!;
    if (c == 'paneer') return foodDishImages['paneer']!;
    if (c == 'snacks') return foodDishImages['snacks']!;
    if (c == 'fruits' || c == 'produce_fresh') return foodDishImages['fruits']!;
    if (c == 'vegetables') return foodDishImages['vegetables']!;
    if (c == 'bakery_items' || c == 'bakery_grains') return foodDishImages['bread']!;
    if (c == 'packaged_food' || c == 'packaged_groceries' || c == 'groceries') return foodDishImages['packaged_food']!;
    if (c == 'beverages') return foodDishImages['beverages']!;
    if (c == 'cooked_meals') return foodDishImages['veg_meals']!;

    return foodDishImages['default_meal']!;
  }

  static String getCategoryFallbackImage(String? category, [String? title]) {
    return getFoodSpecificImage(title, category);
  }

  static String resolveImageUrl(String? url, [String? category, String? title]) {
    if (url == null || url.trim().isEmpty || url.contains('placeholder') || url.contains('default')) {
      return getFoodSpecificImage(title, category);
    }
    final trimmed = url.trim();

    // 1. Data URLs & Blob URLs (user upload preview)
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    // 2. Remote HTTP/HTTPS URLs
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      final isGenericStock = trimmed.contains('photo-1585937421612-70a008356fbe') ||
          trimmed.contains('photo-1546069901-ba9599a7e63c') ||
          (trimmed.contains('photo-1610057099443-fde8c4d50f91') &&
              (title == null || !title.toLowerCase().contains('rice')));

      if (isGenericStock && title != null && title.trim().isNotEmpty) {
        final specific = getFoodSpecificImage(title, category);
        if (specific != foodDishImages['default_meal']) {
          return specific;
        }
      }
      return trimmed;
    }

    // 3. Backend uploads (/uploads/...)
    final root = serverRootUrl;
    return '$root${trimmed.startsWith('/') ? '' : '/'}$trimmed';
  }

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // User & Profile
  static const String profile = '/users/profile';

  // Organizations
  static const String myOrg = '/organizations/me';
  static const String createOrg = '/organizations';

  // Donations
  static const String donations = '/donations';
  static const String myDonations = '/donations/my';

  // Reservations
  static const String reservations = '/reservations';

  // Pickups
  static const String pickups = '/pickups';

  // Handover
  static const String handoverConfirm = '/handover/confirm';

  // Notifications
  static const String notifications = '/notifications';

  // Dashboard stats
  static const String dashboardStats = '/dashboard/stats';

  // Upload
  static const String uploadImage = '/upload/image';

  // Admin
  static const String adminOrganizations = '/admin/organizations';
  static const String adminUsers = '/admin/users';
  static const String adminAuditLogs = '/admin/audit-logs';

  // AI Assistant endpoints
  static const String aiChat = '/ai/chat';
  static const String aiStatus = '/ai/status';
  static const String aiConversations = '/ai/conversations';
}
