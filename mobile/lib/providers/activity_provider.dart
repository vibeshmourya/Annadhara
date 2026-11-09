import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/reservation_model.dart';
import '../models/pickup_model.dart';

class ActivityProvider with ChangeNotifier {
  List<ReservationModel> _reservations = [];
  List<PickupModel> _pickups = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<ReservationModel> get reservations => _reservations;
  List<PickupModel> get pickups => _pickups;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  Future<void> fetchReservations() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.reservations);
      if (res.success && res.data is List) {
        _reservations = (res.data as List).map((e) => ReservationModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchPickups({String? view}) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final Map<String, String> query = {};
      if (view != null) query['view'] = view;

      final res = await ApiService.get(ApiConstants.pickups, queryParams: query);
      if (res.success && res.data is List) {
        _pickups = (res.data as List).map((e) => PickupModel.fromJson(e)).toList();
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createReservation(String donationId, double quantity, String notes) async {
    try {
      final res = await ApiService.post(ApiConstants.reservations, {
        'donationId': donationId,
        'requestedQuantity': quantity,
        'requestNotes': notes,
      });
      if (res.success) {
        fetchReservations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> confirmHandover(String reservationId, String code, String notes) async {
    try {
      final res = await ApiService.post(ApiConstants.handoverConfirm, {
        'reservationId': reservationId,
        'handoverCode': code,
        'notes': notes,
      });
      if (res.success) {
        fetchReservations();
        fetchPickups();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> claimPickup(String taskId) async {
    try {
      final res = await ApiService.post('/pickups/$taskId/claim', {});
      if (res.success) {
        fetchPickups();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> updatePickupStatus(String taskId, String status) async {
    try {
      final res = await ApiService.patch('/pickups/$taskId/status', {
        'status': status,
      });
      if (res.success) {
        fetchPickups();
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

