/**
 * Health check endpoint
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../utils/logger');

router.get('/health', async (req, res) => {
  try {
    // Проверяем подключение к БД
    const result = await db.one('SELECT 1 as ok');
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

module.exports = router;
