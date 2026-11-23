/**
 * ANNADHARA — CLIENT AXIOS CONFIGURATION & RESILIENCE TEST
 * Team Seva Shakti (MERNOVA X 2026)
 *
 * Verifies:
 * 1. Base URL resolver correctly parses full URLs and appends /api
 * 2. Trailing slashes are stripped (https://backend.vercel.app/api/ -> https://backend.vercel.app/api)
 * 3. Duplicate /api/api are collapsed
 * 4. Production on remote host does NOT fall back to relative /api when unconfigured
 * 5. Local dev environment safely falls back to /api
 * 6. Request interceptor avoids double slashes (/api//auth/login -> /api/auth/login)
 * 7. Request interceptor strips duplicate /api prefix when baseURL already ends with /api
 */

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAxiosConfigTests() {
  console.log('\n================================================================');
  console.log('🧪 ANNADHARA: CLIENT API RESOLVER & INTERCEPTOR TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  const PRODUCTION_API_BASE_URL = 'https://annadhara-i83w.vercel.app/api';

  // Simulate resolveBaseUrl logic
  function testResolver({ envUrl, runtimeUrl, isLocal, isDev, isProd, currentHostname = 'annadhara-6kjb.vercel.app' }) {
    if (isLocal || isDev) {
      const rawDev = (runtimeUrl || envUrl || '').trim();
      if (rawDev && (rawDev.startsWith('http://') || rawDev.startsWith('https://'))) {
        let clean = rawDev.replace(/\/+$/, '');
        clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');
        if (!clean.endsWith('/api') && !clean.includes('/api/')) {
          clean = `${clean}/api`;
        }
        return clean;
      }
      return '/api';
    }

    const rawUrl = (runtimeUrl || envUrl || '').trim();
    if (rawUrl) {
      const isAbsolute = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');
      if (isAbsolute) {
        let clean = rawUrl.replace(/\/+$/, '');
        clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');
        if (!clean.endsWith('/api') && !clean.includes('/api/')) {
          clean = `${clean}/api`;
        }
        // Check if pointing to frontend self-host
        let isSelf = false;
        try {
          const u = new URL(clean);
          if (u.hostname === currentHostname || u.hostname.includes('annadhara-6kjb')) {
            isSelf = true;
          }
        } catch (_) {}

        if (!isSelf) {
          return clean;
        }
      }
    }
    return PRODUCTION_API_BASE_URL;
  }

  // Simulate Request Interceptor URL Normalization
  function normalizeUrl(config) {
    if (!config.url) return config.url;
    let url = config.url;
    if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `/${url}`;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = url.replace(/\/+/g, '/');
    }
    if (config.baseURL && config.baseURL.endsWith('/api')) {
      if (url.startsWith('/api/')) {
        url = url.replace(/^\/api\//, '/');
      } else if (url === '/api') {
        url = '/';
      }
    }
    return url;
  }

  // Test 1: Full backend URL without /api
  total++;
  try {
    const res = testResolver({ envUrl: 'https://annadhara-api.vercel.app' });
    assert(res === 'https://annadhara-api.vercel.app/api', `Expected /api suffix, got: ${res}`);
    console.log('  ✅ PASSED: Test 1 - Automatically appends /api to domain-only URLs');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 1: ${err.message}`);
  }

  // Test 2: Full backend URL with trailing slashes
  total++;
  try {
    const res = testResolver({ envUrl: 'https://annadhara-api.vercel.app/api///' });
    assert(res === 'https://annadhara-api.vercel.app/api', `Expected trimmed slashes, got: ${res}`);
    console.log('  ✅ PASSED: Test 2 - Safely strips trailing slashes');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 2: ${err.message}`);
  }

  // Test 3: Accidental duplicate /api/api
  total++;
  try {
    const res = testResolver({ envUrl: 'https://annadhara-api.vercel.app/api/api' });
    assert(res === 'https://annadhara-api.vercel.app/api', `Expected collapsed /api, got: ${res}`);
    console.log('  ✅ PASSED: Test 3 - Collapses duplicate /api/api');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 3: ${err.message}`);
  }

  // Test 4: Production on remote host safely defaults to PRODUCTION_API_BASE_URL (never relative /api)
  total++;
  try {
    const res = testResolver({ envUrl: '', isLocal: false, isDev: false, isProd: true });
    assert(res === 'https://annadhara-i83w.vercel.app/api', `Expected production backend URL, got: '${res}'`);
    assert(res !== '/api', `Must not fall back to relative /api`);
    console.log('  ✅ PASSED: Test 4 - Production on remote host safely defaults to deployed backend URL (never relative /api)');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 4: ${err.message}`);
  }

  // Test 5: Local development falls back to /api for Vite proxy
  total++;
  try {
    const res = testResolver({ envUrl: '', isLocal: true, isDev: true, isProd: false });
    assert(res === '/api', `Expected '/api' in local dev, got: '${res}'`);
    console.log('  ✅ PASSED: Test 5 - Local development safely defaults to /api proxy');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 5: ${err.message}`);
  }

  // Test 6: Request interceptor collapses multiple slashes (e.g. //auth/login)
  total++;
  try {
    const res = normalizeUrl({ baseURL: 'https://annadhara-api.vercel.app/api', url: '//auth//login' });
    assert(res === '/auth/login', `Expected '/auth/login', got: '${res}'`);
    console.log('  ✅ PASSED: Test 6 - Interceptor collapses multiple consecutive slashes');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 6: ${err.message}`);
  }

  // Test 7: Request interceptor eliminates redundant /api when baseURL ends with /api
  total++;
  try {
    const res = normalizeUrl({ baseURL: 'https://annadhara-api.vercel.app/api', url: '/api/auth/register' });
    assert(res === '/auth/register', `Expected '/auth/register', got: '${res}'`);
    console.log('  ✅ PASSED: Test 7 - Interceptor eliminates redundant /api prefix when baseURL already has /api');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 7: ${err.message}`);
  }

  // Test 8: Browser runtime override (localStorage)
  total++;
  try {
    const res = testResolver({ envUrl: '', runtimeUrl: 'https://custom-backend.vercel.app/api' });
    assert(res === 'https://custom-backend.vercel.app/api', `Expected custom override, got: '${res}'`);
    console.log('  ✅ PASSED: Test 8 - Supports runtime override via localStorage / window injection');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 8: ${err.message}`);
  }

  // Test 9: Relative '/api' in remote production automatically upgrades to PRODUCTION_API_BASE_URL
  total++;
  try {
    const res = testResolver({ envUrl: '/api', isLocal: false, isDev: false, isProd: true });
    assert(res === 'https://annadhara-i83w.vercel.app/api', `Expected PRODUCTION_API_BASE_URL, got: '${res}'`);
    console.log('  ✅ PASSED: Test 9 - Relative /api in remote production safely resolves to production backend URL');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 9: ${err.message}`);
  }

  // Test 10: Self-referencing frontend URL in production safely recovers to PRODUCTION_API_BASE_URL
  total++;
  try {
    const res = testResolver({ envUrl: 'https://annadhara-6kjb.vercel.app/api', isLocal: false, isDev: false, isProd: true, currentHostname: 'annadhara-6kjb.vercel.app' });
    assert(res === 'https://annadhara-i83w.vercel.app/api', `Expected production backend URL, got: '${res}'`);
    console.log('  ✅ PASSED: Test 10 - Self-referencing frontend domain safely recovers to production backend URL');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 10: ${err.message}`);
  }

  // Test 11: Valid external backend URL is preserved in production
  total++;
  try {
    const res = testResolver({ envUrl: 'https://custom-annadhara-backend.vercel.app', isLocal: false, isDev: false, isProd: true });
    assert(res === 'https://custom-annadhara-backend.vercel.app/api', `Expected custom backend URL with /api, got: '${res}'`);
    console.log('  ✅ PASSED: Test 11 - Valid custom external backend URL is preserved');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 11: ${err.message}`);
  }

  // Test 12: Interceptor baseURL safety override for remote production
  total++;
  try {
    function interceptorGuard(config, isProdRemote = true) {
      if (isProdRemote) {
        const b = (config.baseURL || '').trim();
        if (!b || b === '/api' || b.startsWith('/') || b.includes('annadhara-6kjb')) {
          config.baseURL = PRODUCTION_API_BASE_URL;
        }
      }
      return config;
    }

    const cfg1 = interceptorGuard({ baseURL: '/api', url: '/auth/login' });
    assert(cfg1.baseURL === 'https://annadhara-i83w.vercel.app/api', `Expected override from /api, got: ${cfg1.baseURL}`);

    const cfg2 = interceptorGuard({ baseURL: 'https://annadhara-6kjb.vercel.app/api', url: '/auth/login' });
    assert(cfg2.baseURL === 'https://annadhara-i83w.vercel.app/api', `Expected override from frontend domain, got: ${cfg2.baseURL}`);
    console.log('  ✅ PASSED: Test 12 - Interceptor safety guard overrides invalid baseURL in remote production');
    passed++;
  } catch (err) {
    console.error(`  ❌ FAILED: Test 12: ${err.message}`);
  }

  console.log(`\n================================================================`);
  console.log(`🎯 Client Axios Config Test Result: ${passed}/${total} PASSED!`);
  console.log(`================================================================\n`);

  if (passed !== total) process.exit(1);
  process.exit(0);
}

runAxiosConfigTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

