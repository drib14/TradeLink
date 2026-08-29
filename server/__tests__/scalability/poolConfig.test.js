const knexfile = require('../../knexfile');

describe('Scalability Test: Database Pool & Connection Configuration', () => {
  it('should have production pool scaled to handle high concurrent user traffic', () => {
    const prodConfig = knexfile.production;
    expect(prodConfig).toBeDefined();
    expect(prodConfig.pool.max).toBeGreaterThanOrEqual(20);
    expect(prodConfig.pool.min).toBeGreaterThanOrEqual(2);
    expect(prodConfig.pool.acquireTimeoutMillis).toBeDefined();
    expect(prodConfig.pool.idleTimeoutMillis).toBeDefined();
  });

  it('should have development pool properly constrained to avoid connection leaks', () => {
    const devConfig = knexfile.development;
    expect(devConfig).toBeDefined();
    expect(devConfig.pool.max).toBeLessThanOrEqual(20);
    expect(devConfig.pool.acquireTimeoutMillis).toBe(30000);
  });
});
