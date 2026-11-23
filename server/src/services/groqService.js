/**
 * Annadhara AI — Groq LLM Inference Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Implements resilient communication with Groq's OpenAI-compatible chat completions endpoint.
 * Features:
 * - Dynamic model selection via GROQ_MODEL
 * - Configurable request timeout via AbortController
 * - Conversation context windowing & token limiting
 * - Safe error, rate-limit, and timeout handling
 * - Zero API key leakage into logs or client payloads
 */

const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
];
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_TOKENS = 512;

/**
 * Returns active Groq configuration without exposing secrets
 */
const getGroqConfig = () => {
  const apiKey = (process.env.GROQ_API_KEY || '').trim();
  const rawModel = (process.env.GROQ_MODEL || DEFAULT_MODEL).trim();
  // Sanitize model: if set to outdated 'qwen/qwen3.8-27b', upgrade to reliable llama-3.3-70b-versatile
  const model = rawModel === 'qwen/qwen3.8-27b' ? DEFAULT_MODEL : rawModel;
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
 * @returns {Promise<{message: string, model: string, usage: Object}>}
 */
const generateChatCompletion = async ({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = null,
  maxTokens = null,
}) => {
  const config = getGroqConfig();
  const selectedModel = model || config.model;
  const tokenLimit = maxTokens || config.maxTokens;

  // Handle case where GROQ_API_KEY is not configured
  if (!config.isConfigured) {
    return {
      message:
        "🌿 **Annadhara AI** is active, but `GROQ_API_KEY` is not yet configured on this server.\n\n" +
        "To enable live AI inference:\n" +
        "1. Obtain a free API key at [console.groq.com](https://console.groq.com)\n" +
        "2. Add `GROQ_API_KEY=your_key` to `server/.env`\n" +
        "3. Restart the backend server.\n\n" +
        "As an intelligent food redistribution assistant, I am ready to help donors post food, assist NGOs in finding surplus, guide volunteers on pickup missions, and support administrators in governance.",
      model: 'configuration-mode',
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
        const role = msg.role === 'user' ? 'user' : 'assistant';
        messages.push({
          role,
          content: msg.content.trim(),
        });
      }
    }
  }

  // Append latest user message
  messages.push({
    role: 'user',
    content: userMessage.trim(),
  });

  const candidateModels = Array.from(new Set([selectedModel, ...FALLBACK_MODELS]));
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
            // Model not found on this Groq account/tier, try next candidate model
            lastError = new Error(`Groq model '${modelToTry}' not found: ${errorMsg}`);
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
          assistantMessage = "I'm sorry, I could not generate a response at this moment. Please try again.";
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

    console.warn(`[GroqService] Groq inference failed (${error.message}). Returning safe expert fallback.`);

    return {
      message:
        "🌿 **Annadhara AI Assistant**\n\n" +
        "Cloud LLM inference is currently in resilient standby (" +
        (error.message || 'API connection unavailable') +
        "). Platform operations, food safety protocols, and Indian regulatory standards remain fully active.\n\n" +
        "**Core Guidance & Compliance Standards:**\n" +
        "• **FSSAI Food Safety Standards:** Surplus hot cooked food must be maintained at ≥ 65°C, cold perishable food at ≤ 5°C, and distributed within 2 to 4 hours of preparation under the *Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations*.\n" +
        "• **Listing Quality Checklist:** Ensure your donation listing includes exact cooked time, packaging status (sealed containers/insulated boxes), dietary classification (Pure Veg / Non-Veg / Vegan), and potential allergens.\n" +
        "• **Handover Protocol:** Never release surplus food without matching the recipient's verified 6-digit OTP / QR code to ensure complete traceability.\n" +
        "• **NGO Beneficiary Support:** Verified NGOs receive surplus food allocations based on proximity, capacity, and active volunteer transport availability.",
      model: 'resilient-offline-engine',
      usage: { total_tokens: 0 },
      isMock: true,
      errorNotice: error.message,
    };
  }

  return {
    message: "I am ready to assist you with surplus food redistribution, FSSAI compliance, and platform operations.",
    model: 'default-assistant',
    usage: { total_tokens: 0 },
    isMock: true,
  };
};

module.exports = {
  getGroqConfig,
  generateChatCompletion,
};
