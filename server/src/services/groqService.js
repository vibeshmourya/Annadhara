/**
 * Annadhara AI — Groq LLM Inference Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Implements resilient communication with Groq's OpenAI-compatible chat completions endpoint.
 * Features:
 * - Dynamic model selection via GROQ_MODEL with automatic decommissioned-model sanitization
 * - Active verified default model: qwen/qwen3.8-27b (131k context window)
 * - Intelligent question-aware, intent-specific contextual fallback responses
 * - Configurable request timeout via AbortController
 * - Conversation context windowing & token limiting
 * - Safe error, rate-limit, and timeout handling
 * - Zero API key leakage into logs or client payloads
 */

const { generateContextualFallback } = require('./aiFallbackService');

const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
const FALLBACK_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

// Retired/decommissioned Groq models that must never be queried
const DECOMMISSIONED_MODELS = new Set([
  'gemma2-9b-it',
  'gemma-7b-it',
  'mixtral-8x7b-32768',
  'llama3-8b-8192',
  'llama3-70b-8192',
  'llama-3.1-70b-versatile',
]);

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_TOKENS = 512;

/**
 * Returns active Groq configuration without exposing secrets
 */
const getGroqConfig = () => {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const rawModel = (process.env.GROQ_MODEL || DEFAULT_MODEL).trim();

  // Sanitize model: if unset or set to any retired/decommissioned model, upgrade to verified DEFAULT_MODEL
  let model = rawModel;
  if (!model || DECOMMISSIONED_MODELS.has(model.toLowerCase())) {
    model = DEFAULT_MODEL;
  }

  const timeoutMs = parseInt(process.env.GROQ_TIMEOUT, 10) || DEFAULT_TIMEOUT_MS;
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS, 10) || DEFAULT_MAX_TOKENS;

  return {
    isConfigured: Boolean(apiKey && apiKey.length > 0),
    model,
    timeoutMs,
    maxTokens,
  };
};

/**
 * Executes chat completion against Groq API
 *
 * @param {Object} params
 * @param {string} params.systemPrompt - System instruction describing assistant persona and user role
 * @param {string} params.userMessage - Current message sent by user
 * @param {Array<{role: string, content: string}>} [params.conversationHistory=[]] - Previous turns
 * @param {string} [params.model] - Optional override model
 * @param {number} [params.maxTokens] - Optional override max tokens
 * @param {string} [params.role='donor'] - User role (donor, recipient, volunteer, admin)
 * @param {string} [params.language='en'] - Active language code
 * @param {string} [params.intent] - Detected query intent
 * @returns {Promise<{message: string, model: string, usage: Object, isMock: boolean}>}
 */
const generateChatCompletion = async ({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = null,
  maxTokens = null,
  role = 'donor',
  language = 'en',
  intent = null,
}) => {
  const config = getGroqConfig();
  let selectedModel = model || config.model;
  if (selectedModel && DECOMMISSIONED_MODELS.has(selectedModel.toLowerCase())) {
    selectedModel = DEFAULT_MODEL;
  }
  const tokenLimit = maxTokens || config.maxTokens;

  // Handle case where GROQ_API_KEY is not configured
  if (!config.isConfigured) {
    const fallback = generateContextualFallback({
      userMessage,
      role,
      language,
    });
    return {
      message: fallback.message,
      model: fallback.model,
      usage: { total_tokens: 0 },
      isMock: true,
    };
  }

  // Build messages array: System instruction -> Historical context -> Current user turn
  const messages = [];

  if (systemPrompt && systemPrompt.trim().length > 0) {
    messages.push({
      role: 'system',
      content: systemPrompt.trim(),
    });
  }

  // Sanitize and append previous conversation history (limit to last 6 turns to avoid context overflow)
  if (Array.isArray(conversationHistory)) {
    const recent = conversationHistory.slice(-6);
    for (const msg of recent) {
      if (msg && typeof msg.content === 'string' && msg.content.trim()) {
        const historyRole = msg.role === 'user' ? 'user' : 'assistant';
        messages.push({
          role: historyRole,
          content: msg.content.trim(),
        });
      }
    }
  }

  // Append latest user message
  messages.push({
    role: 'user',
    content: (userMessage || '').trim(),
  });

  // Filter candidate models to ensure no decommissioned models are ever queried
  const candidateModels = Array.from(
    new Set([selectedModel, ...FALLBACK_MODELS])
  ).filter((m) => m && !DECOMMISSIONED_MODELS.has(m.toLowerCase()));

  let lastError = null;

  try {
    for (const modelToTry of candidateModels) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(GROQ_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY.trim()}`,
          },
          body: JSON.stringify({
            model: modelToTry,
            messages,
            max_tokens: tokenLimit,
            temperature: 0.3,
            top_p: 0.95,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          let errorJson = null;
          try {
            errorJson = JSON.parse(errorText);
          } catch (_) {}

          const errorMsg = errorJson?.error?.message || errorText || `HTTP ${response.status}`;
          const isModelNotFound =
            response.status === 404 ||
            errorMsg.toLowerCase().includes('model_not_found') ||
            errorMsg.toLowerCase().includes('does not exist') ||
            errorMsg.toLowerCase().includes('not found') ||
            errorMsg.toLowerCase().includes('decommissioned');

          if (isModelNotFound) {
            // Model not found or decommissioned, record error and proceed to next candidate
            lastError = new Error(`Groq model '${modelToTry}' unavailable: ${errorMsg}`);
            continue;
          }

          if (response.status === 429) {
            const retryHeader =
              response.headers.get('retry-after') ||
              response.headers.get('x-ratelimit-reset-requests') ||
              response.headers.get('x-ratelimit-reset-tokens');
            let retryAfterSeconds = 20;
            if (retryHeader) {
              const parsed = parseInt(retryHeader, 10);
              if (!isNaN(parsed) && parsed > 0) {
                retryAfterSeconds = parsed;
              }
            }
            const rateErr = new Error(`Groq API rate limit exceeded: ${errorMsg}`);
            rateErr.status = 429;
            rateErr.isRateLimited = true;
            rateErr.retryAfter = retryAfterSeconds;
            throw rateErr;
          }

          if (response.status === 401 || response.status === 403) {
            // Authentication errors cannot be resolved by retrying with other models
            throw new Error(`Groq API authentication failed: Invalid or expired GROQ_API_KEY`);
          }

          throw new Error(`Groq API Error (${response.status}): ${errorMsg}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0]?.message;
        let assistantMessage = (choice?.content || '').trim();

        // Support reasoning models where main output is in reasoning
        if (!assistantMessage && choice?.reasoning) {
          assistantMessage = choice.reasoning.trim();
        }

        if (!assistantMessage) {
          assistantMessage = "I am ready to assist you with surplus food redistribution, FSSAI compliance, and platform operations.";
        }

        return {
          message: assistantMessage,
          model: data.model || modelToTry,
          usage: data.usage || {},
          isMock: false,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError' || err.message?.includes('aborted')) {
          lastError = new Error(`Groq API request timed out after ${config.timeoutMs}ms.`);
          continue;
        }

        const isModelErr =
          err.message &&
          (err.message.includes('not found') ||
            err.message.includes('does not exist') ||
            err.message.includes('unavailable') ||
            err.message.includes('model_not_found'));

        if (isModelErr && candidateModels.indexOf(modelToTry) < candidateModels.length - 1) {
          lastError = err;
          continue;
        }

        throw err;
      }
    }

    if (lastError) {
      throw lastError;
    }
  } catch (error) {
    // Free-tier rate limit must bubble to controller for 429 response
    if (error.status === 429 || error.isRateLimited) {
      throw error;
    }

    console.warn(`[GroqService] Groq live inference unavailable (${error.message}). Invoking contextual fallback.`);

    const fallback = generateContextualFallback({
      userMessage,
      role,
      language,
    });

    return {
      message: fallback.message,
      model: fallback.model,
      usage: { total_tokens: 0 },
      isMock: true,
      errorNotice: error.message,
    };
  }

  const defaultFallback = generateContextualFallback({
    userMessage,
    role,
    language,
  });

  return {
    message: defaultFallback.message,
    model: defaultFallback.model,
    usage: { total_tokens: 0 },
    isMock: true,
  };
};

module.exports = {
  getGroqConfig,
  generateChatCompletion,
  DEFAULT_MODEL,
  FALLBACK_MODELS,
  DECOMMISSIONED_MODELS,
};

