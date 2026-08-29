const logger = require('../utils/logger');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let status = err.status || 'error';

  // Handle MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    status = 'fail';
    if (err.sqlMessage && err.sqlMessage.includes('email')) {
      message = 'An account with this email address already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('student_id')) {
      message = 'An account with this Student ID is already registered.';
    } else {
      message = 'Duplicate record found.';
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

  // Log error stack for 500 or unexpected exceptions
  if (statusCode === 500) {
    logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}: %s`, err.stack);
  } else {
    logger.warn(`[Client Error ${statusCode}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  res.status(statusCode).json({
    status,
    message,
    ...(err.errors && { errors: err.errors })
  });
};

module.exports = errorHandler;
