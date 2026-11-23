/**
 * Annadhara AI — Route Declarations
 * Team Seva Shakti (MERNOVA X 2026)
 */

const express = require('express');
const router = express.Router();
const {
  chat,
  getStatus,
  getConversations,
  getConversationById,
  deleteConversation,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { createAiRateLimiter } = require('../middleware/aiRateLimiter');

// Rate limiters for AI resources:
// - 20 inferences/min for chat messages to protect LLM quota
// - 60 requests/min for conversation browsing and metadata
const chatLimiter = createAiRateLimiter({
  max: 20,
  windowMs: 60 * 1000,
  message: 'Annadhara AI message rate limit exceeded. Please wait a minute before sending more queries.',
});

const browsingLimiter = createAiRateLimiter({
  max: 60,
  windowMs: 60 * 1000,
  message: 'AI conversation requests exceeded rate limit. Please try again shortly.',
});

/**
 * Authentication middleware for AI routes:
 * Supports verified JWT tokens in production, or direct role simulation via
 * x-test-role header (e.g. from the standalone AI test studio without database login).
 */
const aiAuth = async (req, res, next) => {
  const testRole = (req.headers['x-test-role'] || req.body?.role || '').toUpperCase();
  if (['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN'].includes(testRole)) {
    req.user = {
      _id: 'test_' + testRole.toLowerCase() + '_id',
      id: 'test_' + testRole.toLowerCase() + '_id',
      name: `Test ${testRole.charAt(0) + testRole.slice(1).toLowerCase()} User`,
      role: testRole,
      accountStatus: 'ACTIVE',
    };
    return next();
  }

  return protect(req, res, next);
};

// Route protection
router.use(aiAuth);

// Chat & Status endpoints
router.post('/chat', chatLimiter, chat);
router.get('/status', browsingLimiter, getStatus);

// Multi-turn conversation management
router.get('/conversations', browsingLimiter, getConversations);
router.get('/conversations/:id', browsingLimiter, getConversationById);
router.delete('/conversations/:id', browsingLimiter, deleteConversation);

module.exports = router;
