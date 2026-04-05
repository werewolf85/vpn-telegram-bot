/**
 * /config — Получить/создать VPN конфиг
 */

const userService = require('../services/userService');
const db = require('../db');

async function configHandler(ctx) {
  const user = ctx.from;
  
  try {
    const dbUser = await userService.getOrCreateUser(user.id, user.username, user.first_name, user.last_name);
    
    // Проверяем, есть ли уже аккаунт (берем первый)
    const existingAccounts = await userService.getUserAccounts(dbUser.id);
    
    if (existingAccounts.length > 0) {
      // Аккаунт уже есть — показываем конфиг
      const account = existingAccounts[0];
      const server = await db.one('SELECT * FROM servers WHERE id = $1', [account.server_id]);
      
      const vlessUrl = `vless://${account.uuid}@${server.ip}:${server.port}?encryption=none&flow=xtls-rprx-vision&security=reality&pbk=${server.reality_pubkey}&sni=${server.reality_shortid}&shortId=${server.reality_shortid}#VPN`;
      
      await ctx.reply(
        `🔐 <b>Ваш VPN конфиг</b>\n\n` +
        `Сервер: ${server.name} (${server.country})\n` +
        `IP: ${server.ip}:${server.port}\n` +
        `UUID: ${account.uuid}\n` +
        `Трафик: ${(account.traffic_used / (1024**3)).toFixed(2)} / ${(account.traffic_limit / (1024**3)).toFixed(2)} ГБ\n\n` +
        `🔗 <code>${vlessUrl}</code>\n\n` +
        `📱 Импортируйте эту ссылку в V2RayNG / Shadowrocket`,
        { parse_mode: 'HTML' }
      );
      return;
    }
    
    // Нет аккаунта — выбираем сервер с минимальной нагрузкой
    const servers = await db.any(
      `SELECT s.* FROM servers s 
       WHERE s.enabled = TRUE 
       ORDER BY s.load_percent ASC, s.country 
       LIMIT 3`
    );
    
    if (servers.length === 0) {
      await ctx.reply('❌ Нет доступных серверов.');
      return;
    }
    
    // Создаём аккаунт на лучшем сервере (первый)
    const server = servers[0];
    const defaultTrafficLimit = parseInt(process.env.DEFAULT_TRAFFIC_LIMIT_GB) || 100;
    const defaultExpiryDays = parseInt(process.env.DEFAULT_EXPIRY_DAYS) || 30;
    
    const account = await userService.createAccount(
      dbUser.id,
      server.id,
      defaultTrafficLimit,
      defaultExpiryDays
    );
    
    // Получаем обновлённые данные сервера (с REALITY ключами)
    const serverWithKeys = await db.one('SELECT * FROM servers WHERE id = $1', [server.id]);
    
    const vlessUrl = `vless://${account.uuid}@${serverWithKeys.ip}:${serverWithKeys.port}?encryption=none&flow=xtls-rprx-vision&security=reality&pbk=${serverWithKeys.reality_pubkey}&sni=${serverWithKeys.reality_shortid}&shortId=${serverWithKeys.reality_shortid}#VPN`;
    
    await ctx.reply(
      `✅ <b>Аккаунт создан!</b>\n\n` +
      `Сервер: ${serverWithKeys.name} (${serverWithKeys.country})\n` +
      `IP: ${serverWithKeys.ip}:${serverWithKeys.port}\n` +
      `UUID: ${account.uuid}\n` +
      `Трафик: ${(account.traffic_limit / (1024**3)).toFixed(2)} ГБ\n` +
      `Срок: ${new Date(account.expires_at).toLocaleDateString('ru-RU')}\n\n` +
      `🔗 <code>${vlessUrl}</code>\n\n` +
      `📱 Импортируйте эту ссылку в V2RayNG / Shadowrocket.\n` +
      `/balance — проверить баланс\n` +
      `/traffic — статистика`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    console.error('Error in /config:', error);
    await ctx.reply('❌ Ошибка при получении/создании конфигурации.');
  }
}

module.exports = configHandler;
