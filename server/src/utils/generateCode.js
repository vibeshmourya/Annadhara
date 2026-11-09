const crypto = require('crypto');

/**
 * Generates a clean, unambiguous 6-character verification code for food handover
 * Format: e.g. "FB-8429" or 6-digit numeric
 */
const generateHandoverCode = () => {
  // 6 digits uppercase alphanumeric without confusing chars (no 0/O, 1/I)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += charset[randomBytes[i] % charset.length];
  }
  return `FB-${code.substring(0, 4)}`;
};

module.exports = { generateHandoverCode };

