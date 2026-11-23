/**
 * Annadhara AI — Tavily Web Search & Research Service
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Provides real-time internet research capabilities for regulatory,
 * food safety, and government food redistribution guidelines.
 *
 * Features:
 * - Prioritization of authoritative regulatory domains (FSSAI, gov.in, nic.in, who.int, fao.org)
 * - Safe request timeouts with AbortController
 * - Source snippet extraction and sanitization
 * - Graceful fallback when TAVILY_API_KEY is not configured
 * - Deduplication of URLs
 */

const TAVILY_API_ENDPOINT = 'https://api.tavily.com/search';
const DEFAULT_MAX_RESULTS = 3;
const DEFAULT_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours TTL for free-tier credit preservation

// In-memory query cache to protect free-tier 1,000 monthly quota
const searchCache = new Map();

/**
 * Clears in-memory search cache (for testing)
 */
const clearSearchCache = () => {
  searchCache.clear();
};

// Authoritative Indian and International Food Safety & Government Domains
const OFFICIAL_DOMAINS = [
  'fssai.gov.in',
  'eatrightindia.gov.in',
  'mohfw.gov.in',
  'foodlicensing.fssai.gov.in',
  'foscos.fssai.gov.in',
  'consumeraffairs.nic.in',
  'dfpd.gov.in',
  'mygov.in',
  'india.gov.in',
  'who.int',
  'fao.org',
];

/**
 * Returns active Tavily configuration
 */
const getTavilyConfig = () => {
  const apiKey = (process.env.TAVILY_API_KEY || '').trim();
  const maxResults = parseInt(process.env.TAVILY_MAX_RESULTS, 10) || DEFAULT_MAX_RESULTS;
  const timeoutMs = parseInt(process.env.TAVILY_TIMEOUT, 10) || DEFAULT_TIMEOUT_MS;
  const searchDepth = (process.env.TAVILY_SEARCH_DEPTH || 'basic').trim();

  return {
    isConfigured: Boolean(apiKey && apiKey.length > 0),
    maxResults,
    timeoutMs,
    searchDepth,
  };
};

/**
 * Checks if a URL or domain belongs to a trusted regulatory or government entity
 */
const isOfficialDomain = (urlOrDomain) => {
  if (!urlOrDomain || typeof urlOrDomain !== 'string') return false;
  const lower = urlOrDomain.toLowerCase();

  return (
    OFFICIAL_DOMAINS.some((domain) => lower.includes(domain)) ||
    lower.endsWith('.gov.in') ||
    lower.endsWith('.nic.in') ||
    lower.includes('.gov.in/') ||
    lower.includes('.nic.in/')
  );
};

/**
 * Extracts a clean domain name from a URL
 */
const extractDomain = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, '');
  } catch (_) {
    return 'external';
  }
};

/**
 * Extracts a refined search query from user prompt
 */
const extractSearchQuery = (prompt) => {
  if (!prompt || typeof prompt !== 'string') return 'FSSAI surplus food donation guidelines India';

  let cleaned = prompt.replace(/[?!.,;]/g, '').trim();
  const prefixRegex = /^(can you please|could you please|please tell me|tell me|can you|please|what are the|what are|what is the|what is|how do i|how to)\s+/i;

  let changed = true;
  while (changed) {
    const next = cleaned.replace(prefixRegex, '');
    if (next !== cleaned) {
      cleaned = next.trim();
    } else {
      changed = false;
    }
  }

  // If query mentions food safety or donation without India / FSSAI, append context
  if (
    (cleaned.toLowerCase().includes('food safety') || cleaned.toLowerCase().includes('donation')) &&
    !cleaned.toLowerCase().includes('india') &&
    !cleaned.toLowerCase().includes('fssai')
  ) {
    cleaned = `${cleaned} FSSAI India`;
  }

  return cleaned.slice(0, 150);
};

/**
 * Searches the web using Tavily API
 *
 * @param {string} userPrompt - User query
 * @param {Object} [options]
 * @param {number} [options.maxResults]
 * @returns {Promise<{results: Array<Object>, citations: Array<Object>, isMock: boolean}>}
 */
const searchWeb = async (userPrompt, options = {}) => {
  const config = getTavilyConfig();
  const maxResults = options.maxResults || config.maxResults;
  const query = extractSearchQuery(userPrompt);

  // 1. Check in-memory query cache to preserve monthly free-tier credits
  const cacheKey = `${query.toLowerCase().trim()}_${maxResults}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return {
      ...cached.data,
      isCached: true,
    };
  }

  // Curated regulatory fallback data for offline mode or quota preservation
  const getFallbackPayload = () => {
    const isRegulatory =
      userPrompt.toLowerCase().includes('fssai') ||
      userPrompt.toLowerCase().includes('safety') ||
      userPrompt.toLowerCase().includes('regulation') ||
      userPrompt.toLowerCase().includes('guideline');

    const fallbackResults = isRegulatory
      ? [
          {
            title: 'FSSAI (Food Safety and Standards Authority of India) — Surplus Food Regulations',
            url: 'https://www.fssai.gov.in',
            snippet:
              'Under Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations, surplus food donor businesses must adhere to hygienic food handling, safe temperature maintenance, and proper labeling before donation handover.',
            domain: 'fssai.gov.in',
            isOfficial: true,
          },
          {
            title: 'Eat Right India — Food Waste and Donation Guidance',
            url: 'https://eatrightindia.gov.in',
            snippet:
              'National initiative ensuring edible surplus food is safely channeled from food business operators to registered beneficiary networks and community kitchens.',
            domain: 'eatrightindia.gov.in',
            isOfficial: true,
          },
        ]
      : [
          {
            title: 'Food and Agriculture Organization (FAO) — Food Loss and Waste Prevention',
            url: 'https://www.fao.org/food-loss-and-food-waste',
            snippet:
              'Global standards and recommendations for reducing post-harvest loss, retail food waste, and fostering institutional redistribution partnerships.',
            domain: 'fao.org',
            isOfficial: true,
          },
        ];

    const payload = {
      query,
      results: fallbackResults.slice(0, maxResults),
      citations: fallbackResults.slice(0, maxResults).map((r) => ({
        title: r.title,
        url: r.url,
        domain: r.domain,
        isOfficial: r.isOfficial,
      })),
      isMock: true,
    };

    // Cache fallback results too to avoid repetitive processing
    searchCache.set(cacheKey, {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return payload;
  };

  // If Tavily API Key is not configured, return curated official reference fallback
  if (!config.isConfigured) {
    return getFallbackPayload();
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(TAVILY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY.trim(),
        query,
        search_depth: config.searchDepth,
        max_results: maxResults,
        include_answer: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[TavilyService] Tavily returned status ${response.status}: ${errText}. Using curated safety fallback.`);
      // If free-tier quota exhausted (429 / 432 / 400), gracefully use curated fallback
      return getFallbackPayload();
    }

    const data = await response.json();
    const rawResults = Array.isArray(data.results) ? data.results : [];

    // Format, sanitize, deduplicate, and score results
    const seenUrls = new Set();
    const parsedResults = [];

    for (const item of rawResults) {
      const rawUrl = (item.url || '').trim();
      if (!rawUrl || seenUrls.has(rawUrl)) continue;
      seenUrls.add(rawUrl);

      const domain = extractDomain(rawUrl);
      const isOfficial = isOfficialDomain(rawUrl) || isOfficialDomain(domain);

      parsedResults.push({
        title: (item.title || 'Source Reference').trim(),
        url: rawUrl,
        snippet: (item.content || item.snippet || '').trim().slice(0, 300),
        domain,
        isOfficial,
      });
    }

    // Sort to prioritize official government/regulatory sources first
    parsedResults.sort((a, b) => (b.isOfficial ? 1 : 0) - (a.isOfficial ? 1 : 0));

    const citations = parsedResults.map((r) => ({
      title: r.title,
      url: r.url,
      domain: r.domain,
      isOfficial: r.isOfficial,
    }));

    const resultPayload = {
      query,
      results: parsedResults,
      citations,
      isMock: false,
    };

    // Store in query cache to preserve monthly credits
    searchCache.set(cacheKey, {
      data: resultPayload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return resultPayload;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.warn(`[TavilyService] Request timed out after ${config.timeoutMs}ms for query: "${query}"`);
    } else {
      console.warn(`[TavilyService] External search failed: ${error.message}`);
    }

    // Fall back to curated safety references so users still get authoritative guidance
    return getFallbackPayload();
  }
};

module.exports = {
  getTavilyConfig,
  isOfficialDomain,
  extractDomain,
  extractSearchQuery,
  searchWeb,
  clearSearchCache,
  searchCache,
};
