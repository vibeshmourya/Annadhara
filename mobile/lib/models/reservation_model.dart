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
    this.requestNotes = '',
    this.donorNotes = '',
    required this.createdAt,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    String dTitle = 'Food Donation';
    String dId = '';
    String dUnit = 'units';
    if (json['donation'] is Map) {
      dTitle = json['donation']['title'] ?? dTitle;
      dId = json['donation']['_id'] ?? json['donation']['id'] ?? '';
      dUnit = json['donation']['unit'] ?? dUnit;
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
      requestNotes: json['requestNotes'] ?? '',
      donorNotes: json['donorNotes'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

