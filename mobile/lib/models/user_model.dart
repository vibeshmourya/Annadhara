class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String phone;
  final String? organizationId;
  final String? organizationName;
  final String? organizationType;
  final String? verificationStatus;
  final String? reviewerNotes;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone = '',
    this.organizationId,
    this.organizationName,
    this.organizationType,
    this.verificationStatus,
    this.reviewerNotes,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    String? orgId;
    String? orgName;
    String? orgType;
    String? vStatus;
    String? rNotes;

    // Check organizationId if populated object
    if (json['organizationId'] is Map) {
      final org = json['organizationId'];
      orgId = org['_id'] ?? org['id'];
      orgName = org['organizationName'] ?? org['name'];
      orgType = org['organizationType'] ?? org['type'];
      vStatus = org['verificationStatus'];
      rNotes = org['reviewerNotes'];
    } else if (json['organizationId'] is String) {
      orgId = json['organizationId'];
    }

    // Check organization if populated object
    if (json['organization'] is Map) {
      final org = json['organization'];
      orgId ??= org['_id'] ?? org['id'];
      orgName ??= org['organizationName'] ?? org['name'];
      orgType ??= org['organizationType'] ?? org['type'];
      vStatus ??= org['verificationStatus'];
      rNotes ??= org['reviewerNotes'];
    }

    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: (json['role'] ?? 'DONOR').toString().toUpperCase(),
      phone: json['phone'] ?? '',
      organizationId: orgId,
      organizationName: orgName,
      organizationType: orgType,
      verificationStatus: vStatus,
      reviewerNotes: rNotes,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'phone': phone,
      'organizationId': organizationId,
      'organization': {
        'id': organizationId,
        'name': organizationName,
        'type': organizationType,
        'verificationStatus': verificationStatus,
        'reviewerNotes': reviewerNotes,
      },
    };
  }

  bool get isDonor => role == 'DONOR';
  bool get isRecipient => role == 'RECIPIENT';
  bool get isVolunteer => role == 'VOLUNTEER';
  bool get isAdmin => role == 'ADMIN';
}
