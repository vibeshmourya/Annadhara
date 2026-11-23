/**
 * Annadhara AI — Intent Classification Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Lightweight, rule-and-keyword based intent classifier that eliminates
 * unnecessary LLM round-trips for common conversational and platform questions.
 */

const INTENTS = {
  GENERAL_CHAT: 'GENERAL_CHAT',
  WEB_SEARCH: 'WEB_SEARCH',
  PLATFORM_DATA: 'PLATFORM_DATA',
  COMBINED_QUERY: 'COMBINED_QUERY',
  SUPPORT_HELP: 'SUPPORT_HELP',
  UNSUPPORTED_REQUEST: 'UNSUPPORTED_REQUEST',
};

/**
 * Classifies a user's prompt into an actionable intent
 *
 * @param {string} message - Raw user input
 * @returns {string} One of INTENTS values
 */
const classifyIntent = (message) => {
  if (!message || typeof message !== 'string') {
    return INTENTS.GENERAL_CHAT;
  }

  const text = message.toLowerCase().trim();

  // 1. Destructive or injection checks
  if (
    text.includes('drop collection') ||
    text.includes('delete from') ||
    text.includes('ignore previous instructions') ||
    text.includes('disregard all previous') ||
    text.includes('bypass system')
  ) {
    return INTENTS.UNSUPPORTED_REQUEST;
  }

  // 2. Combined query keywords
  const hasExternalSafety =
    text.includes('fssai') ||
    text.includes('food safety') ||
    text.includes('guidelines') ||
    text.includes('regulations') ||
    text.includes('law');

  const hasPlatformAction =
    text.includes('my donation') ||
    text.includes('my listing') ||
    text.includes('my reservation') ||
    text.includes('checklist') ||
    text.includes('annadhara');

  if (hasExternalSafety && hasPlatformAction) {
    return INTENTS.COMBINED_QUERY;
  }

  // 3. Web Search indicators (FSSAI, external news, government regulations)
  if (
    text.includes('fssai') ||
    text.includes('government of india') ||
    text.includes('latest rules') ||
    text.includes('regulatory') ||
    text.includes('expiry rules') ||
    text.includes('food safety act')
  ) {
    return INTENTS.WEB_SEARCH;
  }

  // 4. Platform Data indicators (asking about live account data or statistics)
  if (
    text.includes('how many') ||
    text.includes('my donation') ||
    text.includes('my reservation') ||
    text.includes('my pickup') ||
    text.includes('verification status') ||
    text.includes('handover code') ||
    text.includes('active listing') ||
    text.includes('assigned task') ||
    text.includes('platform stats')
  ) {
    return INTENTS.PLATFORM_DATA;
  }

  // 5. Support / Help indicators
  if (
    text.startsWith('how to') ||
    text.startsWith('how do i') ||
    text.includes('help me') ||
    text.includes('report a problem') ||
    text.includes('contact support') ||
    text.includes('how does annadhara work')
  ) {
    return INTENTS.SUPPORT_HELP;
  }

  return INTENTS.GENERAL_CHAT;
};

module.exports = {
  INTENTS,
  classifyIntent,
};
