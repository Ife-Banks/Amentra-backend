import { verifyAccessToken } from '../utils/jwt.js';
import { error } from '../utils/apiResponse.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return error(res, 'Access token required', 401);
  }
  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      institutionId: decoded.institutionId,
      role: decoded.role,
      departmentId: decoded.departmentId || null,
    };
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Unauthorized', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden', 403);
    }
    next();
  };
};
