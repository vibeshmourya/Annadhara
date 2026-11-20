import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Automatically choose localhost for iOS/Web/Desktop, or 10.0.2.2 for Android emulator
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000/api';
      }
    } catch (_) {}
    return 'http://localhost:5000/api';
  }

  static String get serverRootUrl {
    if (kIsWeb) {
      return 'http://localhost:5000';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:5000';
      }
    } catch (_) {}
    return 'http://localhost:5000';
  }

  static String resolveImageUrl(String? url) {
    if (url == null || url.trim().isEmpty) {
      return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
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
}
