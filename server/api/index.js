const { app } = require('../src/index');
const { autoInitDatabase } = require('../src/config/dbInit');

let initPromise = null;
const ensureInitialized = async () => {
  if (!initPromise) {
    initPromise = autoInitDatabase().catch((err) => {
      console.warn('[Vercel Boot] Schema self-healing note:', err?.message || err);
      // Reset promise if failed so subsequent requests can retry
      initPromise = null;
    });
  }
  return initPromise;
};

/**
 * Vercel serverless entry point.
 * Ensures database schema, tables, and columns are synchronized on cold start.
 */
module.exports = async (req, res) => {
  await ensureInitialized();
  return app(req, res);
};
