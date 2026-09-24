const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'la_kamelia_secret_dev_cambiar',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  db: {
    provider: (process.env.DB_PROVIDER || 'mysql').toLowerCase(),
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rancho_kamelia_db',
    ssl: String(process.env.DB_SSL || 'false').toLowerCase() === 'true',
    sslRejectUnauthorized:
      String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
    caFile: process.env.DB_CA_FILE || '',
  },
};

module.exports = env;
