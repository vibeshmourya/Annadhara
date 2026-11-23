/**
 * Annadhara AI — Chat Controller
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Coordinates authentication, input sanitization, prompt injection defense,
 * intent classification, language adaptation, platform intelligence, and Groq LLM inference.
 */

const { generateChatCompletion, getGroqConfig } = require('../services/groqService');
const { classifyIntent, INTENTS } = require('../services/aiIntentService');
const { buildSystemPrompt } = require('../services/aiPromptService');
const { searchWeb, getTavilyConfig } = require('../services/tavilyService');
const { getAuthorizedPlatformContext, isDbConnected } = require('../services/aiPlatformService');
const {
  detectLanguage,
  normalizeLanguage,
  SUPPORTED_LANGUAGES,
} = require('../services/aiLanguageService');
const {
  sanitizeUserInput,
  detectPromptInjection,
  redactSensitiveOutput,
} = require('../services/aiSecurityService');
const AIConversation = require('../models/AIConversation');

/**
 * Handle authenticated AI chat message
 * POST /api/ai/chat
 */
const chat = async (req, res, next) => {
  try {
    const { message, conversationId, language, conversationHistory = [] } = req.body;

    // 1. Input sanitization & validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid, non-empty message is required',
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters',
      });
    }

    const cleanMessage = sanitizeUserInput(message, 2000);
    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: 'Message contains only invalid or non-printable characters',
      });
    }

    // 2. Prompt injection & adversarial guardrails check
    const injectionCheck = detectPromptInjection(cleanMessage);
    if (injectionCheck.isInjection) {
      return res.status(400).json({
        success: false,
        message: 'Request declined: input contains system override or adversarial commands.',
        intent: INTENTS.UNSUPPORTED_REQUEST,
      });
    }

    // 3. Identify user and role from verified JWT session (never client body)
    const user = req.user;
    const role = (user.role || 'MEMBER').toUpperCase();
    const userId = user._id || user.id;

    // 4. Resolve language (explicit preference or auto-detection from script)
    let selectedLanguage = language ? normalizeLanguage(language) : detectLanguage(cleanMessage);

    // 5. Retrieve or create conversation record if database is connected
    let conversation = null;
    let activeConversationId = conversationId || null;
    let effectiveHistory = Array.isArray(conversationHistory) ? [...conversationHistory] : [];

    if (isDbConnected() && userId) {
      try {
        if (conversationId) {
          conversation = await AIConversation.findOne({ _id: conversationId, user: userId });
          if (conversation) {
            // Keep conversation's established language unless user explicitly passed a new one
            if (!language && conversation.language) {
              selectedLanguage = conversation.language;
            }
            // If caller did not provide history, construct from saved messages
            if (effectiveHistory.length === 0 && Array.isArray(conversation.messages)) {
              effectiveHistory = conversation.messages.slice(-4).map((m) => ({
                role: m.role,
                content: m.content,
              }));
            }
          }
        }

        if (!conversation) {
          const generatedTitle =
            cleanMessage.length > 45 ? cleanMessage.slice(0, 45) + '...' : cleanMessage;

          conversation = new AIConversation({
            user: userId,
            title: generatedTitle,
            role,
            language: selectedLanguage,
            messages: [],
          });
        }
      } catch (dbErr) {
        console.warn('[AIController] Conversation lookup error, continuing statelessly:', dbErr.message);
      }
    }

    // 6. Enforce token budgeting bound: cap conversation history to at most 4 recent turns (Free-Tier Optimization)
    effectiveHistory = effectiveHistory.slice(-4);

    // 7. Classify intent
    const intent = classifyIntent(cleanMessage);

    // 8. If query requires external web research, invoke Tavily search service
    let searchResults = [];
    let citations = [];

    if (intent === INTENTS.WEB_SEARCH || intent === INTENTS.COMBINED_QUERY) {
      try {
        const searchResponse = await searchWeb(cleanMessage);
        searchResults = searchResponse.results || [];
        citations = searchResponse.citations || [];
      } catch (searchErr) {
        console.warn('[AIController] External research failed, continuing with LLM fallback:', searchErr.message);
      }
    }

    // 9. If query requires platform data or role context, retrieve authorized platform intelligence
    let platformContext = null;
    if (
      intent === INTENTS.PLATFORM_DATA ||
      intent === INTENTS.COMBINED_QUERY ||
      cleanMessage.toLowerCase().includes('my ') ||
      cleanMessage.toLowerCase().includes('status') ||
      cleanMessage.toLowerCase().includes('how many')
    ) {
      try {
        platformContext = await getAuthorizedPlatformContext(user);
      } catch (dataErr) {
        console.warn('[AIController] Platform data retrieval failed:', dataErr.message);
      }
    }

    // 10. Build system prompt tailored to user, role, search evidence, platform data, and language
    const systemPrompt = buildSystemPrompt({
      user,
      role,
      intent,
      searchResults,
      platformContext,
      language: selectedLanguage,
    });

    // 11. Generate completion via Groq
    const completion = await generateChatCompletion({
      systemPrompt,
      userMessage: cleanMessage,
      conversationHistory: effectiveHistory,
    });

    // 12. Security guard: redact any credentials or keys before storing or outputting
    const safeOutputMessage = redactSensitiveOutput(completion.message);

    // 13. Persist message turn if conversation document is available
    if (conversation) {
      try {
        conversation.language = selectedLanguage;
        conversation.messages.push({
          role: 'user',
          content: cleanMessage,
          intent,
          timestamp: new Date(),
        });
        conversation.messages.push({
          role: 'assistant',
          content: safeOutputMessage,
          intent,
          citations,
          hasPlatformData: Boolean(platformContext),
          timestamp: new Date(),
        });

        await conversation.save();
        activeConversationId = conversation._id.toString();
      } catch (saveErr) {
        console.warn('[AIController] Failed to persist conversation turn:', saveErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        message: safeOutputMessage,
        role,
        intent,
        model: completion.model,
        language: selectedLanguage,
        conversationId: activeConversationId,
        citations,
        hasPlatformData: Boolean(platformContext),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AIController Error]:', error.message);

    // Free-tier rate limit (429) handling for Groq / Tavily upstream quotas
    if (error.status === 429 || error.isRateLimited || error.message?.toLowerCase().includes('rate limit')) {
      const retryAfter = error.retryAfter || 20;
      return res.status(429).json({
        success: false,
        isRateLimited: true,
        retryAfter,
        message: `🌿 Annadhara AI free-tier limit reached. Please wait ${retryAfter} seconds before sending another message.`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing your AI request',
    });
  }
};

/**
 * Get all conversations for authenticated user
 * GET /api/ai/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const conversations = await AIConversation.find({ user: userId })
      .select('_id title role language messages updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(30)
      .lean();

    const formatted = conversations.map((c) => ({
      id: c._id,
      title: c.title,
      role: c.role,
      language: c.language,
      messageCount: c.messages ? c.messages.length : 0,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error('[AIController getConversations Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation history',
    });
  }
};

/**
 * Get conversation by ID
 * GET /api/ai/conversations/:id
 */
const getConversationById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!isDbConnected()) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const conversation = await AIConversation.findOne({ _id: id, user: userId }).lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        title: conversation.title,
        role: conversation.role,
        language: conversation.language,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (err) {
    console.error('[AIController getConversationById Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load conversation',
    });
  }
};

/**
 * Delete a conversation
 * DELETE /api/ai/conversations/:id
 */
const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!isDbConnected()) {
      return res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    }

    const deleted = await AIConversation.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or unauthorized to delete',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (err) {
    console.error('[AIController deleteConversation Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
};

/**
 * Get AI Assistant service status
 * GET /api/ai/status
 */
const getStatus = async (req, res) => {
  const config = getGroqConfig();
  const tavilyConfig = getTavilyConfig();

  return res.status(200).json({
    success: true,
    data: {
      status: 'online',
      provider: 'groq',
      model: config.model,
      isConfigured: config.isConfigured,
      rateLimits: {
        chatLimitPerMinute: 20,
        historyLimitPerMinute: 60,
      },
      security: {
        promptInjectionFilter: true,
        secretRedaction: true,
        strictRoleIsolation: true,
      },
      webSearch: {
        provider: 'tavily',
        isConfigured: tavilyConfig.isConfigured,
        searchDepth: tavilyConfig.searchDepth,
      },
      platformData: {
        isConnected: isDbConnected(),
        supportedRoles: ['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'],
      },
      multilingual: {
        supportedLanguages: Object.keys(SUPPORTED_LANGUAGES),
        languages: SUPPORTED_LANGUAGES,
      },
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  chat,
  getConversations,
  getConversationById,
  deleteConversation,
  getStatus,
};
