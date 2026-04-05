/**
 * Подключение к PostgreSQL через pg-promise
 */

const pgp = require('pg-promise')({
  capSQL: true, // Capitalize SQL keywords
  cast: false   // Disable type casting (quest uses its own)
});

const config = require('../config');

const connectionString = `postgresql://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;

const db = pgp(connectionString);

// Проверка подключения
db.connect()
  .then(obj => {
    console.log('✅ Connected to PostgreSQL');
    obj.done();
  })
  .catch(error => {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  });

module.exports = db;
