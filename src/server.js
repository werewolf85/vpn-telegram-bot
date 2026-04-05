/**
 * Express.js сервер
 * Основная точка входа для REST API
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const logger = require('./utils/logger');
const trafficMonitor = require('./services/trafficMonitor');

// Инициализируем приложение
const app = express();
const PORT = config.server.port;

// Middleware
app.use(helmet()); // Безопасность
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Логирование запросов (в desarrollo)
if (config.server.nodeEnv === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Роуты
app.use('/health', require('./routes/health'));
app.use('/api', require('./routes/index'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Запуск сервера
app.listen(PORT, async () => {
  logger.info(`🚀 VPN Telegram Bot API started on port ${PORT}`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
  
  // Автоматическое применение миграций в development режиме
  if (config.server.nodeEnv === 'development') {
    try {
      const fs = require('fs');
      const path = require('path');
      const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
      
      if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort();
        
        logger.info(`📦 Applying ${files.length} migrations...`);
        
        for (const file of files) {
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await db.raw(sql);
          logger.info(`   ✅ ${file}`);
        }
        
        logger.info('✅ All migrations applied');
      }
    } catch (error) {
      logger.error('Failed to apply migrations:', error);
    }
  }
  
  // Запуск мониторинга трафика
  try {
    await trafficMonitor.start();
    logger.info('📊 Traffic monitor started');
  } catch (error) {
    logger.error('Failed to start traffic monitor:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  trafficMonitor.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  trafficMonitor.stop();
  process.exit(0);
});

module.exports = app;
