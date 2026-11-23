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

  static const String defaultFoodImage =
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80';

  static String getCategoryFallbackImage(String? category, [String? title]) {
    final text = '${title ?? ''} ${category ?? ''}'.toLowerCase();
    if (text.contains('biryani') || text.contains('pulao')) {
      return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('dosa')) {
      return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('idli') || text.contains('vada') || text.contains('sambar')) {
      return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('paneer')) {
      return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('roti') || text.contains('chapati') || text.contains('naan')) {
      return 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('fruit')) {
      return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('snack') || text.contains('samosa')) {
      return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80';
    }
    if (text.contains('rice') || text.contains('meal')) {
      return 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80';
    }
    return defaultFoodImage;
  }

  static String resolveImageUrl(String? url, [String? category, String? title]) {
    if (url == null || url.trim().isEmpty || url.contains('placeholder')) {
      return getCategoryFallbackImage(category, title);
    }
    final trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
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
