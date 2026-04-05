/**
 * User Service — работа с пользователями и аккаунтами
 */

const db = require('../db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const xrayService = require('./xrayService');

class UserService {
  /**
   * Найти или создать пользователя по telegram_id
   */
  async getOrCreateUser(telegramId, username, firstName, lastName) {
    const existing = await db.oneOrNone(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
    
    if (existing) {
      return existing;
    }
    
    const result = await db.one(
      `INSERT INTO users (telegram_id, username, first_name, last_name, created_at) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [telegramId, username, firstName, lastName]
    );
    
    logger.info(`New user registered: ${telegramId} (@${username})`);
    return result;
  }
  
  /**
   * Получить пользователя по telegram_id
   */
  async getUserByTelegramId(telegramId) {
    return await db.oneOrNone(
      'SELECT * FROM users WHERE telegram_id = $1',
      [telegramId]
    );
  }
  
  /**
   * Получить активные аккаунты пользователя
   */
  async getUserAccounts(userId) {
    return await db.any(
      `SELECT a.*, s.name as server_name, s.country, s.ip 
       FROM accounts a 
       JOIN servers s ON a.server_id = s.id 
       WHERE a.user_id = $1 AND a.active = TRUE 
       ORDER BY a.created_at DESC`,
      [userId]
    );
  }
  
  /**
   * Создать аккаунт (VPN) для пользователя на сервере
   */
  async createAccount(userId, serverId, trafficLimitGb, expiryDays) {
    const uuid = uuidv4();
    const email = `user-${userId}-${Date.now()}@vpn.local`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);
    
    const result = await db.one(
      `INSERT INTO accounts (user_id, server_id, uuid, email, traffic_limit, traffic_used, expires_at, active) 
       VALUES ($1, $2, $3, $4, $5, 0, $6, TRUE) RETURNING *`,
      [userId, serverId, uuid, email, trafficLimitGb * 1024 * 1024 * 1024, expiresAt]
    );
    
    logger.info(`Account created: user=${userId}, server=${serverId}, uuid=${uuid}`);
    return result;
  }
  
  /**
   * Обновить использованный трафик
   */
  async updateTraffic(accountId, uploadBytes, downloadBytes) {
    const result = await db.one(
      `UPDATE accounts 
       SET traffic_used = traffic_used + $1 + $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [uploadBytes, downloadBytes, accountId]
    );
    
    // Проверка лимита
    if (result.traffic_used >= result.traffic_limit && result.traffic_limit > 0) {
      await this.disableAccount(accountId);
      logger.warn(`Account ${accountId} exceeded traffic limit and was disabled`);
    }
    
    return result;
  }
  
  /**
   * Отключить аккаунт
   */
  async disableAccount(accountId) {
    return await db.one(
      'UPDATE accounts SET active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *',
      [accountId]
    );
  }
  
  /**
   * Получить аккаунт по UUID
   */
  async getAccountByUuid(uuid) {
    return await db.oneOrNone(
      `SELECT a.*, s.ip, s.port, s.reality_pubkey, s.reality_shortid 
       FROM accounts a JOIN servers s ON a.server_id = s.id 
       WHERE a.uuid = $1`,
      [uuid]
    );
  }
  
  /**
   * Получить статистику пользователя
   */
  async getUserStats(userId) {
    return await db.one(
      `SELECT * FROM user_stats WHERE user_id = $1`,
      [userId]
    );
  }
}

module.exports = new UserService();
