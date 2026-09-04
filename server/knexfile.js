require('dotenv').config();

const getSslConfig = () => {
  if (process.env.DB_SSL === 'true') {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }
  return false;
};

const buildConnection = (defaultDbName = 'tradelink_db_test') => {
  const ssl = getSslConfig();
  if (process.env.DATABASE_URL) {
    return ssl ? { uri: process.env.DATABASE_URL, ssl } : process.env.DATABASE_URL;
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || defaultDbName,
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl
  };
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: buildConnection('tradelink_db'),
    pool: {
      min: 2,
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
    connection: process.env.TEST_DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.TEST_DB_NAME || 'tradelink_db_test',
      charset: 'utf8mb4',
      timezone: '+00:00'
    },
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
      min: 2,
      max: 25,
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
  }
};
