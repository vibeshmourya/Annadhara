class ReservationModel {
  final String id;
  final String donationId;
  final String donationTitle;
  final String donationUnit;
  final double requestedQuantity;
  final String status;
  final String handoverCode;
  final String donorName;
  final String recipientName;
  final String recipientOrgName;
  final String pickupStreet;
  final String pickupCity;
  final String requestNotes;
  final String donorNotes;
  final DateTime createdAt;

  ReservationModel({
    required this.id,
    required this.donationId,
    required this.donationTitle,
    required this.donationUnit,
    required this.requestedQuantity,
    required this.status,
    required this.handoverCode,
    required this.donorName,
    required this.recipientName,
    this.recipientOrgName = '',
    this.pickupStreet = '',
    this.pickupCity = '',
    this.requestNotes = '',
    this.donorNotes = '',
    required this.createdAt,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    String dTitle = 'Food Donation';
    String dId = '';
    String dUnit = 'meals';
    String pStreet = '';
    String pCity = '';

    if (json['donation'] is Map) {
      final don = json['donation'];
      dTitle = don['title'] ?? dTitle;
      dId = don['_id'] ?? don['id'] ?? '';
      dUnit = don['unit'] ?? dUnit;
      if (don['pickupLocation'] is Map && don['pickupLocation']['address'] is Map) {
        pStreet = don['pickupLocation']['address']['street'] ?? '';
        pCity = don['pickupLocation']['address']['city'] ?? '';
      }
    } else if (json['donation'] is String) {
      dId = json['donation'];
    }

    String dName = 'Donor';
    if (json['donor'] is Map) {
      dName = json['donor']['name'] ?? dName;
    }

    String rName = 'Recipient';
    if (json['recipient'] is Map) {
      rName = json['recipient']['name'] ?? rName;
    }

    String rOrgName = '';
    if (json['recipientOrg'] is Map) {
      rOrgName = json['recipientOrg']['name'] ?? json['recipientOrg']['organizationName'] ?? '';
    }

    return ReservationModel(
      id: json['_id'] ?? json['id'] ?? '',
      donationId: dId,
      donationTitle: dTitle,
      donationUnit: json['unit'] ?? dUnit,
      requestedQuantity: (json['requestedQuantity'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      handoverCode: json['handoverCode'] ?? '',
      donorName: dName,
      recipientName: rName,
      recipientOrgName: rOrgName,
      pickupStreet: pStreet,
      pickupCity: pCity,
      requestNotes: json['requestNotes'] ?? '',
      donorNotes: json['donorNotes'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}
