/**
 * In-memory Token Revocation Service
 * Tracks invalidated tokens to provide verifiable logout functionality
 */

const revokedTokens = new Set();

/**
 * Adds a token to the revoked tokens registry
 * @param {string} token
 */
const revokeToken = (token) => {
  if (token) {
    revokedTokens.add(token);
  }
};

/**
 * Checks if a token has been revoked
 * @param {string} token
 * @returns {boolean}
 */
const isTokenRevoked = (token) => {
  if (!token) return false;
  return revokedTokens.has(token);
};

/**
 * Clear revoked tokens (useful for testing)
 */
const clearRevokedTokens = () => {
  revokedTokens.clear();
};

module.exports = {
  revokeToken,
  isTokenRevoked,
  clearRevokedTokens,
};

