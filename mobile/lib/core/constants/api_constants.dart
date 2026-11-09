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

  // Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String me = '/auth/me';
  static const String updateProfile = '/auth/profile';

  static const String donations = '/donations';
  static const String myDonations = '/donations/my-donations';
  static const String reservations = '/reservations';
  static const String pickups = '/pickups';
  static const String handoverConfirm = '/handover/confirm';
  static const String notifications = '/notifications';
  static const String dashboardStats = '/dashboard/stats';
}

