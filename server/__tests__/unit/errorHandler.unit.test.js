const errorHandler = require('../../src/middleware/errorHandler');
const AppError = require('../../src/utils/AppError');

describe('Unit Test: Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/api/test' };
    res = {
      statusCode: 200,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should handle AppError with custom status code and message', () => {
    const error = new AppError('Invalid credentials.', 401);
    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'fail',
        message: 'Invalid credentials.'
      })
    );
  });

  it('should never expose stack trace in JSON response', () => {
    const error = new Error('Database connection failed');
    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(500);
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.stack).toBeUndefined();
  });

  it('should format MySQL duplicate entry error as 409 Conflict', () => {
    const error = new Error('Duplicate entry');
    error.code = 'ER_DUP_ENTRY';
    error.sqlMessage = 'Duplicate entry for key users.email';

    errorHandler(error, req, res, next);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'An account with this email address already exists.'
      })
    );
  });
});
