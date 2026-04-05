/**
 * /status — Общая статистика системы (серверы, аккаунты, трафик)
 */

const trafficMonitor = require('../services/trafficMonitor');
const xrayService = require('../services/xrayService');

async function statusHandler(ctx) {
  try {
    // Получаем статистику
    const globalStats = await trafficMonitor.getGlobalStats();
    const servers = await xrayService.getServersStats();
    
    const message = `
🖥️ <b>Статус системы</b>

📊 <b>Глобальная статистика:</b>
  Всего аккаунтов: ${globalStats.total_accounts}
  Активных: ${globalStats.active_accounts}
  Общий трафик: ${(globalStats.total_traffic_bytes / 1024**3).toFixed(2)} / ${(globalStats.total_traffic_limit / 1024**3).toFixed(2)} ГБ

🌍 <b>Серверы:</b>
${servers.map(s => 
  `  ${s.name} (${s.country}): ${s.active_connections} подключений, ${(s.total_traffic_bytes / 1024**3).toFixed(2)} ГБ использовано`
).join('\n')}

⏱ ${new Date().toLocaleString('ru-RU')}
    `.trim();
    
    await ctx.reply(message, { parse_mode: 'HTML' });
    
  } catch (error) {
    console.error('Error in /status:', error);
    await ctx.reply('❌ Ошибка при получении статуса.');
  }
}

module.exports = statusHandler;
