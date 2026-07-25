const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/response');

module.exports = (err, req, res, next) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return errorResponse(res, 'Duplicate entry found', 409);
  }

  console.error('Unhandled Error:', err);
  
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  return errorResponse(res, message, 500, process.env.NODE_ENV !== 'production' ? err.stack : null);
};
