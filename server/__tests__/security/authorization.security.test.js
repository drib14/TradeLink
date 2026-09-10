const { requireRole, requireVerified } = require('../../src/middleware/rbac');

describe('Security Test: RBAC & Authorization (Privilege Escalation Prevention)', () => {
  let req, res, next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should block student from accessing admin-only actions (403 Forbidden)', () => {
    req = {
      user: {
        id: 'usr_student_123',
        role: 'student',
        name: 'Alex Rivera'
      }
    };

    const adminMiddleware = requireRole('admin');
    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('administrative permission');
  });

  it('should allow admin user to proceed past requireRole("admin")', () => {
    req = {
      user: {
        id: 'usr_admin_001',
        role: 'admin',
        name: 'UC Admin Moderator'
      }
    };

    const adminMiddleware = requireRole('admin');
    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should block unverified students from features requiring student ID verification', () => {
    req = {
      user: {
        id: 'usr_student_unverified',
        role: 'student',
        is_verified: false
      }
    };

    requireVerified(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Student ID verification required');
  });

  it('should allow verified students to pass requireVerified', () => {
    req = {
      user: {
        id: 'usr_student_verified',
        role: 'student',
        is_verified: true
      }
    };

    requireVerified(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
