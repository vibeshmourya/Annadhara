const crypto = require('crypto');

/**
 * Generates a clean, unambiguous 6-character verification code for food handover/pickup
 * Format: e.g. "FB-8429"
 */
const generateHandoverCode = () => {
  // Uppercase alphanumeric without confusing chars (no 0/O, 1/I)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += charset[randomBytes[i] % charset.length];
  }
  return `FB-${code.substring(0, 4)}`;
};

/**
 * Generates a clean, unambiguous delivery confirmation code for recipient & volunteer verification
 * Format: e.g. "DL-8429"
 */
const generateDeliveryCode = () => {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  const randomBytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += charset[randomBytes[i] % charset.length];
  }
  return `DL-${code.substring(0, 4)}`;
};

module.exports = { generateHandoverCode, generateDeliveryCode };


