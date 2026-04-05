/**
 * /balance — Показать баланс и остаток трафика
 */

const userService = require('../services/userService');

async function balanceHandler(ctx) {
  const user = ctx.from;
  
  try {
    const stats = await userService.getUserStats(user.id);
    
    if (!stats || stats.active_accounts === 0) {
      await ctx.reply('⚠️ У вас нет активных VPN-аккаунтов. Используйте /config для создания.');
      return;
    }
    
    const totalLimit = (stats.total_traffic_limit / (1024**3)).toFixed(2);
    const totalUsed = (stats.total_traffic_used / (1024**3)).toFixed(2);
    const remaining = ((stats.total_traffic_limit - stats.total_traffic_used) / (1024**3)).toFixed(2);
    const percentUsed = ((stats.total_traffic_used / stats.total_traffic_limit) * 100).toFixed(1);
    
    await ctx.reply(
      `📊 <b>Ваш баланс и трафик</b>\n\n` +
      `Активных аккаунтов: ${stats.active_accounts}\n` +
      `Всего трафика: ${totalLimit} ГБ\n` +
      `Использовано: ${totalUsed} ГБ (${percentUsed}%)\n` +
      `Осталось: ${remaining} ГБ\n\n` +
      `Следующее обновление: через 5 минут`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    console.error('Error in /balance:', error);
    await ctx.reply('❌ Ошибка при получении баланса.');
  }
}

module.exports = balanceHandler;
