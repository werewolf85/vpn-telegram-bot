/**
 * Основной API роутер
 * Здесь будут эндпоинты: /users, /servers, /accounts, /payments и т.д.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Заглушка на главную
router.get('/', (req, res) => {
  res.json({
    name: 'VPN Telegram Bot API',
    version: '0.1.0',
    status: 'running',
    endpoints: [
      'GET /health',
      'POST /api/users/register',
      'GET /api/users/:telegramId',
      'POST /api/accounts',
      'GET /api/accounts/:id',
      'POST /api/payments',
      'GET /api/servers'
    ]
  });
});

// Пример будущего эндпоинта
router.get('/test', (req, res) => {
  logger.info('Test endpoint called');
  res.json({ message: 'API is working!' });
});

module.exports = router;
