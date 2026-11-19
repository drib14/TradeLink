const rls = require('../../src/utils/rls');
const AppError = require('../../src/utils/AppError');

describe('Security Test: Row-Level Security (RLS) & Multi-Tenant Data Isolation', () => {
  // Mock Knex query builder
  const createMockDb = () => {
    const whereClauses = [];
    const query = {
      tableName: '',
      whereClauses,
      whereNull: jest.fn().mockReturnThis(),
      whereNot: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn(function (condition) {
        whereClauses.push(condition);
        if (typeof condition === 'function') {
          // Inner builder
          const subBuilder = {
            clauses: [],
            where: jest.fn(function (c) {
              this.clauses.push(c);
              return this;
            }),
            orWhere: jest.fn(function (c) {
              this.clauses.push({ or: c });
              return this;
            })
          };
          condition(subBuilder);
          this.subBuilder = subBuilder;
        }
        return this;
      })
    };

    const db = jest.fn((table) => {
      query.tableName = table;
      return query;
    });

    return { db, query };
  };

  describe('scopedListings', () => {
    it('should restrict unauthenticated guest callers strictly to status = "active"', () => {
      const { db, query } = createMockDb();
      rls.scopedListings(db, null);

      expect(query.tableName).toBe('listings');
      expect(query.where).toHaveBeenCalledWith('status', 'active');
    });

    it('should allow student to query active items or their own items', () => {
      const { db, query } = createMockDb();
      const studentUser = { id: 'usr-student-123', role: 'student' };
      rls.scopedListings(db, studentUser);

      expect(query.tableName).toBe('listings');
      expect(query.subBuilder).toBeDefined();
      expect(query.subBuilder.where).toHaveBeenCalledWith('status', 'active');
      expect(query.subBuilder.orWhere).toHaveBeenCalledWith('seller_id', 'usr-student-123');
    });

    it('should allow administrator to query listings across all sellers', () => {
      const { db, query } = createMockDb();
      const adminUser = { id: 'usr-admin-999', role: 'admin' };
      rls.scopedListings(db, adminUser);

      expect(query.tableName).toBe('listings');
      // Admin is not scoped by status = active or seller_id
      expect(query.where).not.toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('scopedTransactions', () => {
    it('should throw 401 Unauthorized for unauthenticated callers', () => {
      const { db } = createMockDb();
      expect(() => rls.scopedTransactions(db, null)).toThrow(AppError);
    });

    it('should restrict student strictly to transactions where they are buyer or seller', () => {
      const { db, query } = createMockDb();
      const studentUser = { id: 'usr-student-456', role: 'student' };
      rls.scopedTransactions(db, studentUser);

      expect(query.tableName).toBe('transactions');
      expect(query.subBuilder).toBeDefined();
      expect(query.subBuilder.where).toHaveBeenCalledWith('buyer_id', 'usr-student-456');
      expect(query.subBuilder.orWhere).toHaveBeenCalledWith('seller_id', 'usr-student-456');
    });

    it('should permit administrator to view all transactions for audit purposes', () => {
      const { db, query } = createMockDb();
      const adminUser = { id: 'usr-admin-1', role: 'admin' };
      rls.scopedTransactions(db, adminUser);

      expect(query.tableName).toBe('transactions');
      expect(query.where).not.toHaveBeenCalled();
    });
  });

  describe('scopedConversations', () => {
    it('should throw 401 Unauthorized for unauthenticated callers', () => {
      const { db } = createMockDb();
      expect(() => rls.scopedConversations(db, null)).toThrow(AppError);
    });

    it('should restrict student strictly to conversations where they are user_one or user_two', () => {
      const { db, query } = createMockDb();
      const studentUser = { id: 'usr-student-789', role: 'student' };
      rls.scopedConversations(db, studentUser);

      expect(query.tableName).toBe('conversations');
      expect(query.subBuilder).toBeDefined();
      expect(query.subBuilder.where).toHaveBeenCalledWith('user_one_id', 'usr-student-789');
      expect(query.subBuilder.orWhere).toHaveBeenCalledWith('user_two_id', 'usr-student-789');
    });
  });

  describe('scopedVerificationRequests', () => {
    it('should restrict student caller to their own verification record', () => {
      const { db, query } = createMockDb();
      const studentUser = { id: 'usr-student-111', role: 'student' };
      rls.scopedVerificationRequests(db, studentUser);

      expect(query.tableName).toBe('verification_requests');
      expect(query.where).toHaveBeenCalledWith('user_id', 'usr-student-111');
    });

    it('should allow admin caller to view verification requests across all students', () => {
      const { db, query } = createMockDb();
      const adminUser = { id: 'usr-admin-222', role: 'admin' };
      rls.scopedVerificationRequests(db, adminUser);

      expect(query.tableName).toBe('verification_requests');
      expect(query.where).not.toHaveBeenCalled();
    });
  });
});
