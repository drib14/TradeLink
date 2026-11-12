const { app } = require('../src/index');

/**
 * Vercel serverless entry point.
 *
 * Do not run autoInitDatabase() here. Vercel may create many independent
 * function instances, and running schema checks, ALTERs, cleanup queries and
 * seed operations on every cold start creates unnecessary concurrent database
 * traffic. Apply schema changes through the documented Knex migrations before
 * deploying instead. Runtime requests should only execute the query they need.
 */
module.exports = (req, res) => app(req, res);
