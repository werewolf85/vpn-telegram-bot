/**
 * /config — Получить/создать VPN конфиг
 */

const userService = require('../services/userService');
const db = require('../db');

async function configHandler(ctx) {
  const user = ctx.from;
  
  try {
    // Получаем пользователя
    const dbUser = await userService.getUserByTelegramId(user.id);
    if (!dbUser) {
      await ctx.reply('❌ Пользователь не найден. Начните с /start');
      return;
    }
    
    // Получаем доступные серверы
    const servers = await db.any(
      'SELECT * FROM servers WHERE enabled = TRUE ORDER BY load_percent ASC LIMIT 5'
    );
    
    if (servers.length === 0) {
      await ctx.reply('❌ Нет доступных серверов. Обратитесь к администратору.');
      return;
    }
    
    // Проверяем, есть ли уже аккаунт
    const accounts = await userService.getUserAccounts(dbUser.id);
    
    if (accounts.length > 0) {
      // Уже есть аккаунт — показываем конфиг
      const account = accounts[0];
      const vlessUrl = `vless://${account.uuid}@${account.ip}:${account.port}?encryption=none&flow=xtls-rprx-vision&security=reality&pbk=${account.reality_pubkey}&sni=${account.reality_shortid}&shortId=${account.reality_shortid}#VPN`;
      
      await ctx.reply(
        `🔐 <b>Ваш VPN конфиг</b>\n\n` +
        `Сервер: ${account.server_name} (${account.country})\n` +
        `IP: ${account.ip}\n` +
        `UUID: ${account.uuid}\n\n` +
        `🔗 <code>${vlessUrl}</code>\n\n` +
        `Используйте эту ссылку в приложении V2RayNG / Shadowrocket.\n` +
        `Трафик: ${(account.traffic_used / (1024**3)).toFixed(2)} / ${(account.traffic_limit / (1024**3)).toFixed(2)} ГБ`,
        { parse_mode: 'HTML' }
      );
    } else {
      // Нет аккаунта — предлагаем выбрать сервер
      const keyboard = {
        reply_markup: {
          inline_keyboard: servers.map(s => [
            {
              text: `${s.name} (${s.country}) — нагрузка ${s.load_percent}%`,
              callback_data: `select_server:${s.id}`
            }
          ])
        }
      };
      
      await ctx.reply(
        '🚀 Выберите сервер для подключения:\n' +
        servers.map(s => `${s.name} (${s.country}) — ${s.load_percent}%`).join('\n'),
        keyboard
      );
    }
    
  } catch (error) {
    console.error('Error in /config:', error);
    await ctx.reply('❌ Ошибка при получении конфига.');
  }
}

module.exports = configHandler;
