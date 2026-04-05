/**
 * Запуск миграций базы данных
 * Использование: node scripts/migrate.js
 */

const db = require('../src/db');
const path = require('path');
const fs = require('fs').promises;

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
    const files = await fs.readdir(migrationsDir);
    
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // сортируем по имени
    
    for (const file of sqlFiles) {
      console.log(`\n📄 Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Разделяем на отдельные команды (на случай нескольких BEGIN/COMMIT)
      await db.raw(sql);
      
      console.log(`   ✅ ${file} applied`);
    }
    
    console.log('\n✅ All migrations completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
