import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/donation_model.dart';

class DonationProvider with ChangeNotifier {
  List<DonationModel> _donations = [];
  List<DonationModel> _myDonations = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<DonationModel> get donations => _donations;
  List<DonationModel> get myDonations => _myDonations;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  Future<void> fetchDonations({String? category, String? search}) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final Map<String, String> query = {};
      if (category != null && category != 'all') query['category'] = category;
      if (search != null && search.isNotEmpty) query['search'] = search;

      final res = await ApiService.get(ApiConstants.donations, queryParams: query);
      if (res.success && res.data is List) {
        _donations = (res.data as List).map((e) => DonationModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchMyDonations() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.myDonations);
      if (res.success && res.data is List) {
        _myDonations = (res.data as List).map((e) => DonationModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createDonation(Map<String, dynamic> data) async {
    try {
      final res = await ApiService.post(ApiConstants.donations, data);
      if (res.success) {
        fetchDonations();
        fetchMyDonations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> updateDonation(String id, Map<String, dynamic> data) async {
    try {
      final res = await ApiService.put('${ApiConstants.donations}/$id', data);
      if (res.success) {
        fetchMyDonations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> cancelDonation(String id) async {
    try {
      final res = await ApiService.delete('${ApiConstants.donations}/$id');
      if (res.success) {
        fetchMyDonations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }
}
