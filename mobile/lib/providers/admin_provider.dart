import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/organization_model.dart';
import '../models/audit_log_model.dart';

class AdminProvider with ChangeNotifier {
  List<OrganizationModel> _organizations = [];
  List<AuditLogModel> _auditLogs = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<OrganizationModel> get organizations => _organizations;
  List<AuditLogModel> get auditLogs => _auditLogs;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  Future<void> fetchOrganizations() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.adminOrganizations);
      if (res.success && res.data is List) {
        _organizations = (res.data as List).map((e) => OrganizationModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> verifyOrganization(String id, String status, {String? reason}) async {
    try {
      final res = await ApiService.patch('${ApiConstants.adminOrganizations}/$id/verify', {
        'status': status,
        'reviewerNotes': reason ?? '',
      });
      if (res.success) {
        await fetchOrganizations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<void> fetchAuditLogs() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.adminAuditLogs);
      if (res.success && res.data is List) {
        _auditLogs = (res.data as List).map((e) => AuditLogModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }
}

