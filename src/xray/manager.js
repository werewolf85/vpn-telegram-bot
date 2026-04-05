/**
 * Xray Manager — управление Xray конфигурацией и пользователями
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const logger = require('../utils/logger');
const config = require('../config');

class XrayManager {
  constructor() {
    this.configPath = config.xray.configPath;
    this.baseConfig = null;
    this.realityKeys = {};
  }

  /**
   * Инициализация: загрузить базовый конфиг и REALITY ключи
   */
  async init() {
    await this.loadBaseConfig();
    await this.loadRealityKeys();
    logger.info('✅ Xray Manager initialized');
  }

  /**
   * Загрузить базовый конфиг Xray
   */
  async loadBaseConfig() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      this.baseConfig = JSON.parse(content);
      logger.info(`Loaded Xray config from ${this.configPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn(`Xray config not found at ${this.configPath}. Will create default.`);
        this.baseConfig = this.getDefaultConfig();
      } else {
        throw error;
      }
    }
  }

  /**
   * Загрузить REALITY ключи из файлов
   */
  async loadRealityKeys() {
    const keysDir = path.join(process.cwd(), 'config', 'reality-keys');
    
    try {
      const files = await fs.readdir(keysDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const keyName = path.basename(file, '.json');
          const content = await fs.readFile(path.join(keysDir, file), 'utf8');
          this.realityKeys[keyName] = JSON.parse(content);
        }
      }
      
      logger.info(`Loaded ${Object.keys(this.realityKeys).length} REALITY key pairs`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.warn('Reality keys directory not found. Will generate keys on demand.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Генерация REALITY ключей (используя xray или node-crypto)
   */
  async generateRealityKeys(keyName) {
    // Простая генерация через node-crypto (HCrypto256)
    const crypto = require('crypto');
    
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = this.generatePublicKey(privateKey); // упрощённо
    
    const keys = {
      keyName,
      privateKey,
      publicKey,
      shortId: this.generateShortId(),
      createdAt: new Date().toISOString()
    };
    
    // Сохраняем
    const keysDir = path.join(process.cwd(), 'config', 'reality-keys');
    await fs.mkdir(keysDir, { recursive: true });
    await fs.writeFile(
      path.join(keysDir, `${keyName}.json`),
      JSON.stringify(keys, null, 2)
    );
    
    this.realityKeys[keyName] = keys;
    logger.info(`Generated REALITY keys: ${keyName}`);
    
    return keys;
  }

  /**
   * Сгенерировать shortId (8 символов)
   */
  generateShortId() {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Генерация публичного ключа из приватного (упрощённая версия)
   * В реальности используем xray's crypto или внешнюю утилиту
   */
  generatePublicKey(privateKeyHex) {
    // Временная заглушка — на продакшене нужно через xray reality
    return privateKeyHex; // Пока для теста
  }

  /**
   * Получить конфиг по ключу
   */
  getRealityKeys(keyName) {
    return this.realityKeys[keyName];
  }

  /**
   * Получить или сгенерировать REALITY ключи
   */
  async getOrCreateRealityKeys(keyName) {
    if (!this.realityKeys[keyName]) {
      return await this.generateRealityKeys(keyName);
    }
    return this.realityKeys[keyName];
  }

  /**
   * Добавить пользователя (UUID) в конфиг Xray
   */
  async addUser(serverConfig, userId, uuid, email, trafficLimit) {
    // Создаём inbound если нужно
    if (!this.baseConfig.inbounds) {
      this.baseConfig.inbounds = [];
    }
    
    // Находим inbound для VLESS (порт serverConfig.port)
    let inbound = this.baseConfig.inbounds.find(i => i.port === serverConfig.port);
    
    if (!inbound) {
      // Создаём новый inbound
      inbound = {
        port: serverConfig.port,
        protocol: 'vless',
        settings: {
          clients: [],
          decryption: 'none'
        },
        streamSettings: {
          network: 'tcp',
          security: 'reality',
          realitySettings: {
            dest: serverConfig.reality_dest || 'cloudflare.com:443',
            serverNames: [serverConfig.reality_sni || 'cloudflare.com'],
            privateKey: serverConfig.reality_private_key,
            publicKey: serverConfig.reality_public_key,
            shortIds: [serverConfig.reality_shortid]
          }
        }
      };
      this.baseConfig.inbounds.push(inbound);
    }
    
    // Добавляем клиента
    const client = {
      id: uuid,
      email: email,
      flow: 'xtls-rprx-vision',
      limit: trafficLimit ? `${trafficLimit}MB` : undefined // можно настроить
    };
    
    if (!inbound.settings.clients) {
      inbound.settings.clients = [];
    }
    
    inbound.settings.clients.push(client);
    
    // Сохраняем конфиг
    await this.saveConfig();
    
    logger.info(`Added user ${uuid} to Xray config (server: ${serverConfig.name})`);
    return client;
  }

  /**
   * Удалить пользователя из конфига
   */
  async removeUser(serverPort, uuid) {
    const inbound = this.baseConfig.inbounds.find(i => i.port === serverPort);
    
    if (inbound && inbound.settings && inbound.settings.clients) {
      inbound.settings.clients = inbound.settings.clients.filter(c => c.id !== uuid);
      await this.saveConfig();
      logger.info(`Removed user ${uuid} from Xray config`);
    }
  }

  /**
   * Сохранить конфиг на диск и перезагрузить Xray
   */
  async saveConfig() {
    const content = JSON.stringify(this.baseConfig, null, 2);
    await fs.writeFile(this.configPath, content, 'utf8');
    await this.reloadXray();
  }

  /**
   * Перезагрузить Xray (через systemctl или directly)
   */
  async reloadXray() {
    try {
      // Пробуем через systemctl (если Xray установлен как service)
      await execAsync('systemctl reload xray');
      logger.info('Reloaded Xray via systemctl');
    } catch (error) {
      // Иначе через kill -HUP
      try {
        const { stdout } = await execAsync('pgrep xray');
        const pid = stdout.trim();
        process.kill(parseInt(pid), 'SIGHUP');
        logger.info('Reloaded Xray via SIGHUP');
      } catch (e) {
        logger.warn('Could not reload Xray automatically. Please restart manually.');
      }
    }
  }

  /**
   * Получить статистику по пользователям (через Xray API)
   */
  async getStats() {
    // Пока заглушка — потом подключим Xray API
    return {};
  }

  /**
   * Базовый конфиг по умолчанию (если нет файла)
   */
  getDefaultConfig() {
    return {
      log: {
        access: '/var/log/xray/access.log',
        error: '/var/log/xray/error.log',
        loglevel: 'warning'
      },
      inbounds: [],
      outbounds: [
        {
          protocol: 'freedom',
          settings: {}
        }
      ],
      routing: {
        rules: []
      }
    };
  }
}

module.exports = new XrayManager();
