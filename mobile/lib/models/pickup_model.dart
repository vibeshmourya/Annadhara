class PickupModel {
  final String id;
  final String donationTitle;
  final String donationUnit;
  final double requestedQuantity;
  final String status;
  final String pickupStreet;
  final String pickupCity;
  final String deliveryStreet;
  final String donorName;
  final String recipientName;
  final String? volunteerName;
  final String instructions;
  final DateTime pickupWindowEnd;

  PickupModel({
    required this.id,
    required this.donationTitle,
    required this.donationUnit,
    required this.requestedQuantity,
    required this.status,
    required this.pickupStreet,
    required this.pickupCity,
    required this.deliveryStreet,
    required this.donorName,
    required this.recipientName,
    this.volunteerName,
    this.instructions = '',
    required this.pickupWindowEnd,
  });

  factory PickupModel.fromJson(Map<String, dynamic> json) {
    String dTitle = 'Food Donation';
    String dUnit = 'units';
    if (json['donation'] is Map) {
      dTitle = json['donation']['title'] ?? dTitle;
      dUnit = json['donation']['unit'] ?? dUnit;
    }

    double qty = 0;
    if (json['reservation'] is Map) {
      qty = (json['reservation']['requestedQuantity'] ?? 0).toDouble();
    }

    String pStreet = '';
    String pCity = '';
    if (json['pickupAddress'] is Map) {
      pStreet = json['pickupAddress']['street'] ?? '';
      pCity = json['pickupAddress']['city'] ?? '';
    }

    String delStreet = '';
    if (json['deliveryAddress'] is Map) {
      delStreet = json['deliveryAddress']['street'] ?? '';
    }

    String dName = 'Donor';
    if (json['donor'] is Map) dName = json['donor']['name'] ?? dName;

    String rName = 'Recipient';
    if (json['recipient'] is Map) rName = json['recipient']['name'] ?? rName;

    String? vName;
    if (json['volunteer'] is Map) vName = json['volunteer']['name'];

    return PickupModel(
      id: json['_id'] ?? json['id'] ?? '',
      donationTitle: dTitle,
      donationUnit: dUnit,
      requestedQuantity: qty,
      status: json['status'] ?? 'pending',
      pickupStreet: pStreet,
      pickupCity: pCity,
      deliveryStreet: delStreet,
      donorName: dName,
      recipientName: rName,
      volunteerName: vName,
      instructions: json['instructions'] ?? '',
      pickupWindowEnd: DateTime.tryParse(json['pickupWindowEnd'] ?? '') ?? DateTime.now(),
    );
  }
}

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'system',
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

