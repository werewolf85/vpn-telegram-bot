#!/usr/bin/env node
/**
 * Инициализация базы данных
 * Применяет schema.sql к указанной БД
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const config = require('./src/config');

const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');

console.log('🗄️  Initializing database...');
console.log(`   Host: ${config.db.host}:${config.db.port}`);
console.log(`   Database: ${config.db.database}`);
console.log(`   Schema: ${schemaPath}`);

// Проверяем, существует ли схема
if (!fs.existsSync(schemaPath)) {
  console.error(`❌ Schema file not found: ${schemaPath}`);
  process.exit(1);
}

// Выполняем psql
const psqlCmd = `psql -h ${config.db.host} -p ${config.db.port} -U ${config.db.user} -d ${config.db.database} -f "${schemaPath}"`;

exec(psqlCmd, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database initialization failed:', error.message);
    if (stderr) console.error(stderr);
    process.exit(1);
  }
  
  console.log('✅ Database initialized successfully');
  if (stdout) console.log(stdout);
  process.exit(0);
});
