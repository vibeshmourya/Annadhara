class CitationModel {
  final String title;
  final String url;
  final String domain;
  final bool isOfficial;

  CitationModel({
    required this.title,
    required this.url,
    required this.domain,
    this.isOfficial = false,
  });

  factory CitationModel.fromJson(Map<String, dynamic> json) {
    return CitationModel(
      title: json['title'] ?? json['domain'] ?? 'Web Source',
      url: json['url'] ?? '',
      domain: json['domain'] ?? 'external',
      isOfficial: json['isOfficial'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'url': url,
      'domain': domain,
      'isOfficial': isOfficial,
    };
  }
}

class AiMessageModel {
  final String id;
  final String role; // 'user' or 'assistant'
  final String content;
  final DateTime timestamp;
  final String? intent;
  final List<CitationModel> citations;

  AiMessageModel({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.intent,
    this.citations = const [],
  });

  bool get isUser => role == 'user';

  factory AiMessageModel.fromJson(Map<String, dynamic> json) {
    final rawCitations = json['citations'];
    final List<CitationModel> parsedCitations = [];

    if (rawCitations is List) {
      for (final item in rawCitations) {
        if (item is Map<String, dynamic>) {
          parsedCitations.add(CitationModel.fromJson(item));
        } else if (item is String) {
          parsedCitations.add(
            CitationModel(
              title: item,
              url: item,
              domain: 'external',
              isOfficial: item.contains('gov.in') || item.contains('fssai'),
            ),
          );
        }
      }
    }

    return AiMessageModel(
      id: json['id'] ?? 'msg_${DateTime.now().millisecondsSinceEpoch}',
      role: json['role'] ?? 'assistant',
      content: json['content'] ?? json['message'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp']) ?? DateTime.now()
          : DateTime.now(),
      intent: json['intent'],
      citations: parsedCitations,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'intent': intent,
      'citations': citations.map((c) => c.toJson()).toList(),
    };
  }
}
