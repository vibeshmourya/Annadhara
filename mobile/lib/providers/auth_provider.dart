import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../core/storage/storage_service.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = true;
  String _errorMessage = '';

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  AuthProvider() {
    loadSavedUser();
  }

  Future<void> loadSavedUser() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await StorageService.getToken();
      final userJson = await StorageService.getUserJson();

      if (token != null && userJson != null) {
        _user = UserModel.fromJson(jsonDecode(userJson));
        // Verify with /api/auth/me
        final res = await ApiService.get(ApiConstants.me);
        if (res.success && res.data != null) {
          final userData = res.data is Map && res.data['user'] != null ? res.data['user'] : res.data;
          _user = UserModel.fromJson(userData);
          await StorageService.saveUserJson(jsonEncode(_user!.toJson()));
        }
      }
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await ApiService.post(ApiConstants.login, {
        'email': email,
        'password': password,
      });

      if (res.success && res.data != null) {
        final token = res.data['token'];
        final userData = res.data['user'];

        await StorageService.saveToken(token);
        _user = UserModel.fromJson(userData);
        await StorageService.saveUserJson(jsonEncode(_user!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String role,
    required String phone,
    String? organizationName,
    String? organizationType,
    String? registrationNumber,
    String? street,
    String? city,
  }) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final Map<String, dynamic> body = {
        'name': name,
        'email': email,
        'password': password,
        'role': role.toUpperCase(),
        'phone': phone,
      };

      if (street != null || city != null) {
        body['address'] = {
          'street': street ?? '',
          'city': city ?? '',
        };
      }

      if (organizationName != null && organizationName.isNotEmpty) {
        body['organizationName'] = organizationName;
        body['organizationType'] = organizationType ?? 'Restaurant';
        if (registrationNumber != null && registrationNumber.isNotEmpty) {
          body['registrationNumber'] = registrationNumber;
        }
      }

      final res = await ApiService.post(ApiConstants.register, body);

      if (res.success && res.data != null) {
        final token = res.data['token'];
        final userData = res.data['user'];

        await StorageService.saveToken(token);
        _user = UserModel.fromJson(userData);
        await StorageService.saveUserJson(jsonEncode(_user!.toJson()));

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateProfile({required String name, required String phone}) async {
    try {
      final res = await ApiService.put(ApiConstants.profile, {
        'name': name,
        'phone': phone,
      });

      if (res.success && res.data != null) {
        final userData = res.data is Map && res.data['user'] != null ? res.data['user'] : res.data;
        _user = UserModel.fromJson(userData);
        await StorageService.saveUserJson(jsonEncode(_user!.toJson()));
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> createOrganization({
    required String name,
    required String type,
    String? registrationNumber,
    String? street,
    String? city,
  }) async {
    try {
      final body = {
        'name': name,
        'type': type,
        'registrationNumber': registrationNumber ?? '',
        'address': {
          'street': street ?? '',
          'city': city ?? '',
        },
      };

      final res = await ApiService.post(ApiConstants.createOrg, body);
      if (res.success) {
        await loadSavedUser();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<void> logout() async {
    try {
      await ApiService.post(ApiConstants.logout, {});
    } catch (_) {}
    await StorageService.clearAuth();
    _user = null;
    notifyListeners();
  }
}
