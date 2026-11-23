/**
 * Annadhara AI — Rate Limiting & Abuse Prevention Middleware
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides in-memory sliding-window rate limiting keyed by authenticated user ID
 * (falling back to client IP) to protect Groq/Tavily quotas and prevent DoS.
 */

const userRequestsMap = new Map();

/**
 * Creates an AI rate limiting middleware
 *
 * @param {Object} options
 * @param {number} options.windowMs - Sliding window duration in milliseconds (default: 60s)
 * @param {number} options.max - Maximum permitted requests per window (default: 20)
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {boolean} options.ignoreTestEnv - Whether to bypass in NODE_ENV === 'test' (default: true)
 */
const createAiRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const maxRequests = options.max || 20; // 20 requests per minute default
  const message =
    options.message || 'AI message limit reached. Please wait a moment before sending more queries.';
  const ignoreTestEnv = options.ignoreTestEnv !== false;

  return (req, res, next) => {
    // Optionally bypass in test environment unless explicitly testing rate limits
    if (ignoreTestEnv && process.env.NODE_ENV === 'test') {
      return next();
    }

    // Key rate limiter by authenticated user ID, or IP if unauthenticated
    const key = req.user?._id?.toString() || req.user?.id?.toString() || req.ip || req.connection?.remoteAddress || 'unknown_client';
    const now = Date.now();

    const record = userRequestsMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    userRequestsMap.set(key, record);

    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil(record.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
      });
    }

    next();
  };
};

/**
 * Clear in-memory rate limit table (useful for test resets)
 */
const resetRateLimits = () => {
  userRequestsMap.clear();
};

module.exports = {
  createAiRateLimiter,
  resetRateLimits,
};
