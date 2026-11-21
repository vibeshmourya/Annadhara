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

  // Simulate resolveBaseUrl logic
  function testResolver({ envUrl, runtimeUrl, isLocal, isDev, isProd }) {
    const rawUrl = (envUrl || runtimeUrl || '').trim();
    if (rawUrl) {
      let clean = rawUrl.replace(/\/+$/, '');
      clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');
      if (
        (clean.startsWith('http://') || clean.startsWith('https://')) &&
        !clean.endsWith('/api') &&
        !clean.includes('/api/')
      ) {
        clean = `${clean}/api`;
      }
      return clean;
    }
    if (isLocal || isDev) {
      return '/api';
    }
    return '';
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

  // Test 4: Production on remote host does NOT fall back to relative /api when unset
  total++;
  try {
    const res = testResolver({ envUrl: '', isLocal: false, isDev: false, isProd: true });
    assert(res === '', `Expected empty string in production when unset, got: '${res}'`);
    console.log('  ✅ PASSED: Test 4 - Production on remote host refuses relative /api fallback (prevents 405)');
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

