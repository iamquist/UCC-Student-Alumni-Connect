import { sendForbidden } from '../utils/responseUtils.js';

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) return sendForbidden(res, 'Authentication required');
    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, `Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireStudent = requireRole('student');
export const requireAlumni = requireRole('alumni');
export const requireStudentOrAlumni = requireRole(['student', 'alumni']);

export function requireOwnershipOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    if (!req.user) return sendForbidden(res, 'Authentication required');
    if (req.user.role === 'admin') return next();
    try {
      const ownerId = await getResourceOwnerId(req);
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return sendForbidden(res, 'You do not own this resource');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export default { requireRole, requireAdmin, requireStudent, requireAlumni, requireStudentOrAlumni, requireOwnershipOrAdmin };
