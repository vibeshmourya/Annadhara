class AuditLogModel {
  final String id;
  final String action;
  final String userName;
  final String userRole;
  final String entityType;
  final String details;
  final DateTime timestamp;

  AuditLogModel({
    required this.id,
    required this.action,
    required this.userName,
    required this.userRole,
    required this.entityType,
    required this.details,
    required this.timestamp,
  });

  factory AuditLogModel.fromJson(Map<String, dynamic> json) {
    String uName = 'System';
    String uRole = '';
    if (json['user'] is Map) {
      uName = json['user']['name'] ?? 'System';
      uRole = json['user']['role'] ?? '';
    } else if (json['role'] != null) {
      uRole = json['role'];
    }

    String det = '';
    if (json['details'] != null) {
      det = json['details'].toString();
    }

    return AuditLogModel(
      id: json['_id'] ?? json['id'] ?? '',
      action: json['action'] ?? '',
      userName: uName,
      userRole: uRole,
      entityType: json['entityType'] ?? '',
      details: det,
      timestamp: DateTime.tryParse(json['createdAt'] ?? json['timestamp'] ?? '') ?? DateTime.now(),
    );
  }
}

