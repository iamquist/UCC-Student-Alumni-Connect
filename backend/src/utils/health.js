import mongoose from 'mongoose';
import { ENV } from '../config/index.js';

export const getHealthStatus = () => ({
  status: 'ok',
  uptime: process.uptime(),
  environment: ENV.NODE_ENV,
  apiPrefix: ENV.API_PREFIX,
  timestamp: new Date().toISOString(),
  memory: process.memoryUsage(),
  database: {
    status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    name: mongoose.connection.name,
  },
  version: process.env.npm_package_version || '1.0.0',
});

export const healthHandler = (req, res) => {
  const status = getHealthStatus();
  const httpStatus = status.database.status === 'connected' ? 200 : 503;
  res.status(httpStatus).json({ success: httpStatus === 200, ...status });
};

export default { getHealthStatus, healthHandler };
