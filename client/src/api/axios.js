import axios from 'axios';

/**
 * Resolves and normalizes the API base URL from Vite environment variables.
 * Handles common deployment misconfigurations:
 * - Supports VITE_API_BASE_URL, VITE_API_URL, and VITE_BACKEND_URL
 * - Automatically ensures /api prefix for full URLs (e.g. https://backend.vercel.app -> https://backend.vercel.app/api)
 * - Collapses duplicate /api/api
 * - Strips trailing slashes
 * - Falls back to '/api' for local dev proxy
 */
const resolveBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, ''); // Strip trailing slashes

    // Collapse any duplicate /api/api
    clean = clean.replace(/\/api\/api(?:\/|$)/g, '/api');

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

  // Local development fallback (Vite proxy forwards /api -> http://localhost:5000)
  return '/api';
};

export const apiBaseUrl = resolveBaseUrl();

// Log runtime diagnostic warning in production if baseURL is left relative
if (typeof window !== 'undefined' && import.meta.env.MODE !== 'test') {
  if (
    import.meta.env.PROD &&
    apiBaseUrl === '/api' &&
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    console.warn(
      `[Annadhara] Notice: Frontend is using relative baseURL '${apiBaseUrl}'. ` +
        `If your backend is deployed as a separate Vercel project, configure VITE_API_BASE_URL=https://<your-backend>.vercel.app/api in Vercel Project Settings.`
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

// Request interceptor: attach token & prevent duplicate /api in path
api.interceptors.request.use(
  (config) => {
    // 1. Prevent accidental duplicate /api/api if config.url starts with /api
    if (config.url && config.baseURL && config.baseURL.endsWith('/api')) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api\//, '/');
      } else if (config.url === '/api') {
        config.url = '/';
      }
    }

    // 2. Attach JWT authentication token
    const token = localStorage.getItem('foodbridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 expiration and enrich connection errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('foodbridge_token')) {
        localStorage.removeItem('foodbridge_token');
        localStorage.removeItem('foodbridge_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

