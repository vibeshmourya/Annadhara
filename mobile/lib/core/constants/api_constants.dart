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

  // Admin
  static const String adminOrganizations = '/admin/organizations';
  static const String adminUsers = '/admin/users';
  static const String adminAuditLogs = '/admin/audit-logs';
}
