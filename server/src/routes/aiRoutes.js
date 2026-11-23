/**
 * Annadhara AI — Route Declarations
 * Team Seva Shakti (MERNOVA X 2026)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
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

// Deterministic Mongoose ObjectIds for role-simulation test mode
const SIMULATED_ROLE_IDS = {
  DONOR: new mongoose.Types.ObjectId('000000000000000000000001'),
  RECIPIENT: new mongoose.Types.ObjectId('000000000000000000000002'),
  VOLUNTEER: new mongoose.Types.ObjectId('000000000000000000000003'),
  ADMIN: new mongoose.Types.ObjectId('000000000000000000000004'),
  MEMBER: new mongoose.Types.ObjectId('000000000000000000000005'),
};

/**
 * Authentication middleware for AI routes:
 * Supports verified JWT tokens in production, or direct role simulation via
 * x-test-role header (e.g. from the standalone AI test studio without database login).
 */
const aiAuth = async (req, res, next) => {
  const testRole = (req.headers['x-test-role'] || req.body?.role || '').toUpperCase();
  if (['DONOR', 'RECIPIENT', 'VOLUNTEER', 'ADMIN', 'MEMBER'].includes(testRole)) {
    const fakeId = SIMULATED_ROLE_IDS[testRole] || SIMULATED_ROLE_IDS.MEMBER;
    req.user = {
      _id: fakeId,
      id: fakeId.toString(),
      name: `Test ${testRole.charAt(0) + testRole.slice(1).toLowerCase()} User`,
      role: testRole,
      accountStatus: 'ACTIVE',
      isTestUser: true,
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
