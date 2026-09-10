const knex = require('knex');
const knexfile = require('../../knexfile');
const env = require('./env');

const environment = env.env === 'production' ? 'production' : (env.env === 'test' ? 'test' : 'development');
const db = knex(knexfile[environment]);

// Health check and connection test helper
db.testConnection = async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    return { ok: true, message: 'MySQL connection established successfully.' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
};

module.exports = db;
