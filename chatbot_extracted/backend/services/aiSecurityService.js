/**
 * Annadhara AI — Security, Sanitization & Guardrails Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides defense-in-depth against prompt injection, jailbreak attempts,
 * secret leakage, and malicious input vectors.
 */

// Known adversarial patterns, prompt injection heuristics, and jailbreaks
const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+|any\s+|previous\s+|above\s+)*(?:instructions|prompts|directions|rules|guidelines)/i,
  /disregard\s+(?:all\s+|any\s+|previous\s+|above\s+)*(?:instructions|safety|guidelines|rules)/i,
  /system\s+prompt\s+override/i,
  /override\s+(?:all\s+)*instructions/i,
  /you\s+are\s+now\s+(?:dan|evil|jailbroken|unrestricted|godmode)/i,
  /pretend\s+you\s+(?:have\s+no\s+rules|are\s+unfiltered|can\s+do\s+anything)/i,
  /bypass\s+(?:system|safety|security|filters|guardrails)/i,
  /reveal\s+(?:your\s+)*(?:system\s+prompt|developer\s+instructions|api\s*key|jwt|secret|token)/i,
  /what\s+is\s+your\s+(?:system\s+prompt|initial\s+prompt|hidden\s+instruction)/i,
  /drop\s+collection/i,
  /delete\s+from\s+[a-z0-9_]+/i,
  /\$where\s*:/i,
  /\$gt\s*:/i,
  /sudo\s+mode/i,
];

// Patterns for potential credentials or secrets to redact from outbound text
const SECRET_REDACTION_PATTERNS = [
  { pattern: /gsk_[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_GROQ_KEY]' },
  { pattern: /tvly-[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_TAVILY_KEY]' },
  { pattern: /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{10,}/g, replacement: '[REDACTED_JWT_TOKEN]' },
  { pattern: /mongodb(?:\+srv)?:\/\/[^\s]+/g, replacement: '[REDACTED_DATABASE_URI]' },
];

/**
 * Sanitizes user input string
 * - Strips zero-width characters, null bytes, non-printable control chars
 * - Truncates to max allowable length
 *
 * @param {string} text - Raw user message
 * @param {number} maxLength - Character cap (default 2000)
 * @returns {string} Clean sanitized string
 */
const sanitizeUserInput = (text, maxLength = 2000) => {
  if (!text || typeof text !== 'string') return '';

  // 1. Remove null bytes and invisible zero-width chars (common obfuscation tricks)
  let clean = text.replace(/[\0\u200B-\u200D\uFEFF]/g, '');

  // 2. Normalize whitespace while preserving normal newlines
  clean = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 3. Remove non-printable control characters (except tab, newline)
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 4. Truncate to maximum permitted length
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean.trim();
};

/**
 * Evaluates whether a prompt contains prompt injection or adversarial jailbreak vectors
 *
 * @param {string} text - Sanitized user message
 * @returns {{ isInjection: boolean, reason: string | null }}
 */
const detectPromptInjection = (text) => {
  if (!text || typeof text !== 'string') {
    return { isInjection: false, reason: null };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isInjection: true,
        reason: 'Prompt contains unauthorized system override or adversarial pattern',
      };
    }
  }

  return { isInjection: false, reason: null };
};

/**
 * Redacts any accidental API keys, tokens, or URIs from outbound LLM messages
 *
 * @param {string} text - Generated assistant response
 * @returns {string} Sanitized output with redacted secrets
 */
const redactSensitiveOutput = (text) => {
  if (!text || typeof text !== 'string') return '';

  let sanitized = text;
  for (const { pattern, replacement } of SECRET_REDACTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
};

module.exports = {
  sanitizeUserInput,
  detectPromptInjection,
  redactSensitiveOutput,
  INJECTION_PATTERNS,
};
