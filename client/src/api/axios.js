import axios from 'axios';

/**
 * Resolves and normalizes the API base URL from Vite environment variables or runtime overrides.
 *
 * Requirements handled:
 * 1. Reads production API base URL correctly from VITE_API_BASE_URL, VITE_API_URL, or VITE_BACKEND_URL.
 * 2. Checks runtime overrides (window.__ANNADHARA_API_BASE_URL__ or localStorage 'ANNADHARA_API_BASE_URL').
 * 3. Falls back safely during local development (returns '/api' for Vite dev proxy forwarding to localhost:5000).
 * 4. Does NOT fall back to relative '/api' in production if the backend is deployed on a separate domain,
 *    preventing accidental POST/PUT requests to the static frontend host that result in HTTP 405 / 404.
 * 5. Handles trailing slashes properly (prevents double slashes like /api//auth/login).
 * 6. Avoids duplicated prefixes (such as /api/api/auth/login).
 * 7. Automatically appends '/api' to domain-only URLs (e.g. https://backend.vercel.app -> https://backend.vercel.app/api).
 */
export const resolveBaseUrl = () => {
  // 1. Check Vite build-time environment variables
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL
    )) || '';

  // 2. Check browser runtime overrides (DevTools / Dynamic config / LocalStorage)
  const runtimeUrl =
    typeof window !== 'undefined'
      ? (window.__ANNADHARA_API_BASE_URL__ ||
         window.__API_BASE_URL__ ||
         localStorage.getItem('ANNADHARA_API_BASE_URL') ||
         localStorage.getItem('VITE_API_BASE_URL') ||
         '')
      : '';

  const rawUrl = (envUrl || runtimeUrl || '').trim();

  if (rawUrl) {
    let clean = rawUrl.replace(/\/+$/, ''); // Strip all trailing slashes
    clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api'); // Collapse any duplicate /api/api

    // If full domain URL without /api, append /api
    if (
      (clean.startsWith('http://') || clean.startsWith('https://')) &&
      !clean.endsWith('/api') &&
      !clean.includes('/api/')
    ) {
      clean = `${clean}/api`;
    }

    return clean;
  }

  // 3. Check if running in local development environment
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '[::1]');

  const isDevMode =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.DEV || import.meta.env.MODE === 'development');

  if (isLocalhost || isDevMode) {
    // In local development, Vite dev server proxies '/api' -> http://localhost:5000
    return '/api';
  }

  // 4. In production deployed on a remote domain without configured VITE_API_BASE_URL:
  // Do NOT fall back to relative '/api' on a remote frontend host because requests
  // would be intercepted by static hosting and return HTTP 405 Method Not Allowed.
  return '';
};

export const apiBaseUrl = resolveBaseUrl();

/**
 * Helper to check whether an API base URL is currently configured
 */
export const isApiConfigured = () => {
  const current = resolveBaseUrl();
  return Boolean(current && current.length > 0);
};

// Log clear runtime diagnostic warning if deployed to production without an API URL
if (typeof window !== 'undefined' && (typeof import.meta === 'undefined' || import.meta.env?.MODE !== 'test')) {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]';

  if (!isLocal && !apiBaseUrl) {
    console.warn(
      `[Annadhara] ⚠️ Production Warning: No API base URL configured.\n` +
      `Your frontend is deployed on Vercel separately from your backend.\n` +
      `Configure VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api in your frontend Vercel Project Settings (Environment Variables) and redeploy.\n` +
      `You can also set it dynamically in the browser console via:\n` +
      `localStorage.setItem('ANNADHARA_API_BASE_URL', 'https://<your-backend-project>.vercel.app/api'); location.reload();`
    );
  }
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout accommodates cloud serverless cold starts
});

// Request interceptor: attach token, prevent duplicate /api & double slashes, and guard unconfigured production URLs
api.interceptors.request.use(
  (config) => {
    // 1. Resolve current active base URL (enables runtime updates via localStorage)
    const currentBase = resolveBaseUrl();
    if (currentBase) {
      config.baseURL = currentBase;
    }

    // 2. Guard against unconfigured production backend
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '[::1]');

    const isProd = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD;

    if (
      isProd &&
      !isLocal &&
      !config.baseURL &&
      !config.url?.startsWith('http://') &&
      !config.url?.startsWith('https://')
    ) {
      const err = new Error(
        'Annadhara API base URL is not configured for production. Please add VITE_API_BASE_URL=https://<your-backend>.vercel.app/api in Vercel Project Settings and redeploy.'
      );
      err.isConfigError = true;
      return Promise.reject(err);
    }

    // 3. Sanitize URL to avoid double slashes and duplicated /api prefixes
    if (config.url) {
      // Ensure single leading slash if relative
      if (!config.url.startsWith('/') && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        config.url = `/${config.url}`;
      }

      // Collapse multiple consecutive slashes (e.g. /api//auth/login -> /api/auth/login)
      if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        config.url = config.url.replace(/\/+/g, '/');
      }

      // If baseURL already ends with /api, remove redundant /api from config.url
      if (config.baseURL && config.baseURL.endsWith('/api')) {
        if (config.url.startsWith('/api/')) {
          config.url = config.url.replace(/^\/api\//, '/');
        } else if (config.url === '/api') {
          config.url = '/';
        }
      }
    }

    // 4. Attach JWT authentication token if present
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('foodbridge_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 session expiration and enrich diagnostic errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Session expiration on 401 Unauthorized
    if (error.response && error.response.status === 401) {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('foodbridge_token')) {
        localStorage.removeItem('foodbridge_token');
        localStorage.removeItem('foodbridge_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    }

    // 2. HTTP 405 Method Not Allowed diagnosis
    if (error.response && error.response.status === 405) {
      error.message =
        'HTTP 405 Method Not Allowed: The API request reached a static frontend server instead of the Express backend. In your Vercel Frontend Project Settings, set VITE_API_BASE_URL=https://<your-backend-project>.vercel.app/api and redeploy.';
    }

    // 3. HTTP 404 Not Found diagnosis for API routes
    if (error.response && error.response.status === 404 && error.config?.url?.includes('/auth/')) {
      error.message =
        'HTTP 404 Not Found: Authentication endpoint not found on the requested server. Verify VITE_API_BASE_URL points to the deployed Annadhara backend (e.g. https://<backend>.vercel.app/api).';
    }

    return Promise.reject(error);
  }
);

export default api;
