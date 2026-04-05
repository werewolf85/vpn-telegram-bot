/**
 * Traffic Monitor — сбор статистики трафика с Xray API
 * Опрашивает Xray каждые N минут, обновляет БД
 */

const axios = require('axios');
const db = require('../db');
const logger = require('../utils/logger');
const config = require('../config');

class TrafficMonitor {
  constructor() {
    this.interval = null;
    this.pollInterval = 5 * 60 * 1000; // 5 минут
    this.apiUrl = `http://${config.xray.apiAddr}`;
  }

  /**
   * Запустить мониторинг
   */
  start() {
    if (this.interval) {
      logger.warn('Traffic monitor already running');
      return;
    }
    
    logger.info(`🚀 Traffic monitor started (poll every ${this.pollInterval / 60000} minutes)`);
    
    // Немедленный запуск
    this.poll().catch(console.error);
    
    // Периодический опрос
    this.interval = setInterval(() => {
      this.poll().catch(error => {
        logger.error('Traffic monitor poll error:', error);
      });
    }, this.pollInterval);
  }

  /**
   * Остановить мониторинг
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Traffic monitor stopped');
    }
  }

  /**
   * Среда опроса Xray API
   */
  async poll() {
    try {
      // Получаем список активных аккаунтов из БД
      const accounts = await db.any(`
        SELECT a.*, s.ip, s.port 
        FROM accounts a 
        JOIN servers s ON a.server_id = s.id 
        WHERE a.active = TRUE
      `);
      
      if (accounts.length === 0) {
        logger.debug('No active accounts to monitor');
        return;
      }
      
      logger.info(`Monitoring ${accounts.length} active accounts`);
      
      // Для каждого аккаунта запрашиваем статистику
      for (const account of accounts) {
        try {
          await this.updateAccountTraffic(account);
        } catch (error) {
          logger.error(`Failed to update traffic for account ${account.id} (${account.uuid}):`, error.message);
        }
      }
      
    } catch (error) {
      logger.error('Traffic poll failed:', error);
    }
  }

  /**
   * Обновить трафик для одного аккаунта
   */
  async updateAccountTraffic(account) {
    // Xray API: GET /stats?pattern=user:${uuid}
    const url = `${this.apiUrl}/stats?pattern=user:${account.uuid}`;
    
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data;
      
      // Xray возвращает: { "stat": { "user:uuid": { "up": 123, "down": 456 } } }
      const userStats = data.stat && data.stat[`user:${account.uuid}`];
      
      if (!userStats) {
        logger.warn(`No stats from Xray for user ${account.uuid}`);
        return;
      }
      
      const uploadBytes = parseInt(userStats.up) || 0;
      const downloadBytes = parseInt(userStats.down) || 0;
      const totalBytes = uploadBytes + downloadBytes;
      
      if (totalBytes === 0) {
        return; // нет изменений
      }
      
      // Запись в лог
      await db.none(
        `INSERT INTO traffic_logs (account_id, upload_bytes, download_bytes, timestamp) 
         VALUES ($1, $2, $3, NOW())`,
        [account.id, uploadBytes, downloadBytes]
      );
      
      // Обновление аккаунта
      const updatedAccount = await db.one(
        `UPDATE accounts 
         SET traffic_used = traffic_used + $1, updated_at = NOW() 
         WHERE id = $2 RETURNING *`,
        [totalBytes, account.id]
      );
      
      logger.info(`Account ${account.uuid}: +${(totalBytes / 1024**2).toFixed(2)} MB (up: ${(uploadBytes / 1024**2).toFixed(2)}, down: ${(downloadBytes / 1024**2).toFixed(2)})`);
      
      // Проверка лимита
      if (updatedAccount.traffic_limit > 0 && updatedAccount.traffic_used >= updatedAccount.traffic_limit) {
        await this.disableAccountDueToLimit(updatedAccount);
      }
      
    } catch (error) {
      if (error.response) {
        logger.error(`Xray API error for ${account.uuid}: ${error.response.status}`);
      } else {
        logger.error(`Xray request failed for ${account.uuid}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Отключить аккаунт при превышении лимита
   */
  async disableAccountDueToLimit(account) {
    try {
      await db.one(
        'UPDATE accounts SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
        [account.id]
      );
      
      logger.warn(`Account ${account.uuid} disabled: traffic limit exceeded`);
      
      // TODO: отправить уведомление пользователю через Telegram бота
      // Это можно сделать через events или прямую запись в таблицу notifications
      
    } catch (error) {
      logger.error('Failed to disable account:', error);
    }
  }

  /**
   * Получить текущую статистику по всем аккаунтам (для админки)
   */
  async getGlobalStats() {
    return await db.any(`
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN active = TRUE THEN 1 END) as active_accounts,
        COALESCE(SUM(traffic_used), 0) as total_traffic_bytes,
        COALESCE(SUM(traffic_limit), 0) as total_traffic_limit
      FROM accounts
    `);
  }
}

module.exports = new TrafficMonitor();
