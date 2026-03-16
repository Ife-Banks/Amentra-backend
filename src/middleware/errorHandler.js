import { error } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error({ err: err.message, stack: err.stack });

  if (err.name === 'CastError') {
    return error(res, 'Invalid ID format', 400);
  }
  if (err.name === 'ValidationError') {
    const fieldErrors = Object.entries(err.errors).map(([k, v]) => ({ field: k, message: v.message }));
    return error(res, 'Validation failed', 400, fieldErrors);
  }
  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    return error(res, `Duplicate value for ${field}`, 409);
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return error(res, 'Invalid or expired token', 401);
  }
  if (err.name === 'MulterError') {
    return error(res, err.message || 'File upload error', 400);
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  const errors = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  return res.status(statusCode).json({ success: false, message, ...(errors && { errors }) });
};
