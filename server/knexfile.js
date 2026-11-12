const path = require('path');
const dotenv = require('dotenv');

const envMode = (process.env.NODE_ENV || 'development').replace(/^["']|["']$/g, '').trim();
const isProd = envMode === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.RENDER);

// Support environment-specific .env files
if (isProd) {
  dotenv.config({ path: path.resolve(__dirname, '.env.production') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '.env.development') });
}
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const cleanStr = (val) => (val ? String(val).replace(/^["']|["']$/g, '').trim() : '');

const isRemoteHost = (host) => {
  if (!host) return false;
  const h = host.toLowerCase().trim();
  return h !== 'localhost' && h !== '127.0.0.1' && h !== '0.0.0.0' && h !== '';
};

const isTidbHost = (host) => {
  if (!host) return false;
  return host.toLowerCase().includes('tidbcloud.com');
};

const buildConnection = (targetEnv = 'development') => {
  // DEVELOPMENT: Strictly local MySQL. Never use cloud DATABASE_URL or remote hosts.
  if (targetEnv === 'development' || !isProd) {
    const devHost = cleanStr(process.env.DEV_DB_HOST) || cleanStr(process.env.DB_HOST) || '127.0.0.1';
    const safeHost = isRemoteHost(devHost) ? '127.0.0.1' : devHost;
    return {
      host: safeHost,
      port: Number(process.env.DEV_DB_PORT || process.env.DB_PORT) || 3306,
      user: cleanStr(process.env.DEV_DB_USER) || cleanStr(process.env.DB_USER) || 'root',
      password: process.env.DEV_DB_PASSWORD !== undefined ? cleanStr(process.env.DEV_DB_PASSWORD) : (cleanStr(process.env.DB_PASSWORD) || ''),
      database: cleanStr(process.env.DEV_DB_NAME) || cleanStr(process.env.DB_NAME) || 'tradelink_db',
      ssl: false,
      charset: 'utf8mb4',
      timezone: '+00:00',
      connectTimeout: 20000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    };
  }

  // PRODUCTION: Prioritize cloud DATABASE_URL or managed cloud host with TLS
  const isTargetProd = targetEnv === 'production' || isProd;
  const rawDbUrl = cleanStr(process.env.DATABASE_URL);
  const rawHost = cleanStr(process.env.PROD_DB_HOST) || cleanStr(process.env.DB_HOST);
  const rawPort = Number(process.env.PROD_DB_PORT || process.env.DB_PORT);
  const rawUser = cleanStr(process.env.PROD_DB_USER) || cleanStr(process.env.DB_USER);
  const rawPass = cleanStr(process.env.PROD_DB_PASSWORD) || cleanStr(process.env.DB_PASSWORD);
  const rawDbName = cleanStr(process.env.PROD_DB_NAME) || cleanStr(process.env.DB_NAME);
  const rawSsl = cleanStr(process.env.DB_SSL).toLowerCase();

  // 1. In production, prioritize cloud DATABASE_URL if provided
  if (isTargetProd && rawDbUrl) {
    try {
      const parsedUrl = new URL(rawDbUrl);
      const host = parsedUrl.hostname;
      const port = Number(parsedUrl.port) || (isTidbHost(host) ? 4000 : 3306);
      const user = decodeURIComponent(parsedUrl.username || '');
      const password = decodeURIComponent(parsedUrl.password || '');
      const database = decodeURIComponent(parsedUrl.pathname.replace(/^\//, '').split('?')[0]) || 'tradelink_db';

      // TiDB Cloud Serverless ALWAYS requires TLS/SSL regardless of NODE_ENV
      const requiresSsl =
        rawSsl === 'true' ||
        rawSsl === '1' ||
        isTidbHost(host) ||
        port === 4000 ||
        (isRemoteHost(host) && isTargetProd);

      return {
        host,
        port,
        user,
        password,
        database,
        ssl: requiresSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false,
        charset: 'utf8mb4',
        timezone: '+00:00',
        connectTimeout: 20000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      };
    } catch (err) {
      console.warn(`[KNEX] Could not parse DATABASE_URL: ${err.message}. Falling back to DB_* variables.`);
    }
  }

  // 2. If DB_HOST is provided
  if (rawHost) {
    const host = rawHost;
    const port = rawPort || (isTidbHost(host) ? 4000 : 3306);
    const user = rawUser || 'root';
    const password = rawPass || '';
    const database = rawDbName || 'tradelink_db';

    // TiDB Cloud Serverless ALWAYS requires TLS/SSL regardless of NODE_ENV
    const requiresSsl =
      rawSsl === 'true' ||
      rawSsl === '1' ||
      isTidbHost(host) ||
      port === 4000 ||
      (isRemoteHost(host) && isTargetProd);

    return {
      host,
      port,
      user,
      password,
      database,
      ssl: requiresSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false,
      charset: 'utf8mb4',
      timezone: '+00:00',
      connectTimeout: 20000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    };
  }

  // 3. Fallback for local development MySQL (XAMPP / local MariaDB)
  return {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: rawDbName || 'tradelink_db',
    charset: 'utf8mb4',
    timezone: '+00:00',
    connectTimeout: 20000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: false
  };
};

module.exports = {
  development: {
    client: 'mysql2',
    connection: buildConnection('development'),
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
      ? { uri: process.env.TEST_DATABASE_URL, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
      : buildConnection('test'),
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
    connection: buildConnection('production'),
    pool: {
      min: process.env.VERCEL ? 0 : 2,
      max: process.env.VERCEL ? 5 : 20,
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
