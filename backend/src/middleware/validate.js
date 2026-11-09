import { sendError } from '../utils/apiResponse.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })) || [error.message];

    return sendError(res, 'Validation failed', errorDetails, 422);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    const errorDetails = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })) || [error.message];

    return sendError(res, 'Invalid query parameters', errorDetails, 422);
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (error) {
    const errorDetails = error.errors?.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })) || [error.message];

    return sendError(res, 'Invalid route parameters', errorDetails, 422);
  }
};
