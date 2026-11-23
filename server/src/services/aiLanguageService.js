/**
 * Annadhara AI — Multilingual Service (English, Kannada, Hindi)
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides language detection, script analysis, prompt instructions,
 * and localized system prompts for Kannada (ಕನ್ನಡ), Hindi (हिन्दी), and English.
 */

const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    label: 'English',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    label: 'ಕನ್ನಡ (Kannada)',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    label: 'हिन्दी (Hindi)',
  },
};

/**
 * Detect language based on Unicode script frequency
 * - Kannada script: \u0C80 - \u0CFF
 * - Devanagari script: \u0900 - \u097F
 *
 * @param {string} text - User message input
 * @returns {string} Detected language code ('en', 'kn', or 'hi')
 */
const detectLanguage = (text) => {
  if (!text || typeof text !== 'string') return 'en';

  const kannadaMatches = text.match(/[\u0C80-\u0CFF]/g) || [];
  const devanagariMatches = text.match(/[\u0900-\u097F]/g) || [];

  const knCount = kannadaMatches.length;
  const hiCount = devanagariMatches.length;

  if (knCount > 0 && knCount >= hiCount) {
    return 'kn';
  }

  if (hiCount > 0 && hiCount > knCount) {
    return 'hi';
  }

  return 'en';
};

/**
 * Normalizes input language code to a supported language
 * @param {string} langCode
 * @returns {string} 'en', 'kn', or 'hi'
 */
const normalizeLanguage = (langCode) => {
  if (!langCode || typeof langCode !== 'string') return 'en';
  const clean = langCode.trim().toLowerCase();
  if (SUPPORTED_LANGUAGES[clean]) return clean;
  if (clean.startsWith('kn') || clean.includes('kannada')) return 'kn';
  if (clean.startsWith('hi') || clean.includes('hindi')) return 'hi';
  return 'en';
};

/**
 * Generates prompt instructions for Groq LLM to respond in the target language
 * @param {string} langCode
 * @returns {string} Prompt directive
 */
const getLanguageInstruction = (langCode) => {
  const code = normalizeLanguage(langCode);

  switch (code) {
    case 'kn':
      return `LANGUAGE DIRECTIVE:
The user has selected or communicated in Kannada (ಕನ್ನಡ).
- You MUST generate your entire response in natural, grammatically correct Kannada script.
- Maintain a polite, helpful, and community-minded tone (e.g. use "ದಯವಿಟ್ಟು", "ಧನ್ಯವಾದಗಳು").
- Retain official platform terms, technical keywords, and acronyms in transliterated Kannada or clean English format where standard (e.g., 'ಅನ್ನಧಾರ' (Annadhara), 'FSSAI', 'Handover Code', 'OTP', 'NGO').
- Provide clear, well-structured sentences with appropriate punctuation in Kannada.`;

    case 'hi':
      return `LANGUAGE DIRECTIVE:
The user has selected or communicated in Hindi (हिन्दी).
- You MUST generate your entire response in natural, polite Hindi in Devanagari script.
- Maintain a respectful, helpful, and encouraging tone (e.g. use "कृपया", "धन्यवाद", "सादर").
- Retain official platform terms, technical keywords, and acronyms in transliterated Hindi or clean English format where standard (e.g., 'अन्नधारा' (Annadhara), 'FSSAI', 'Handover Code', 'OTP', 'NGO').
- Provide clear, well-structured sentences with proper Devanagari punctuation.`;

    case 'en':
    default:
      return `LANGUAGE DIRECTIVE:
Respond in clear, professional, and accessible English.`;
  }
};

/**
 * Returns localized welcome greeting
 * @param {string} langCode
 * @returns {string} Localized greeting
 */
const getWelcomeMessage = (langCode) => {
  const code = normalizeLanguage(langCode);

  switch (code) {
    case 'kn':
      return "ನಮಸ್ಕಾರ! ನಾನು **ಅನ್ನಧಾರ AI**, ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ವೇದಿಕೆ ಸಹಾಯಕ. ಆಹಾರ ದಾನ ಪ್ರಕ್ರಿಯೆಗಳು, ಆಹಾರ ಸುರಕ್ಷತೆ ಮಾರ್ಗಸೂಚಿಗಳು ಮತ್ತು ನಿಮ್ಮ ಖಾತೆಗೆ ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?";

    case 'hi':
      return "नमस्ते! मैं **अन्नधारा AI** हूँ, आपका बुद्धिमान प्लेटफ़ॉर्म सहायक। मैं भोजन दान प्रक्रियाओं, खाद्य सुरक्षा दिशानिर्देशों और आपके अन्नधारा खाते की जानकारी प्राप्त करने में आपकी सहायता कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?";

    case 'en':
    default:
      return "Hello! I'm **Annadhara AI**, your intelligent platform assistant. I can help you understand food donation processes, find relevant food safety information and access information available to your Annadhara account.";
  }
};

module.exports = {
  SUPPORTED_LANGUAGES,
  detectLanguage,
  normalizeLanguage,
  getLanguageInstruction,
  getWelcomeMessage,
};
