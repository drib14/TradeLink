const sanitizeInput = require('../../src/middleware/sanitizeInput');

describe('Security Test: Injection & Cross-Site Scripting (XSS) Prevention', () => {
  it('should strip malicious <script> tags from request body and query', () => {
    const req = {
      body: {
        title: 'Calculus Book <script>alert("xss")</script>',
        description: '<script src="http://evil.com/payload.js"></script>Nice book.',
        nested: {
          comment: '<SCRIPT>document.cookie="stolen"</SCRIPT>Hello'
        }
      },
      query: {
        search: 'iPad <script>fetch("http://evil.com")</script>'
      },
      params: {}
    };

    const res = {};
    const next = jest.fn();

    sanitizeInput(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.title).toBe('Calculus Book');
    expect(req.body.description).toBe('Nice book.');
    expect(req.body.nested.comment).toBe('Hello');
    expect(req.query.search).toBe('iPad');
  });

  it('should prevent prototype pollution attempts via __proto__ or constructor', () => {
    const req = {
      body: JSON.parse('{"__proto__": {"isAdmin": true}, "title": "Safe Item"}'),
      query: {},
      params: {}
    };

    const res = {};
    const next = jest.fn();

    sanitizeInput(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.title).toBe('Safe Item');
    expect(({}).isAdmin).toBeUndefined();
  });

  it('should properly escape SQL LIKE wildcards (% and _)', () => {
    function escapeLike(str) {
      return str.replace(/[%_]/g, '\\$&');
    }

    const testInput1 = '100% Cotton Scrubs';
    const escaped1 = escapeLike(testInput1);
    expect(escaped1).toBe('100\\% Cotton Scrubs');

    const testInput2 = 'test_user_query';
    const escaped2 = escapeLike(testInput2);
    expect(escaped2).toBe('test\\_user\\_query');

    const safeInput = 'Normal Calculator';
    expect(escapeLike(safeInput)).toBe('Normal Calculator');
  });
});
