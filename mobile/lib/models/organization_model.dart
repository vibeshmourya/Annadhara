class OrganizationModel {
  final String id;
  final String name;
  final String type;
  final String registrationNumber;
  final String email;
  final String phone;
  final String street;
  final String city;
  final String verificationStatus;
  final String? reviewerNotes;
  final DateTime createdAt;

  OrganizationModel({
    required this.id,
    required this.name,
    required this.type,
    this.registrationNumber = '',
    required this.email,
    this.phone = '',
    this.street = '',
    this.city = '',
    required this.verificationStatus,
    this.reviewerNotes,
    required this.createdAt,
  });

  factory OrganizationModel.fromJson(Map<String, dynamic> json) {
    String st = '';
    String ct = '';
    if (json['address'] is Map) {
      st = json['address']['street'] ?? '';
      ct = json['address']['city'] ?? '';
    }

    return OrganizationModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['organizationName'] ?? json['name'] ?? '',
      type: json['organizationType'] ?? json['type'] ?? 'NGO',
      registrationNumber: json['registrationNumber'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      street: st,
      city: ct,
      verificationStatus: json['verificationStatus'] ?? 'PENDING',
      reviewerNotes: json['reviewerNotes'],
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
    );
  }
}

