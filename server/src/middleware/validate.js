const AppError = require('../utils/AppError');

/**
 * Validates request data (body, query, or params) against a Joi schema
 * @param {import('joi').ObjectSchema} schema
 * @param {'body' | 'query' | 'params'} property
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, '')
      }));

      return next(
        new AppError(
          details[0]?.message || 'Input validation failed.',
          400,
          details
        )
      );
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
