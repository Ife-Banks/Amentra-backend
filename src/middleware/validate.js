import { error } from '../utils/apiResponse.js';

export const validate = (schema) => {
  return (req, res, next) => {
    console.log('Validating with schema:', schema.constructor.name);
    console.log('Request body before validation:', req.body);
    const toValidate = { ...req.body, ...req.query, ...req.params };
    const result = schema.safeParse(toValidate);
    console.log('Validation result:', result);
    if (!result.success) {
      const err = result.error;
      const errors = err.errors ? err.errors.map((e) => (e.path && e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message)) : [err.message || 'Validation failed'];
      return error(res, 'Validation failed', 400, errors);
    }
    req.validated = result.data;
    next();
  };
};
