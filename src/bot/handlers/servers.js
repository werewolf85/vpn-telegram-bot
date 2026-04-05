/**
 * /servers — Список доступных серверов
 */

const db = require('../db');

async function serversHandler(ctx) {
  try {
    const servers = await db.any(
      `SELECT * FROM servers 
       WHERE enabled = TRUE 
       ORDER BY load_percent ASC, country`
    );
    
    if (servers.length === 0) {
      await ctx.reply('❌ Нет доступных серверов.');
      return;
    }
    
    const message = servers.map(s => 
      `🌍 <b>${s.name}</b> (${s.country})\n` +
      `   IP: ${s.ip}:${s.port}\n` +
      `   Нагрузка: ${s.load_percent}%\n` +
      `   REALITY: ${s.reality_shortid}\n`
    ).join('\n');
    
    await ctx.reply(`🖥️ <b>Доступные серверы}</b>\n\n${message}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    console.error('Error in /servers:', error);
    await ctx.reply('❌ Ошибка при получении списка серверов.');
  }
}

module.exports = serversHandler;
