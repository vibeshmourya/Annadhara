import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/pickup_model.dart';

class NotificationProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<NotificationModel> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.notifications);
      if (res.success && res.data != null) {
        if (res.data is List) {
          _notifications = (res.data as List).map((e) => NotificationModel.fromJson(e)).toList();
        }
      }
      _unreadCount = _notifications.where((n) => !n.isRead).length;
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAsRead(String id) async {
    try {
      await ApiService.patch('/notifications/$id/read', {});
      fetchNotifications();
    } catch (_) {}
  }

  Future<void> markAllAsRead() async {
    try {
      await ApiService.patch('/notifications/read-all', {});
      fetchNotifications();
    } catch (_) {}
  }
}
