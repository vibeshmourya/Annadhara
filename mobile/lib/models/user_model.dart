class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String phone;
  final String? organizationName;
  final String? organizationType;
  final String? verificationStatus;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone = '',
    this.organizationName,
    this.organizationType,
    this.verificationStatus,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? orgName;
    String? orgType;
    String? vStatus;

    if (json['organization'] is Map) {
      orgName = json['organization']['name'];
      orgType = json['organization']['type'];
      vStatus = json['organization']['verificationStatus'];
    }

    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'donor',
      phone: json['phone'] ?? '',
      organizationName: orgName,
      organizationType: orgType,
      verificationStatus: vStatus,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'organization': {
        'name': organizationName,
        'type': organizationType,
        'verificationStatus': verificationStatus,
      },
    };
  }

  bool get isDonor => role == 'donor';
  bool get isRecipient => role == 'recipient';
  bool get isVolunteer => role == 'volunteer';
  bool get isAdmin => role == 'admin';
}

