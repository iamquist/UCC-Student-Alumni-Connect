import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV, CORS_CONFIG, UPLOAD_CONFIG } from './config/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Security headers ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: ENV.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ───────────────────────────────────────────────────────
app.use(cors(CORS_CONFIG));
app.options('*', cors(CORS_CONFIG));

// ── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Sanitize NoSQL injection ────────────────────────────────────
app.use(mongoSanitize());

// ── Compression ────────────────────────────────────────────────
app.use(compression());

// ── HTTP logging ───────────────────────────────────────────────
if (ENV.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Static uploads ─────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', UPLOAD_CONFIG.dir)));

// ── Rate limiting ──────────────────────────────────────────────
app.use(ENV.API_PREFIX, apiLimiter);

// ── API Routes ─────────────────────────────────────────────────
app.use(ENV.API_PREFIX, routes);

// ── Health check (no prefix) ───────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'UniAlum API',
    version: '1.0.0',
    env: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── 404 and Error handlers ─────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
