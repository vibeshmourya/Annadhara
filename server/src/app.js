require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getDbStatus, connectDB, getDbDiagnostics } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donationRoutes = require('./routes/donationRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const handoverRoutes = require('./routes/handoverRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration supporting deployed Vercel domains, custom origins, and mobile clients
const getAllowedOrigins = () => {
  const origins = [];
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .forEach((url) => origins.push(url));
  }
  return origins;
};

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Allow mobile apps, curl, Postman, and server-to-server requests without Origin header
    if (!origin) {
      return callback(null, true);
    }

    const allowed = getAllowedOrigins();

    // 2. Exact match against CLIENT_URL environment variable
    if (allowed.includes(origin)) {
      return callback(null, true);
    }

    // 3. Allow localhost / loopback during local development
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      return callback(null, true);
    }

    // 4. Automatically allow Vercel web deployments (*.vercel.app preview & production)
    if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // 5. Allow any origin if no specific CLIENT_URL was configured, or in dev/test
    if (allowed.length === 0 || process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive to avoid breaking client-server communication
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Range',
  ],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // Cache preflight for 24 hours
};

// Immediate preflight short-circuit: always reply 204 to OPTIONS with CORS headers
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Range');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight OPTIONS on all routes

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// URL Normalization Middleware: safely collapses accidental duplicate /api/api prefixes
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }
  next();
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static file serving for uploads (images)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

/**
 * Serverless Database Connection Middleware:
 * Ensures MongoDB Atlas connection is active and reused across serverless invocations.
 * Non-blocking for root / health check requests so status can always be reported.
 */
app.use(async (req, res, next) => {
  const isInfoPath =
    req.path === '/' ||
    req.path === '/api' ||
    req.path === '/api/health' ||
    req.path === '/health' ||
    req.path.startsWith('/uploads');

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[Serverless Database Middleware Error]:', err.message);
    if (isInfoPath) {
      return next();
    }
    const diag = getDbDiagnostics();
    return res.status(503).json({
      success: false,
      message: 'Database service is currently unavailable. Please verify MongoDB Atlas network whitelist (0.0.0.0/0) and credentials.',
      database: getDbStatus(),
      diagnostics: {
        envConfigured: diag.envConfigured,
        cluster: diag.clusterHost,
        database: diag.dbName,
        reason: diag.lastError || err.message,
      },
    });
  }
});

/**
 * Root & Base API Info Endpoints
 * GET / and GET /api
 * Prevents 404 on base URL visits, connects to DB, and informs client of available endpoints.
 */
app.get(['/', '/api'], async (req, res) => {
  if (getDbStatus() !== 'connected') {
    try { await connectDB(); } catch (_) {}
  }

  const dbStatus = getDbStatus();
  const isConnected = dbStatus === 'connected';
  const diag = getDbDiagnostics();

  res.status(200).json({
    success: true,
    message: 'Annadhara API is running',
    status: isConnected ? 'online' : 'degraded',
    database: dbStatus,
    ...(isConnected
      ? {
          databaseDetails: {
            type: diag.isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Custom)',
            cluster: diag.clusterHost,
            database: diag.dbName,
          },
        }
      : {
          diagnostics: {
            envConfigured: diag.envConfigured,
            envVariable: diag.envVariableDetected,
            cluster: diag.clusterHost,
            reason: diag.lastError,
            recommendations: diag.recommendations,
          },
        }),
    version: '1.0.0',
    tagline: 'Surplus Food. Shared Hope. Zero Waste.',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      donations: '/api/donations',
      reservations: '/api/reservations',
      pickups: '/api/pickups',
      handover: '/api/handover',
      organizations: '/api/organizations',
      users: '/api/users',
      dashboard: '/api/dashboard',
      upload: '/api/upload',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Health check endpoint
 * GET /api/health and GET /health
 * Returns: API status, live MongoDB Atlas database connection status, server timestamp, and safe diagnostics
 */
app.get(['/api/health', '/health'], async (req, res) => {
  if (getDbStatus() !== 'connected') {
    try { await connectDB(); } catch (_) {}
  }

  const dbStatus = getDbStatus();
  const isHealthy = dbStatus === 'connected';
  const diag = getDbDiagnostics();

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? 'Annadhara API is running' : 'Annadhara API is degraded (database unavailable)',
    status: isHealthy ? 'online' : 'degraded',
    database: dbStatus,
    ...(isHealthy
      ? {
          databaseDetails: {
            type: diag.isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB (Custom)',
            cluster: diag.clusterHost,
            database: diag.dbName,
          },
        }
      : {
          diagnostics: {
            envConfigured: diag.envConfigured,
            envVariable: diag.envVariableDetected,
            cluster: diag.clusterHost,
            reason: diag.lastError,
            recommendations: diag.recommendations,
          },
        }),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// API Routes mounted with both /api/* and /* aliases for complete routing resilience
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/organizations', '/organizations'], organizationRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/donations', '/donations'], donationRoutes);
app.use(['/api/reservations', '/reservations'], reservationRoutes);
app.use(['/api/pickups', '/pickups'], pickupRoutes);
app.use(['/api/handover', '/handover'], handoverRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/dashboard', '/dashboard'], dashboardRoutes);
app.use(['/api/upload', '/upload'], uploadRoutes);

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found`,
    suggestion: 'Refer to /api/health or /api for available endpoints',
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;

