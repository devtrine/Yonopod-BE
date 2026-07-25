const { errorResponse } = require('../utils/response');

exports.validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return errorResponse(res, 'Validation failed', 400, errors);
    }
    
    req[source] = value;
    next();
  };
};
