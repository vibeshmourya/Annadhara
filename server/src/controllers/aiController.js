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
const mongoose = require('mongoose');
const AIConversation = require('../models/AIConversation');

const ACTION_LABELS = {
  CREATE_DONATION: {
    en: 'Publish Food Donation',
    kn: 'ಆಹಾರ ದಾನ ಪ್ರಕಟಿಸಿ',
    hi: 'भोजन दान प्रकाशित करें',
  },
  FIND_FOOD: {
    en: 'Browse Food Listings',
    kn: 'ಆಹಾರ ಪಟ್ಟಿಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ',
    hi: 'भोजन सूची देखें',
  },
  MY_DONATIONS: {
    en: 'My Food Listings',
    kn: 'ನನ್ನ ಆಹಾರ ಪಟ್ಟಿಗಳು',
    hi: 'मेरे भोजन दान',
  },
  RESERVATIONS: {
    en: 'My Reservations',
    kn: 'ನನ್ನ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳು',
    hi: 'मेरे आरक्षण',
  },
  PICKUPS: {
    en: 'View Pickup Missions',
    kn: 'ಪಿಕಪ್ ಕಾರ್ಯಾಚರಣೆಗಳು',
    hi: 'पिकअप कार्य देखें',
  },
  ADMIN_PANEL: {
    en: 'Admin Panel',
    kn: 'ನಿರ್ವಾಹಕ ಫಲಕ',
    hi: 'व्यवस्थापक पैनल',
  },
};

/**
 * Generates context-aware interactive actions based on query, role and intent
 */
const generateSuggestedActions = ({ message, role, intent, language = 'en' }) => {
  const actions = [];
  const lowerMsg = (message || '').toLowerCase();
  const lang = ['en', 'kn', 'hi'].includes(language) ? language : 'en';

  const isDonateQuery =
    lowerMsg.includes('donate') ||
    lowerMsg.includes('publish') ||
    lowerMsg.includes('create') ||
    lowerMsg.includes('listing') ||
    lowerMsg.includes('surplus food') ||
    lowerMsg.includes('ದಾನ') ||
    lowerMsg.includes('ಪ್ರಕಟಿಸು') ||
    lowerMsg.includes('दान') ||
    lowerMsg.includes('लिस्टिंग');

  const isFindQuery =
    lowerMsg.includes('find') ||
    lowerMsg.includes('available') ||
    lowerMsg.includes('reserve') ||
    lowerMsg.includes('request') ||
    lowerMsg.includes('browse') ||
    lowerMsg.includes('food') ||
    lowerMsg.includes('meal') ||
    lowerMsg.includes('ಕಂಡುಹಿಡಿ') ||
    lowerMsg.includes('ಲಭ್ಯವಿರುವ') ||
    lowerMsg.includes('खोज') ||
    lowerMsg.includes('आरक्षण');

  const isPickupQuery =
    lowerMsg.includes('pickup') ||
    lowerMsg.includes('deliver') ||
    lowerMsg.includes('mission') ||
    lowerMsg.includes('transport') ||
    lowerMsg.includes('claim') ||
    lowerMsg.includes('ಪಿಕಪ್') ||
    lowerMsg.includes('ಸಾರಿಗೆ') ||
    lowerMsg.includes('पिकअप') ||
    lowerMsg.includes('परिवहन');

  const isReservationQuery =
    lowerMsg.includes('my reservation') ||
    lowerMsg.includes('reservation') ||
    lowerMsg.includes('code') ||
    lowerMsg.includes('handover') ||
    lowerMsg.includes('otp');

  const isAdminQuery =
    lowerMsg.includes('admin') ||
    lowerMsg.includes('verify ngo') ||
    lowerMsg.includes('organization verification') ||
    lowerMsg.includes('audit');

  if (isDonateQuery && (role === 'DONOR' || role === 'MEMBER')) {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.CREATE_DONATION[lang] || ACTION_LABELS.CREATE_DONATION.en,
      path: '/create-donation',
      icon: 'PlusCircle',
    });
  }

  if (isFindQuery && (role === 'RECIPIENT' || role === 'MEMBER' || role === 'VOLUNTEER')) {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.FIND_FOOD[lang] || ACTION_LABELS.FIND_FOOD.en,
      path: '/find-food',
      icon: 'Search',
    });
  }

  if (isReservationQuery && (role === 'RECIPIENT' || role === 'DONOR')) {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.RESERVATIONS[lang] || ACTION_LABELS.RESERVATIONS.en,
      path: '/reservations',
      icon: 'Calendar',
    });
  }

  if (role === 'DONOR' && (lowerMsg.includes('my ') || lowerMsg.includes('listings') || lowerMsg.includes('status'))) {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.MY_DONATIONS[lang] || ACTION_LABELS.MY_DONATIONS.en,
      path: '/my-donations',
      icon: 'Package',
    });
  }

  if ((isPickupQuery || role === 'VOLUNTEER') && (role === 'VOLUNTEER' || role === 'ADMIN')) {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.PICKUPS[lang] || ACTION_LABELS.PICKUPS.en,
      path: '/pickups',
      icon: 'Truck',
    });
  }

  if ((isAdminQuery || role === 'ADMIN') && role === 'ADMIN') {
    actions.push({
      actionType: 'NAVIGATE',
      label: ACTION_LABELS.ADMIN_PANEL[lang] || ACTION_LABELS.ADMIN_PANEL.en,
      path: '/admin',
      icon: 'ShieldCheck',
    });
  }

  return actions;
};

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
    const isTest = Boolean(user.isTestUser);
    const isValidUserId = userId && mongoose.Types.ObjectId.isValid(userId);

    if (isDbConnected() && isValidUserId && !isTest) {
      try {
        if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
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
      role,
      language: selectedLanguage,
      intent,
    });

    // 12. Determine suggested actions
    const actions = generateSuggestedActions({
      message: cleanMessage,
      role,
      intent,
      language: selectedLanguage,
    });

    // 13. Security guard: redact any credentials or keys before storing or outputting
    const safeOutputMessage = redactSensitiveOutput(completion.message);

    // 14. Persist message turn if conversation document is available
    if (conversation && !isTest) {
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
          actions,
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
        actions,
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

    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(userId) || req.user?.isTestUser) {
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

    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId) || req.user?.isTestUser) {
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

    if (!isDbConnected() || !mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId) || req.user?.isTestUser) {
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

/**
 * Submit feedback on an AI message
 * POST /api/ai/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { conversationId, messageId, rating } = req.body;

    if (!rating || !['helpful', 'unhelpful'].includes(rating)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be either 'helpful' or 'unhelpful'",
      });
    }

    if (
      isDbConnected() &&
      conversationId &&
      mongoose.Types.ObjectId.isValid(conversationId) &&
      !req.user?.isTestUser
    ) {
      const conversation = await AIConversation.findOne({ _id: conversationId, user: userId });
      if (conversation && Array.isArray(conversation.messages)) {
        let targetMsg = null;
        if (messageId && mongoose.Types.ObjectId.isValid(messageId)) {
          targetMsg = conversation.messages.id(messageId);
        } else {
          // Default to the last assistant message
          targetMsg = [...conversation.messages].reverse().find((m) => m.role === 'assistant');
        }

        if (targetMsg) {
          targetMsg.feedback = {
            rating,
            createdAt: new Date(),
          };
          await conversation.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback recorded successfully. Thank you for helping improve Annadhara AI!',
      data: { rating },
    });
  } catch (err) {
    console.error('[AIController submitFeedback Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record feedback',
    });
  }
};

/**
 * Clear all messages in a conversation
 * POST /api/ai/conversations/:id/clear
 */
const clearConversationMessages = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Conversation ID required' });
    }

    if (isDbConnected() && mongoose.Types.ObjectId.isValid(id) && !req.user?.isTestUser) {
      const conv = await AIConversation.findOne({ _id: id, user: userId });
      if (conv) {
        conv.messages = [];
        await conv.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation history cleared successfully',
    });
  } catch (err) {
    console.error('[AIController clearConversationMessages Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear conversation history',
    });
  }
};

module.exports = {
  chat,
  getConversations,
  getConversationById,
  deleteConversation,
  clearConversationMessages,
  submitFeedback,
  getStatus,
  generateSuggestedActions,
};
