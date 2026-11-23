import axios from 'axios';

/**
 * Production deployed backend URL for Annadhara (Vercel Serverless / Cloud)
 */
export const PRODUCTION_API_BASE_URL = 'https://annadhara-i83w.vercel.app/api';

/**
 * Resolves and normalizes the API base URL from Vite environment variables or runtime overrides.
 *
 * Requirements handled:
 * 1. Local Development (localhost / 127.0.0.1 / [::1] or DEV mode):
 *    - Uses '/api' proxy forwarding to http://localhost:5000.
 *    - Allows explicit local dev overrides if provided.
 * 2. Remote Production Deployment:
 *    - Relative URLs (e.g. '/api' or '/') are strictly rejected because the static
 *      frontend host cannot handle backend Express requests.
 *    - Self-referencing frontend origins (e.g. 'annadhara-6kjb.vercel.app') are
 *      rejected to prevent circular requests to the static frontend.
 *    - If a valid external backend URL is provided (via VITE_API_BASE_URL or runtime override),
 *      it is cleaned and normalized (appends '/api' if domain-only, collapses '/api/api').
 *    - If VITE_API_BASE_URL is missing, relative, or points to the frontend host,
 *      it safely and permanently defaults to PRODUCTION_API_BASE_URL
 *      ('https://annadhara-i83w.vercel.app/api').
 */
export const resolveBaseUrl = () => {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname === '[::1]');

  const isDevMode =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.DEV || import.meta.env.MODE === 'development');

  // 1. In local development environment, use Vite dev proxy '/api' by default
  if (isLocalhost || isDevMode) {
    const devEnvUrl =
      (typeof import.meta !== 'undefined' && import.meta.env && (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_BACKEND_URL
      )) || '';
    const devRuntimeUrl =
      typeof window !== 'undefined'
        ? (window.__ANNADHARA_API_BASE_URL__ ||
           window.__API_BASE_URL__ ||
           localStorage.getItem('ANNADHARA_API_BASE_URL') ||
           '')
        : '';
    const rawDev = (devRuntimeUrl || devEnvUrl || '').trim();
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

  // 2. In Remote Production Deployment:
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && (
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_BACKEND_URL
    )) || '';

  const runtimeUrl =
    typeof window !== 'undefined'
      ? (window.__ANNADHARA_API_BASE_URL__ ||
         window.__API_BASE_URL__ ||
         localStorage.getItem('ANNADHARA_API_BASE_URL') ||
         localStorage.getItem('VITE_API_BASE_URL') ||
         '')
      : '';

  const rawUrl = (runtimeUrl || envUrl || '').trim();

  if (rawUrl) {
    // Check if rawUrl is an absolute HTTP/HTTPS URL
    const isAbsolute = rawUrl.startsWith('http://') || rawUrl.startsWith('https://');

    if (isAbsolute) {
      let clean = rawUrl.replace(/\/+$/, '');
      clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');

      if (!clean.endsWith('/api') && !clean.includes('/api/')) {
        clean = `${clean}/api`;
      }

      // Guard: check if URL accidentally references the static frontend host itself
      let isSelfHost = false;
      if (typeof window !== 'undefined') {
        const currentHostname = (window.location.hostname || '').toLowerCase();
        try {
          const parsed = new URL(clean);
          if (
            parsed.hostname.toLowerCase() === currentHostname ||
            parsed.hostname.includes('annadhara-6kjb')
          ) {
            isSelfHost = true;
          }
        } catch (_) {}
      }

      // If pointing to a valid external backend domain, use it
      if (!isSelfHost) {
        return clean;
      }
    }
    // Relative URLs (like '/api') or self-referencing frontend URLs in production are invalid:
    // Fall through to PRODUCTION_API_BASE_URL
  }

  // 3. Permanent production default: Deployed Express backend on Vercel
  return PRODUCTION_API_BASE_URL;
};

export const apiBaseUrl = resolveBaseUrl();

/**
 * Helper to check whether an API base URL is currently configured
 */
export const isApiConfigured = () => {
  const current = resolveBaseUrl();
  return Boolean(current && current.length > 0);
};

// Log runtime connection diagnostics in browser console
if (typeof window !== 'undefined' && (typeof import.meta === 'undefined' || import.meta.env?.MODE !== 'test')) {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]';

  if (!isLocal) {
    console.info(`[Annadhara] Connected to backend API: ${apiBaseUrl}`);
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

    // 2. Extra safety guard: in remote production, guarantee absolute backend URL
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname === '[::1]');

    if (
      !isLocal &&
      (!config.baseURL ||
       config.baseURL === '/api' ||
       config.baseURL === '/' ||
       config.baseURL.includes('annadhara-6kjb'))
    ) {
      config.baseURL = PRODUCTION_API_BASE_URL;
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
