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

  // Handle database connection / SSL / network errors — never expose raw driver messages
  const errMsg = (err.message || '').toLowerCase();
  const errCode = err.code || '';
  if (
    errCode === 'ECONNREFUSED' || errCode === 'ENOTFOUND' || errCode === 'ETIMEDOUT' ||
    errCode === 'PROTOCOL_CONNECTION_LOST' || errCode === 'ER_ACCESS_DENIED_ERROR' ||
    errCode === 'ER_DBACCESS_DENIED_ERROR' || errCode === 'ER_CON_COUNT_ERROR' ||
    errMsg.includes('insecure transport') ||
    errMsg.includes('ssl') && (errMsg.includes('required') || errMsg.includes('prohibited')) ||
    errMsg.includes('econnrefused') || errMsg.includes('enotfound') ||
    errMsg.includes('connect etimedout') ||
    errMsg.includes('too many connections') ||
    errMsg.includes('connection lost')
  ) {
    statusCode = 503;
    status = 'error';
    message = 'Service temporarily unavailable. Please try again in a few moments.';
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
      message = `Uploaded file exceeds maximum allowed size of ${env.upload.maxSizeMB || 15}MB.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded in a single request (maximum 5 files).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field in upload payload.';
    }
  }

  // Log error stack securely for server-side debugging
  if (statusCode === 500) {
    logger.error(`[Unhandled Error] [${req.id || 'no-id'}] ${req.method} ${req.originalUrl}: %s`, err.stack || err.message);
    if (env.env === 'production') {
      message = 'An unexpected server error occurred. Please try again later.';
    }
  } else {
    logger.warn(`[Client Error ${statusCode}] [${req.id || 'no-id'}] ${req.method} ${req.originalUrl}: ${message}`);
  }

  const responseBody = {
    status,
    message,
    ...(req.id ? { requestId: req.id } : {})
  };

  res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
