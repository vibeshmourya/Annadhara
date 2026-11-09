class DonationModel {
  final String id;
  final String title;
  final String category;
  final String description;
  final double totalQuantity;
  final double availableQuantity;
  final double reservedQuantity;
  final double collectedQuantity;
  final String unit;
  final String storageHandling;
  final List<String> allergens;
  final String city;
  final String street;
  final DateTime pickupStartTime;
  final DateTime pickupEndTime;
  final String imageUrl;
  final String status;
  final String donorId;
  final String donorName;
  final String? organizationName;
  final double? distanceKm;

  DonationModel({
    required this.id,
    required this.title,
    required this.category,
    required this.description,
    required this.totalQuantity,
    required this.availableQuantity,
    this.reservedQuantity = 0,
    this.collectedQuantity = 0,
    required this.unit,
    required this.storageHandling,
    this.allergens = const [],
    required this.city,
    required this.street,
    required this.pickupStartTime,
    required this.pickupEndTime,
    this.imageUrl = '',
    required this.status,
    this.donorId = '',
    required this.donorName,
    this.organizationName,
    this.distanceKm,
  });

  factory DonationModel.fromJson(Map<String, dynamic> json) {
    String dName = 'Verified Donor';
    String dId = '';
    if (json['donor'] is Map) {
      dName = json['donor']['name'] ?? dName;
      dId = json['donor']['_id'] ?? json['donor']['id'] ?? '';
    } else if (json['donor'] is String) {
      dId = json['donor'];
    }

    String? oName;
    if (json['organization'] is Map) {
      oName = json['organization']['name'] ?? json['organization']['organizationName'];
    }

    String c = '';
    String s = '';
    if (json['pickupLocation'] is Map && json['pickupLocation']['address'] is Map) {
      c = json['pickupLocation']['address']['city'] ?? '';
      s = json['pickupLocation']['address']['street'] ?? '';
    }

    List<String> algs = [];
    if (json['allergens'] is List) {
      algs = (json['allergens'] as List).map((e) => e.toString()).toList();
    }

    return DonationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? 'cooked_meals',
      description: json['description'] ?? '',
      totalQuantity: (json['totalQuantity'] ?? 0).toDouble(),
      availableQuantity: (json['availableQuantity'] ?? 0).toDouble(),
      reservedQuantity: (json['reservedQuantity'] ?? 0).toDouble(),
      collectedQuantity: (json['collectedQuantity'] ?? 0).toDouble(),
      unit: json['unit'] ?? 'meals',
      storageHandling: json['storageHandling'] ?? 'room_temperature',
      allergens: algs,
      city: c,
      street: s,
      pickupStartTime: DateTime.tryParse(json['pickupStartTime'] ?? '') ?? DateTime.now(),
      pickupEndTime: DateTime.tryParse(json['pickupEndTime'] ?? '') ?? DateTime.now().add(const Duration(hours: 6)),
      imageUrl: json['imageUrl'] ?? '',
      status: json['status'] ?? 'available',
      donorId: dId,
      donorName: dName,
      organizationName: oName,
      distanceKm: json['distanceKm'] != null ? (json['distanceKm'] as num).toDouble() : null,
    );
  }
}
