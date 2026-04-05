/**
 * Конфигурация приложения
 * Загружает переменные из .env и проверяет обязательные
 */

const { config } = require('dotenv');

config(); // Загружаем .env в process.env

const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const missing = requiredEnvVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

module.exports = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminIds: process.env.ADMIN_TELEGRAM_IDS ? process.env.ADMIN_TELEGRAM_IDS.split(',').map(Number) : []
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  xray: {
    configPath: process.env.XRAY_CONFIG_PATH || '/etc/xray/config.json',
    apiAddr: process.env.XRAY_API_ADDR || '127.0.0.1:10085'
  },
  crypto: {
    cryptobotToken: process.env.CRYPTOBOT_TOKEN,
    minDepositUsdt: parseFloat(process.env.MIN_DEPOSIT_USDT) || 1.0
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  serversJsonPath: process.env.SERVERS_JSON_PATH || './config/servers.json',
  defaultTrafficLimitGB: parseInt(process.env.DEFAULT_TRAFFIC_LIMIT_GB, 10) || 100,
  defaultExpiryDays: parseInt(process.env.DEFAULT_EXPIRY_DAYS, 10) || 30
};
