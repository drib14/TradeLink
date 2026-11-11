require('dotenv').config();

const cleanStr = (val) => (val ? String(val).replace(/^["']|["']$/g, '').trim() : '');

const envMode = cleanStr(process.env.NODE_ENV) || 'development';
const isProd = envMode === 'production' || Boolean(process.env.VERCEL) || Boolean(process.env.RENDER);

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
  const isTargetProd = targetEnv === 'production' || isProd;
  const rawDbUrl = cleanStr(process.env.DATABASE_URL);
  const rawHost = cleanStr(process.env.DB_HOST);
  const rawPort = Number(process.env.DB_PORT);
  const rawUser = cleanStr(process.env.DB_USER);
  const rawPass = cleanStr(process.env.DB_PASSWORD);
  const rawDbName = cleanStr(process.env.DB_NAME);
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
