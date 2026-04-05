/**
 * /traffic — Статистика трафика
 */

const userService = require('../services/userService');

async function trafficHandler(ctx) {
  const user = ctx.from;
  
  try {
    const accounts = await userService.getUserAccounts(user.id);
    
    if (accounts.length === 0) {
      await ctx.reply('⚠️ У вас нет активных аккаунтов.');
      return;
    }
    
    const lines = [];
    for (const acc of accounts) {
      const usedGb = (acc.traffic_used / (1024**3)).toFixed(2);
      const limitGb = (acc.traffic_limit > 0) ? (acc.traffic_limit / (1024**3)).toFixed(2) : '∞';
      const percent = acc.traffic_limit > 0 ? ((acc.traffic_used / acc.traffic_limit) * 100).toFixed(1) : '0';
      
      lines.push(
        `🖥️ ${acc.server_name}\n` +
        `   Использовано: ${usedGb} / ${limitGb} ГБ (${percent}%)\n` +
        `   Активен: ${acc.active ? '✅' : '❌'}\n` +
        `   Срок: ${new Date(acc.expires_at).toLocaleDateString('ru-RU')}`
      );
    }
    
    await ctx.reply(`📈 <b>Статистика трафика}</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    console.error('Error in /traffic:', error);
    await ctx.reply('❌ Ошибка при получении статистики.');
  }
}

module.exports = trafficHandler;
