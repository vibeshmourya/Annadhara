import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/reservation_model.dart';
import '../models/pickup_model.dart';

class ActivityProvider with ChangeNotifier {
  List<ReservationModel> _reservations = [];
  List<PickupModel> _availablePickups = [];
  List<PickupModel> _myPickups = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<ReservationModel> get reservations => _reservations;
  List<PickupModel> get availablePickups => _availablePickups;
  List<PickupModel> get myPickups => _myPickups;
  List<PickupModel> get pickups => _myPickups.isNotEmpty ? _myPickups : _availablePickups;
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

  Future<void> fetchPickups() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      // Fetch available unassigned tasks
      final availRes = await ApiService.get(ApiConstants.pickups, queryParams: {'view': 'available'});
      if (availRes.success && availRes.data is List) {
        _availablePickups = (availRes.data as List).map((e) => PickupModel.fromJson(e)).toList();
      }

      // Fetch claimed / active tasks
      final myRes = await ApiService.get(ApiConstants.pickups, queryParams: {'view': 'my'});
      if (myRes.success && myRes.data is List) {
        _myPickups = (myRes.data as List).map((e) => PickupModel.fromJson(e)).toList();
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
        await fetchReservations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> updateReservationStatus(String reservationId, String status, {String? notes}) async {
    try {
      final res = await ApiService.patch('${ApiConstants.reservations}/$reservationId/status', {
        'status': status,
        'donorNotes': notes ?? '',
      });
      if (res.success) {
        await fetchReservations();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> cancelReservation(String reservationId, {String? reason}) async {
    try {
      final res = await ApiService.post('${ApiConstants.reservations}/$reservationId/cancel', {
        'reason': reason ?? 'Cancelled by user',
      });
      if (res.success) {
        await fetchReservations();
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
        await fetchPickups();
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
        await fetchPickups();
        return true;
      } else {
        _errorMessage = res.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> confirmHandover(String reservationId, String code, {String? notes, String method = 'code'}) async {
    try {
      final res = await ApiService.post(ApiConstants.handoverConfirm, {
        'reservationId': reservationId,
        'handoverCode': code,
        'notes': notes ?? 'Verified via FoodBridge mobile application',
        'verificationMethod': method,
      });
      if (res.success) {
        await fetchReservations();
        await fetchPickups();
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
