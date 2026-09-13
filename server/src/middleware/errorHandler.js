const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let status = err.status || 'error';

  // Handle MySQL errors securely — never expose column names or raw SQL
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    status = 'fail';
    // Provide user-friendly messages without exposing schema internals
    const sqlMsg = (err.sqlMessage || '').toLowerCase();
    if (sqlMsg.includes('email')) {
      message = 'An account with this email address already exists.';
    } else if (sqlMsg.includes('student_id')) {
      message = 'An account with this ID number is already registered.';
    } else if (sqlMsg.includes('keyword')) {
      message = 'This keyword already exists in the prohibited list.';
    } else {
      message = 'A record with this information already exists.';
    }
  } else if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    status = 'fail';
    message = 'One or more fields exceed the maximum allowed length.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    status = 'fail';
    message = 'Referenced record does not exist.';
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
