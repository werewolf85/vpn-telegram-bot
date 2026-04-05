/**
 * /payments — История платежей
 */

const paymentService = require('../services/paymentService');

async function paymentsHandler(ctx) {
  const user = ctx.from;
  
  try {
    const payments = await paymentService.getUserPayments(user.id, 10);
    
    if (payments.length === 0) {
      await ctx.reply('📭 У вас нет платежей.');
      return;
    }
    
    const lines = payments.map(p => {
      const statusIcon = p.status === 'paid' ? '✅' : p.status === 'failed' ? '❌' : '⏳';
      const date = new Date(p.created_at).toLocaleDateString('ru-RU');
      const amount = p.currency === 'USDT' ? `$${p.amount}` : `₽${p.amount}`;
      
      return `${statusIcon} ${date}: ${amount} (${p.method}) — ${p.status}`;
    });
    
    await ctx.reply(`💳 <b>История платежей (последние 10):</b>\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
    
  } catch (error) {
    console.error('Error in /payments:', error);
    await ctx.reply('❌ Ошибка при получении истории платежей.');
  }
}

module.exports = paymentsHandler;
