import winston from 'winston';
import { ENV } from '../config/index.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: ENV.isDev ? 'debug' : 'info',
  format: combine(timestamp({ format: 'HH:mm:ss' }), ENV.isDev ? combine(colorize(), devFormat) : json()),
  transports: [
    new winston.transports.Console(),
    ...(ENV.isProd ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' }),
    ] : []),
  ],
});

export function error(message, err) {
  logger.error(message, err ? { stack: err.stack, message: err.message } : {});
}
export function warn(message, meta = {}) { logger.warn(message, meta); }
export function info(message, meta = {}) { logger.info(message, meta); }
export function debug(message, meta = {}) { logger.debug(message, meta); }

export function logRequest(req, res, responseTime) {
  const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`, {
    ip: req.ip, userAgent: req.get('user-agent'),
  });
}

export function logAuth(event, userId, success, details = {}) {
  logger.info(`AUTH:${event}`, { userId, success, ...details });
}

export function logSecurity(event, details = {}) {
  logger.warn(`SECURITY:${event}`, details);
}

export function createLogger(context) {
  return {
    info: (msg, meta) => logger.info(`[${context}] ${msg}`, meta),
    warn: (msg, meta) => logger.warn(`[${context}] ${msg}`, meta),
    error: (msg, err) => error(`[${context}] ${msg}`, err),
    debug: (msg, meta) => logger.debug(`[${context}] ${msg}`, meta),
  };
}

export default { error, warn, info, debug, logRequest, logAuth, logSecurity, createLogger };
