/**
 * /start — Приветствие и регистрация
 */

const userService = require('../services/userService');

async function startHandler(ctx) {
  const user = ctx.from;
  
  try {
    // Регистрация/получение пользователя
    const dbUser = await userService.getOrCreateUser(
      user.id,
      user.username,
      user.first_name,
      user.last_name
    );
    
    await ctx.reply(
      `👋 Привет, ${user.first_name || 'пользователь'}!\n\n` +
      `Вы зарегистрированы в VPN-сервисе.\n` +
      `Используйте команды:\n` +
      `/balance — баланс и трафик\n` +
      `/config — получить конфиг VPN\n` +
      `/servers — список серверов\n` +
      `/traffic — статистика трафика\n\n` +
      `Ваш ID: ${user.id}\n` +
      `Активных аккаунтов: ${dbUser.active_accounts || 0}`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    console.error('Error in /start:', error);
    await ctx.reply('❌ Ошибка при регистрации. Попробуйте позже.');
  }
}

module.exports = startHandler;
