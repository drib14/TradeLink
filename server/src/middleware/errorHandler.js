const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let status = err.status || 'error';

  // Handle MySQL errors
  // Handle MySQL duplicate errors securely without exposing column internals
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    status = 'fail';
    if (err.sqlMessage && err.sqlMessage.includes('email')) {
      message = 'An account with this email address already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('student_id')) {
      message = 'An account with this ID number is already registered.';
    } else {
      message = 'A record with this information already exists.';
    }
  }

  // Handle JWT specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Your session has expired. Please log in again.';
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    status = 'fail';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `Uploaded file exceeds maximum allowed size of ${env.upload.maxSizeMB}MB.`;
    }
  }

  // Log error stack securely for server-side debugging
  if (statusCode === 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}: %s`, err.stack || err.message);
    if (env.env === 'production') {
      message = 'An unexpected server error occurred. Please try again later.';
    }
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  const responseBody = {
    status,
    message
  };

  // Only expose detailed validation schema errors in non-production
  if (err.errors && env.env !== 'production') {
    responseBody.errors = err.errors;
  }

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
