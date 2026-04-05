/**
 * /deposit — Создать платёж (пополнение баланса)
 */

const paymentService = require('../services/paymentService');
const userService = require('../services/userService');

async function depositHandler(ctx) {
  const user = ctx.from;
  const args = ctx.message.text.split(' ').slice(1);
  
  if (args.length < 1) {
    await ctx.reply(
      '💳 <b>Пополнение баланса</b>\n\n' +
      'Использование:\n' +
      '/deposit <сумма> [метод]\n\n' +
      'Примеры:\n' +
      '/deposit 10 — пополнить на 10 USDT через CryptoBot\n' +
      '/deposit 500 yoomoney — пополнить на 500 ₽ через ЮKassa\n\n' +
      'Доступные методы: cryptobot (по умолчанию), yoomoney',
      { parse_mode: 'HTML' }
    );
    return;
  }
  
  const amount = parseFloat(args[0]);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('❌ Сумма должна быть положительным числом');
    return;
  }
  
  const method = (args[1] || 'cryptobot').toLowerCase();
  if (!['cryptobot', 'yoomoney'].includes(method)) {
    await ctx.reply('❌ Метод должен быть: cryptobot или yoomoney');
    return;
  }
  
  try {
    const dbUser = await userService.getOrCreateUser(user.id, user.username, user.first_name, user.last_name);
    
    let invoiceId, paymentLink, currency;
    
    if (method === 'cryptobot') {
      // CryptoBot (USDT)
      const payment = await paymentService.createDeposit(dbUser.id, amount, 'USDT', 'cryptobot');
      invoiceId = payment.invoice_id;
      paymentLink = paymentService.generateCryptoBotLink(invoiceId, amount, 'VPN баланс');
      currency = 'USDT';
      
    } else if (method === 'yoomoney') {
      // ЮKassa (RUB)
      const payment = await paymentService.createDeposit(dbUser.id, amount, 'RUB', 'yoomoney');
      invoiceId = payment.invoice_id;
      paymentLink = paymentService.generateYooMoneyLink(invoiceId, amount, 'VPN баланс');
      currency = '₽';
    }
    
    await ctx.reply(
      `✅ <b>Платёж создан!</b>\n\n` +
      `Метод: ${method === 'cryptobot' ? 'CryptoBot (USDT)' : 'ЮKassa (RUB)'}\n` +
      `Сумма: ${amount} ${currency}\n` +
      `Invoice ID: <code>${invoiceId}</code>\n\n` +
      `🔗 <a href="${paymentLink}">Оплатить</a>\n\n` +
      `После оплаты баланс будет зачислен автоматически.\n` +
      `Проверить статус: /payments`,
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    console.error('Error in /deposit:', error);
    await ctx.reply('❌ Ошибка при создании платежа.');
  }
}

module.exports = depositHandler;
