/**
 * /balance — Показать баланс и остаток трафика
 */

const userService = require('../services/userService');

async function balanceHandler(ctx) {
  const user = ctx.from;
  
  try {
    const stats = await userService.getUserStats(user.id);
    
    const balanceUsdt = stats.balance_usdt || 0;
    const balanceRub = stats.balance_rub || 0;
    
    const hasActiveAccounts = stats.active_accounts > 0;
    const totalLimit = (stats.total_traffic_limit / (1024**3)).toFixed(2);
    const totalUsed = (stats.total_traffic_used / (1024**3)).toFixed(2);
    const remaining = ((stats.total_traffic_limit - stats.total_traffic_used) / (1024**3)).toFixed(2);
    const percentUsed = stats.total_traffic_limit > 0 ? ((stats.total_traffic_used / stats.total_traffic_limit) * 100).toFixed(1) : 0;
    
    let message = `💰 <b>Баланс:</b>\n`;
    message += `   USDT: $${balanceUsdt.toFixed(2)}\n`;
    message += `   RUB: ${balanceRub.toFixed(2)} ₽\n\n`;
    
    if (hasActiveAccounts) {
      message += `📊 <b>Трафик:</b>\n`;
      message += `   Аактивных аккаунтов: ${stats.active_accounts}\n`;
      message += `   Всего: ${totalLimit} ГБ\n`;
      message += `   Использовано: ${totalUsed} ГБ (${percentUsed}%)\n`;
      message += `   Осталось: ${remaining} ГБ\n\n`;
      message += `♻️ Обновление: каждые 5 мин`;
    } else {
      message += `⚠️ Нет активных VPN-аккаунтов.\n`;
      message += `Используйте /config чтобы создать.`;
    }
    
    await ctx.reply(message, { parse_mode: 'HTML' });
    
  } catch (error) {
    console.error('Error in /balance:', error);
    await ctx.reply('❌ Ошибка при получении баланса.');
  }
}

module.exports = balanceHandler;
