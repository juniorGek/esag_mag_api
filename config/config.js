require('dotenv').config(); // Charger les variables d'environnement

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'esag_mag',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false
  },
  test: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_TEST_NAME || 'database_test',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_PROD_NAME || 'database_production',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql'
  }
};
