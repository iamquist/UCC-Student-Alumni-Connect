const ALLOWED_PATHS = ['/health', '/api/v1/health'];

export const maintenanceMode = (req, res, next) => {
  const isInMaintenance = process.env.MAINTENANCE_MODE === 'true';
  if (!isInMaintenance) return next();
  if (ALLOWED_PATHS.some(p => req.path.startsWith(p))) return next();
  res.status(503).json({
    success: false,
    message: 'The platform is currently undergoing scheduled maintenance. Please try again shortly.',
    data: null,
    retryAfter: process.env.MAINTENANCE_RETRY_AFTER || '30 minutes',
  });
};

export default { maintenanceMode };
