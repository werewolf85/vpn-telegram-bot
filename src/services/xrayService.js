/**
 * Xray Service — бизнес-логика для работы с Xray
 */

const xrayManager = require('../xray/manager');
const db = require('../db');
const logger = require('../utils/logger');

class XrayService {
  /**
   * Инициализация Xray менеджера
   */
  async init() {
    await xrayManager.init();
    logger.info('✅ Xray Service initialized');
  }

  /**
   * Получить или сгенерировать REALITY ключи для сервера
   */
  async getServerKeys(serverName) {
    return await xrayManager.getOrCreateRealityKeys(serverName);
  }

  /**
   * Создать аккаунт на сервере (добавить в Xray конфиг)
   */
  async provisionAccount(account) {
    try {
      // Получаем данные сервера
      const server = await db.one(
        'SELECT * FROM servers WHERE id = $1',
        [account.server_id]
      );
      
      // Получаем REALITY ключи для этого сервера
      const realityKeys = await this.getServerKeys(server.name);
      
      // Добавляем в Xray конфиг
      await xrayManager.addUser(
        server,
        account.user_id,
        account.uuid,
        account.email,
        account.traffic_limit
      );
      
      logger.info(`Account provisioned on Xray: ${account.uuid} → ${server.name}`);
      
      return {
        serverIp: server.ip,
        serverPort: server.port,
        realityPubkey: realityKeys.publicKey,
        realityShortid: realityKeys.shortId
      };
      
    } catch (error) {
      logger.error('Failed to provision account:', error);
      throw error;
    }
  }

  /**
   * Удалить аккаунт с сервера
   */
  async deprovisionAccount(account) {
    try {
      const server = await db.one(
        'SELECT * FROM servers WHERE id = $1',
        [account.server_id]
      );
      
      await xrayManager.removeUser(server.port, account.uuid);
      logger.info(`Account deprovisioned from Xray: ${account.uuid}`);
      
    } catch (error) {
      logger.error('Failed to deprovision account:', error);
      throw error;
    }
  }

  /**
   * Получить статистику по всем серверам
   */
  async getServersStats() {
    return await db.any(`
      SELECT s.*, 
             COUNT(a.id) as active_connections,
             COALESCE(SUM(a.traffic_used), 0) as total_traffic_bytes
      FROM servers s
      LEFT JOIN accounts a ON s.id = a.server_id AND a.active = TRUE
      WHERE s.enabled = TRUE
      GROUP BY s.id
      ORDER BY s.load_percent ASC
    `);
  }

  /**
   * Добавить сервер в БД и сгенерировать REALITY ключи
   */
  async addServer(serverData) {
    const { name, country, ip, port } = serverData;
    
    // Генерируем REALITY ключи
    const realityKeys = await this.getServerKeys(name);
    
    const result = await db.one(
      `INSERT INTO servers (name, country, ip, port, reality_pubkey, reality_shortid, load_percent, enabled) 
       VALUES ($1, $2, $3, $4, $5, $6, 0, TRUE) RETURNING *`,
      [name, country, ip, port, realityKeys.publicKey, realityKeys.shortId]
    );
    
    logger.info(`Server added: ${name} (${ip}:${port})`);
    return result;
  }
}

module.exports = new XrayService();
