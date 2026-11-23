import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/colors.dart';
import '../../providers/ai_provider.dart';
import '../../providers/auth_provider.dart';
import 'widgets/citation_widget.dart';

class AnnadharaAiScreen extends StatefulWidget {
  const AnnadharaAiScreen({super.key});

  @override
  State<AnnadharaAiScreen> createState() => _AnnadharaAiScreenState();
}

class _AnnadharaAiScreenState extends State<AnnadharaAiScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSend(AiProvider aiProvider, [String? text]) {
    final query = text ?? _controller.text;
    if (query.trim().isEmpty) return;

    if (text == null) {
      _controller.clear();
    }

    aiProvider.sendMessage(query);
    _scrollToBottom();
  }

  void _showHistoryBottomSheet(BuildContext context, AiProvider ai) {
    ai.fetchConversations();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Consumer<AiProvider>(
          builder: (context, provider, child) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.65,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  // Handle
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 10),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),

                  // Header
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.history_rounded, color: AppColors.primaryGreen, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Conversation History',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryText,
                              ),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          onPressed: () {
                            Navigator.pop(ctx);
                            provider.startNewChat();
                          },
                          icon: const Icon(Icons.add, size: 16, color: AppColors.primaryGreen),
                          label: const Text(
                            'New Chat',
                            style: TextStyle(
                              color: AppColors.primaryGreen,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),

                  // Conversations List
                  Expanded(
                    child: provider.isLoadingHistory
                        ? const Center(child: CircularProgressIndicator())
                        : provider.conversations.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.chat_bubble_outline,
                                          size: 40, color: Colors.grey.shade400),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'No saved conversations',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.primaryText,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        'Your conversation turns will automatically appear here.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            : ListView.builder(
                                itemCount: provider.conversations.length,
                                itemBuilder: (c, idx) {
                                  final conv = provider.conversations[idx];
                                  final id = conv['id']?.toString() ?? '';
                                  final title = conv['title']?.toString() ?? 'Conversation';
                                  final lang = conv['language']?.toString().toUpperCase() ?? 'EN';
                                  final isCurrent = provider.conversationId == id;

                                  return ListTile(
                                    contentPadding:
                                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                    leading: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isCurrent
                                            ? AppColors.lightGreen
                                            : Colors.grey.shade100,
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: isCurrent
                                              ? AppColors.primaryGreen
                                              : Colors.grey.shade300,
                                        ),
                                      ),
                                      child: Text(
                                        lang,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: isCurrent
                                              ? AppColors.primaryGreen
                                              : AppColors.secondaryText,
                                        ),
                                      ),
                                    ),
                                    title: Text(
                                      title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                                        color: AppColors.primaryText,
                                      ),
                                    ),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete_outline,
                                          size: 18, color: Colors.grey),
                                      onPressed: () => provider.deleteConversation(id),
                                    ),
                                    onTap: () {
                                      Navigator.pop(ctx);
                                      provider.loadConversation(id);
                                    },
                                  );
                                },
                              ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final ai = Provider.of<AiProvider>(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final userRole = auth.user?.role ?? 'MEMBER';
    final suggestions = ai.getSuggestedQuestions(userRole);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.auto_awesome,
                color: AppColors.primaryGreen,
                size: 20,
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Annadhara AI',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primaryText,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryGreen,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Online • $userRole',
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.secondaryText,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Language Switcher Menu
          PopupMenuButton<String>(
            icon: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.language, size: 14, color: AppColors.primaryGreen),
                  const SizedBox(width: 4),
                  Text(
                    ai.language.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryGreen,
                    ),
                  ),
                ],
              ),
            ),
            tooltip: 'Select Language',
            onSelected: (lang) => ai.setLanguage(lang),
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'en',
                child: Text('English', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ),
              PopupMenuItem(
                value: 'kn',
                child: Text('ಕನ್ನಡ (Kannada)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ),
              PopupMenuItem(
                value: 'hi',
                child: Text('हिन्दी (Hindi)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ],
          ),

          // Conversation History Button
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.secondaryText),
            tooltip: 'Conversation History',
            onPressed: () => _showHistoryBottomSheet(context, ai),
          ),

          // New Chat Button
          IconButton(
            icon: const Icon(Icons.add_comment_outlined, color: AppColors.secondaryText),
            tooltip: 'New Chat',
            onPressed: () => ai.startNewChat(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: ai.messages.length + (ai.isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == ai.messages.length && ai.isLoading) {
                  return _buildTypingIndicator();
                }

                final msg = ai.messages[index];
                return _buildMessageItem(msg);
              },
            ),
          ),

          // Error notification if present
          if (ai.error != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      ai.error!,
                      style: const TextStyle(color: Colors.red, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

          // Suggested Questions (if only welcome message)
          if (ai.messages.length == 1) _buildSuggestedQuestions(ai, userRole, suggestions),

          // Input Bar
          _buildInputBar(ai),
        ],
      ),
    );
  }

  Widget _buildMessageItem(dynamic msg) {
    final isUser = msg.isUser;
    final citations = msg.citations ?? [];

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.lightGreen,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.primaryGreen.withOpacity(0.2)),
              ),
              child: const Icon(Icons.auto_awesome, color: AppColors.primaryGreen, size: 14),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primaryGreen : AppColors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
                border: isUser ? null : Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    msg.content,
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isUser ? Colors.white : AppColors.primaryText,
                    ),
                  ),
                  if (!isUser && citations.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: CitationWidget(citations: citations),
                    ),
                  const SizedBox(height: 4),
                  Align(
                    alignment: Alignment.bottomRight,
                    child: Text(
                      '${msg.timestamp.hour.toString().padLeft(2, '0')}:${msg.timestamp.minute.toString().padLeft(2, '0')}',
                      style: TextStyle(
                        fontSize: 9,
                        color: isUser ? Colors.white70 : AppColors.secondaryText,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.person, color: Colors.white, size: 14),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.lightGreen,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.primaryGreen.withOpacity(0.2)),
            ),
            child: const Icon(Icons.auto_awesome, color: AppColors.primaryGreen, size: 14),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen),
                ),
                SizedBox(width: 8),
                Text(
                  'Annadhara AI is thinking...',
                  style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestedQuestions(AiProvider ai, String userRole, List<String> suggestions) {
    final title = ai.language == 'kn'
        ? 'ನಿಮ್ಮ ಪಾತ್ರಕ್ಕಾಗಿ ಸಲಹೆಗಳು ($userRole):'
        : ai.language == 'hi'
            ? 'आपकी भूमिका के लिए सुझाव ($userRole):'
            : 'Suggested for your role ($userRole):';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.help_outline_rounded, size: 14, color: AppColors.primaryGreen),
              const SizedBox(width: 4),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondaryText,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ...suggestions.map(
            (q) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: InkWell(
                onTap: () => _handleSend(ai, q),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Text(
                    q,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryText,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(AiProvider ai) {
    final hint = ai.language == 'kn'
        ? 'ಅನ್ನಧಾರ AI ಯೊಂದಿಗೆ ಸಂಭಾಷಿಸಿ...'
        : ai.language == 'hi'
            ? 'अन्नधारा AI से कुछ भी पूछें...'
            : 'Ask Annadhara AI anything...';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _handleSend(ai),
                decoration: InputDecoration(
                  hintText: hint,
                  hintStyle: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                  filled: true,
                  fillColor: AppColors.background,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(20),
                    borderSide: const BorderSide(color: AppColors.primaryGreen, width: 1.5),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: AppColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                onPressed: () => _handleSend(ai),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
