const { app } = require('../src/index');
const { autoInitDatabase } = require('../src/config/dbInit');

/**
 * Fire-and-forget background schema self-healing.
 *
 * Why NOT await: autoInitDatabase() runs 50+ sequential DB queries
 * (hasTable, hasColumn, ALTER TABLE, data backfills, index operations)
 * against remote TiDB Cloud. On a Vercel Hobby plan with a 10-second
 * function timeout, this consistently exceeds the limit, killing the
 * function before Express can send CORS headers — resulting in
 * "Failed to fetch" (statusCode 0) in the browser.
 *
 * Every controller already has defensive hasColumn/hasTable fallbacks,
 * so requests succeed even before schema sync finishes. The migration
 * runs once per cold-start container in the background.
 */
let initStarted = false;
function triggerBackgroundInit() {
  if (initStarted) return;
  initStarted = true;
  autoInitDatabase()
    .then(() => console.log('[Vercel Boot] Schema self-healing completed.'))
    .catch((err) => {
      console.warn('[Vercel Boot] Schema self-healing note:', err?.message || err);
      // Allow retry on next cold start (container recycle)
      initStarted = false;
    });
}

/**
 * Vercel serverless entry point.
 * Kicks off background schema sync but does NOT block the request.
 */
module.exports = (req, res) => {
  triggerBackgroundInit();
  return app(req, res);
};
