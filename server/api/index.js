const { app } = require('../src/index');
const { autoInitDatabase } = require('../src/config/dbInit');
const logger = require('../src/utils/logger');

let initPromise = null;
function ensureDatabaseInitialized() {
  if (!initPromise) {
    initPromise = autoInitDatabase().catch((err) => {
      logger.error(`[Vercel Serverless] DB init warning: ${err.message}`);
    });
  }
  return initPromise;
}

/**
 * Vercel Serverless Function entrypoint exporting Express application with cold-start DB init
 */
module.exports = async (req, res) => {
  await ensureDatabaseInitialized();
  return app(req, res);
};
