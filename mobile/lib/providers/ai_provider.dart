import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_service.dart';
import '../models/ai_message_model.dart';

class AiProvider with ChangeNotifier {
  final List<AiMessageModel> _messages = [];
  bool _isLoading = false;
  String? _error;
  String _language = 'en'; // 'en', 'kn', 'hi'
  String? _conversationId;
  List<Map<String, dynamic>> _conversations = [];
  bool _isLoadingHistory = false;

  List<AiMessageModel> get messages => List.unmodifiable(_messages);
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get language => _language;
  String? get conversationId => _conversationId;
  List<Map<String, dynamic>> get conversations => List.unmodifiable(_conversations);
  bool get isLoadingHistory => _isLoadingHistory;

  static const Map<String, String> _welcomeGreetings = {
    'en': "Hello! I'm **Annadhara AI**, your intelligent platform assistant. I can help you understand food donation processes, find relevant food safety information and access information available to your Annadhara account.",
    'kn': "ನಮಸ್ಕಾರ! ನಾನು **ಅನ್ನಧಾರ AI**, ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ವೇದಿಕೆ ಸಹಾಯಕ. ಆಹಾರ ದಾನ ಪ್ರಕ್ರಿಯೆಗಳು, ಆಹಾರ ಸುರಕ್ಷತೆ ಮಾರ್ಗಸೂಚಿಗಳು ಮತ್ತು ನಿಮ್ಮ ಖಾತೆಗೆ ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    'hi': "नमस्ते! मैं **अन्नधारा AI** हूँ, आपका बुद्धिमान प्लेटफ़ॉर्म सहायक। मैं भोजन दान प्रक्रियाओं, खाद्य सुरक्षा दिशानिर्देशों और आपके अन्नधारा खाते की जानकारी प्राप्त करने में आपकी सहायता कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?",
  };

  AiProvider() {
    _initWelcomeMessage();
  }

  void _initWelcomeMessage() {
    _messages.clear();
    _messages.add(
      AiMessageModel(
        id: 'welcome',
        role: 'assistant',
        content: _welcomeGreetings[_language] ?? _welcomeGreetings['en']!,
        timestamp: DateTime.now(),
      ),
    );
  }

  void setLanguage(String lang) {
    if (lang != _language && (lang == 'en' || lang == 'kn' || lang == 'hi')) {
      _language = lang;
      if (_messages.length == 1 && _messages.first.id == 'welcome') {
        _initWelcomeMessage();
      }
      notifyListeners();
    }
  }

  void startNewChat() {
    _conversationId = null;
    _error = null;
    _initWelcomeMessage();
    notifyListeners();
  }

  Future<void> fetchConversations() async {
    _isLoadingHistory = true;
    notifyListeners();

    try {
      final res = await ApiService.get(ApiConstants.aiConversations);
      if (res.success && res.data is List) {
        _conversations = (res.data as List)
            .map((item) => item is Map<String, dynamic> ? item : <String, dynamic>{})
            .toList();
      }
    } catch (e) {
      debugPrint('[AiProvider] Failed to fetch conversations: $e');
    } finally {
      _isLoadingHistory = false;
      notifyListeners();
    }
  }

  Future<void> loadConversation(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await ApiService.get('${ApiConstants.aiConversations}/$id');
      if (res.success && res.data is Map<String, dynamic>) {
        final data = res.data as Map<String, dynamic>;
        _conversationId = data['id']?.toString() ?? id;
        if (data['language'] != null) {
          _language = data['language'].toString();
        }

        final rawMsgs = data['messages'];
        _messages.clear();

        if (rawMsgs is List && rawMsgs.isNotEmpty) {
          for (final m in rawMsgs) {
            if (m is Map<String, dynamic>) {
              _messages.add(AiMessageModel.fromJson(m));
            }
          }
        } else {
          _initWelcomeMessage();
        }
      } else {
        _error = 'Failed to load conversation details.';
      }
    } catch (e) {
      _error = 'Error loading conversation: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteConversation(String id) async {
    try {
      final res = await ApiService.delete('${ApiConstants.aiConversations}/$id');
      if (res.success) {
        _conversations.removeWhere((c) => c['id']?.toString() == id);
        if (_conversationId == id) {
          startNewChat();
        } else {
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('[AiProvider] Error deleting conversation: $e');
    }
  }

  List<String> getSuggestedQuestions(String? role) {
    final r = (role ?? '').toLowerCase();
    if (_language == 'kn') {
      switch (r) {
        case 'donor':
          return const [
            'ಆಹಾರ ದಾನವನ್ನು ಹೇಗೆ ಪ್ರಕಟಿಸುವುದು?',
            'ಆಹಾರ ಪಟ್ಟಿಯಲ್ಲಿ ಯಾವ ವಿವರಗಳನ್ನು ಸೇರಿಸಬೇಕು?',
            'ಎನ್‌ಜಿಒ ನನ್ನ ದಾನವನ್ನು ಕಾಯ್ದಿರಿಸಿದಾಗ ಏನಾಗುತ್ತದೆ?',
            'ಬಿಸಿ ಆಹಾರ ಸುರಕ್ಷತಾ ತಾಪಮಾನಗಳು ಯಾವುವು?',
          ];
        case 'volunteer':
          return const [
            'ಬೇಯಿಸಿದ ಆಹಾರವನ್ನು ಸಾಗಿಸುವ ಮೊದಲು ನಾನು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?',
            'OTP ಅಥವಾ QR ಮೂಲಕ ಆಹಾರ ಹಸ್ತಾಂತರವನ್ನು ಹೇಗೆ ದೃಢೀಕರಿಸುವುದು?',
            'ದಾನಿಗಳ ಪಿಕಪ್ ವಿಫಲವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?',
            'ಅನ್ನಧಾರ ಪಿಕಪ್ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
          ];
        case 'admin':
          return const [
            'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಹಾರ ಸುರಕ್ಷತಾ ಮಾನದಂಡಗಳು ಯಾವುವು?',
            'ಎನ್‌ಜಿಒ ಪರಿಶೀಲನೆ ಪ್ರಕ್ರಿಯೆ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
            'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಅಂಕಿಅಂಶಗಳ ವಿವರ ನೀಡಿ',
            'ಹಸ್ತಾಂತರ ವಿವಾದ ಲಾಗ್‌ಗಳನ್ನು ಹೇಗೆ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತದೆ?',
          ];
        case 'recipient':
        default:
          return const [
            'ಲಭ್ಯವಿರುವ ಆಹಾರ ದಾನಗಳನ್ನು ಹೇಗೆ ಕಂಡುಹಿಡಿಯುವುದು?',
            '6-ಅಕ್ಷರಗಳ ಹಸ್ತಾಂತರ ಕೋಡ್ (Handover Code) ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
            'ಎನ್‌ಜಿಒ ಪರಿಶೀಲನೆ ಏಕೆ ಅಗತ್ಯವಿದೆ?',
            'ಸ್ವಯಂಸೇವಕ ಸಾರಿಗೆಯನ್ನು ಹೇಗೆ ವಿನಂತಿಸುವುದು?',
          ];
      }
    } else if (_language == 'hi') {
      switch (r) {
        case 'donor':
          return const [
            'भोजन दान कैसे प्रकाशित करें?',
            'भोजन सूची में क्या जानकारी शामिल करनी चाहिए?',
            'जब कोई एनजीओ मेरे दान को आरक्षित करता है तो क्या होता है?',
            'भोजन को सुरक्षित रखने के तापमान क्या हैं?',
          ];
        case 'volunteer':
          return const [
            'पका हुआ भोजन ले जाने से पहले क्या जांचना चाहिए?',
            'OTP या QR से भोजन हैंडओवर कैसे सत्यापित करें?',
            'यदि डोनर पिकअप विफल हो जाए तो क्या करें?',
            'अन्नधारा पिकअप वर्कफ़्लो कैसे काम करता है?',
          ];
        case 'admin':
          return const [
            'खाद्य सुरक्षा अनुपालन मानक क्या हैं?',
            'एनजीओ सत्यापन समीक्षा प्रक्रिया कैसे काम करती है?',
            'प्लेटफ़ॉर्म के वर्तमान आंकड़े क्या हैं?',
            'हैंडओवर विवाद लॉग की निगरानी कैसे की जाती है?',
          ];
        case 'recipient':
        default:
          return const [
            'उपलब्ध भोजन दान कैसे खोजें?',
            '6-अंकीय हैंडओवर कोड कैसे काम करता है?',
            'एनजीओ को प्लेटफ़ॉर्म सत्यापन की आवश्यकता क्यों है?',
            'भोजन के लिए स्वयंसेवक परिवहन का अनुरोध कैसे करें?',
          ];
      }
    }

    // Default English
    switch (r) {
      case 'donor':
        return const [
          'How can I publish a food donation?',
          'What information should I include in a food listing?',
          'What happens when an NGO reserves my donation?',
          'What are proper hot-holding food temperatures?',
        ];
      case 'volunteer':
        return const [
          'What should I check before transporting cooked food?',
          'How do I verify a food handover with OTP or QR?',
          'What should I do if a donor pickup fails?',
          'How does the Annadhara pickup workflow operate?',
        ];
      case 'admin':
        return const [
          'What are platform food safety compliance standards?',
          'How does the NGO verification review process work?',
          'What are the zero-waste inventory mathematical invariants?',
          'How are handover dispute logs monitored?',
        ];
      case 'recipient':
      default:
        return const [
          'How do I find available food donations?',
          'How does the 6-character Handover Code work?',
          'Why does an NGO need platform verification?',
          'How to request volunteer transport for a donation?',
        ];
    }
  }

  Future<void> sendMessage(String text) async {
    final trimmed = text.trim();
    if (trimmed.isEmpty || _isLoading) return;

    _error = null;

    final userMsg = AiMessageModel(
      id: 'usr_${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: trimmed,
      timestamp: DateTime.now(),
    );

    _messages.add(userMsg);
    _isLoading = true;
    notifyListeners();

    try {
      // Free-tier optimization: limit history to last 4 turns
      final nonWelcome = _messages.where((m) => m.id != 'welcome').toList();
      final history = (nonWelcome.length > 4 ? nonWelcome.sublist(nonWelcome.length - 4) : nonWelcome)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();

      final payload = {
        'message': trimmed,
        'language': _language,
        if (_conversationId != null) 'conversationId': _conversationId,
        'conversationHistory': history,
      };

      final response = await ApiService.post(ApiConstants.aiChat, payload);

      if (response.success && response.data != null) {
        final data = response.data is Map<String, dynamic>
            ? response.data as Map<String, dynamic>
            : <String, dynamic>{};

        if (data['conversationId'] != null && _conversationId == null) {
          _conversationId = data['conversationId'].toString();
        }
        if (data['language'] != null && data['language'] != _language) {
          _language = data['language'].toString();
        }

        final aiMsg = AiMessageModel.fromJson(data);
        _messages.add(aiMsg);
      } else {
        if (response.statusCode == 429) {
          _error = 'Annadhara AI request limit reached. Please wait a moment before trying again.';
        } else {
          _error = response.message.isNotEmpty
              ? response.message
              : 'Unable to connect to Annadhara AI right now. Please check your internet connection.';
        }
      }
    } catch (e) {
      _error = 'Unable to connect to Annadhara AI. Please check your internet connection and try again.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> retryLastMessage() async {
    final lastUserIndex = _messages.lastIndexWhere((m) => m.role == 'user');
    if (lastUserIndex != -1) {
      final lastUserContent = _messages[lastUserIndex].content;
      _messages.removeAt(lastUserIndex);
      await sendMessage(lastUserContent);
    }
  }

  void clearChat() {
    startNewChat();
  }
}
