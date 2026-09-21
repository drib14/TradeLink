const path = require('path');
const dotenv = require('dotenv');

// Load environment-specific .env file, then fall back to .env
const envMode = process.env.NODE_ENV || 'development';
const envSpecificFile = path.resolve(__dirname, `.env.${envMode}`);
const envDefaultFile = path.resolve(__dirname, '.env');

const specificResult = dotenv.config({ path: envSpecificFile });
if (specificResult.error) {
  dotenv.config({ path: envDefaultFile });
}

const getSslConfig = () => {
  if (process.env.DB_SSL === 'true') {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return false;
};

const buildConnection = (defaultDbName = 'tradelink_db_test') => {
  const ssl = getSslConfig();
  if (process.env.DATABASE_URL) {
    const connObj = {
      uri: process.env.DATABASE_URL,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    };
    if (ssl) connObj.ssl = ssl;
    return connObj;
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || defaultDbName,
    charset: 'utf8mb4',
    timezone: '+00:00',
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl
  };
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: buildConnection('tradelink_db'),
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  test: {
    client: 'mysql2',
    connection: process.env.TEST_DATABASE_URL
      ? (getSslConfig() ? { uri: process.env.TEST_DATABASE_URL, ssl: getSslConfig() } : process.env.TEST_DATABASE_URL)
      : buildConnection(process.env.TEST_DB_NAME || process.env.DB_NAME || 'tradelink_db'),
    pool: {
      min: 1,
      max: 10,
      acquireTimeoutMillis: 15000,
      idleTimeoutMillis: 15000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: 'mysql2',
    connection: buildConnection('tradelink_db'),
    pool: {
      min: process.env.VERCEL ? 0 : 2,
      max: process.env.VERCEL ? 10 : 25,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: process.env.VERCEL ? 10000 : 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
};
