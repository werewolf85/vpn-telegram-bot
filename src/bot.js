/**
 * Telegram Bot (Telegraf)
 * Основной файл инициализации бота
 */

const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./utils/logger');
const xrayService = require('./services/xrayService');

// Импорт обработчиков
const startHandler = require('./handlers/start');
const balanceHandler = require('./handlers/balance');
const configHandler = require('./handlers/config');
const serversHandler = require('./handlers/servers');
const trafficHandler = require('./handlers/traffic');
const statusHandler = require('./handlers/status');
const depositHandler = require('./handlers/deposit');
const paymentsHandler = require('./handlers/payments');

// Инициализация бота
const bot = new Telegraf(config.telegram.botToken);

// Middleware: логгирование входящих сообщений
bot.use(async (ctx, next) => {
  const user = ctx.from;
  logger.info(`[Telegram] ${user.id} (@${user.username || 'no_username'}): ${ctx.message?.text || 'non-text'}`);
  await next();
});

// Middleware: проверка авторизации
bot.use(async (ctx, next) => {
  const telegramId = ctx.from.id;
  const isAdmin = config.telegram.adminIds.includes(telegramId);
  
  if (!isAdmin) {
    await ctx.reply('⛔️ Бот доступен только администраторам (пока в разработке)');
    return;
  }
  
  await next();
});

// Команды
bot.command('start', startHandler);
bot.command('balance', balanceHandler);
bot.command('config', configHandler);
bot.command('servers', serversHandler);
bot.command('traffic', trafficHandler);
bot.command('status', statusHandler);
bot.command('deposit', depositHandler);
bot.command('payments', paymentsHandler);
bot.command('help', (ctx) => ctx.reply(
  'Доступные команды:\n' +
  '/start — регистрация\n' +
  '/config — получить/создать VPN\n' +
  '/balance — баланс\n' +
  '/traffic — статистика трафика\n' +
  '/servers — список серверов\n' +
  '/status — статус системы\n' +
  '/deposit <сумма> [cryptobot|yoomoney] — пополнение\n' +
  '/payments — история платежей'
));

// Обработка неизвестных команд
bot.on('text', (ctx) => {
  ctx.reply('Неизвестная команда. Используйте /help');
});

// Запуск бота с инициализацией Xray
async function startBot() {
  try {
    // Инициализируем Xray Service
    await xrayService.init();
    
    bot.launch()
      .then(() => {
        logger.info('✅ Telegram bot started');
      })
      .catch(error => {
        logger.error('❌ Failed to start bot:', error);
        process.exit(1);
      });
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

startBot();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
