require('dotenv').config();

const envMode = process.env.NODE_ENV || 'development';
const isProd = envMode === 'production';

const getSslConfig = () => {
  // Only enable SSL in production
  if (isProd && process.env.DB_SSL === 'true') {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return false;
};

const buildConnection = (defaultDbName = 'tradelink_db_test') => {
  const ssl = getSslConfig();

  // In production: use DATABASE_URL (cloud) if available
  // In development: ALWAYS use local host/port — never DATABASE_URL
  if (isProd && process.env.DATABASE_URL) {
    return {
      // mysql2 expects the connection string directly, not wrapped in { uri: ... }
      connectionString: process.env.DATABASE_URL,
      // TiDB Cloud Serverless requires TLS — without this, connections are rejected
      ssl: ssl || { minVersion: 'TLSv1.2', rejectUnauthorized: true },
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    };
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
    connection: buildConnection('tradelink_db_test'),
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
      : buildConnection(process.env.TEST_DB_NAME || process.env.DB_NAME || 'tradelink_db_test'),
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
