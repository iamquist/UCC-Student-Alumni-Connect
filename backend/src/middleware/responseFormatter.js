import { sendSuccess, sendError } from '../utils/responseUtils.js';

export const responseFormatter = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson(data);
    }
    return originalJson({ success: true, message: 'OK', data });
  };
  next();
};

export { sendSuccess, sendError };
export default { responseFormatter, sendSuccess, sendError };
