/**
 * Payment Service — обработка платежей (CryptoBot + ЮKassa)
 */

const crypto = require('crypto');
const db = require('../db');
const logger = require('../utils/logger');
const config = require('../config');

class PaymentService {
  /**
   * Создать новый платёж (депозит)
   */
  async createDeposit(userId, amount, currency = 'USDT', method = 'cryptobot') {
    const invoiceId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 мин
    
    const result = await db.one(
      `INSERT INTO payments (user_id, invoice_id, amount, currency, method, status, expires_at) 
       VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *`,
      [userId, invoiceId, amount, currency, method, expiresAt]
    );
    
    logger.info(`Payment created: ${invoiceId} (${method}, ${amount} ${currency})`);
    return result;
  }

  /**
   * Проверить статус платежа (CryptoBot API)
   */
  async checkCryptoBotPayment(invoiceId) {
    try {
      const token = process.env.CRYPTOBOT_TOKEN;
      if (!token) throw new Error('CRYPTOBOT_TOKEN not set');
      
      const response = await fetch(`https://api.cryptobot.com/me/invoices/${invoiceId}`, {
        headers: { 'Crypto-Pay-API-Token': token }
      });
      
      if (!response.ok) {
        throw new Error(`CryptoBot API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.result;
      
    } catch (error) {
      logger.error('CryptoBot check failed:', error);
      return null;
    }
  }

  /**
   * Проверить статус платежа (ЮKassa)
   */
  async checkYooMoneyPayment(invoiceId) {
    try {
      const shopId = process.env.YOOMONEY_SHOP_ID;
      const secret = process.env.YOOMONEY_SECRET;
      if (!shopId || !secret) throw new Error('ЮKassa credentials not set');
      
      // Подпись запроса
      const data = {
        'request_id': invoiceId,
        'shopId': shopId
      };
      
      const signature = this.generateYooMoneySignature(data, secret);
      
      const response = await fetch('https://yoomoney.ru/api/v1/operation-history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'operation_id': invoiceId })
      });
      
      if (!response.ok) {
        throw new Error(`ЮKassa API error: ${response.status}`);
      }
      
      const result = await response.json();
      return result.operation;
      
    } catch (error) {
      logger.error('YooMoney check failed:', error);
      return null;
    }
  }

  /**
   * Генерация подписи для ЮKassa (HMAC-SHA256)
   */
  generateYooMoneySignature(data, secret) {
    const keys = Object.keys(data).sort();
    const signStr = keys.map(k => `${k}=${data[k]}`).join('&') + secret;
    return crypto.createHmac('sha256', secret).update(signStr).digest('base64');
  }

  /**
   * Подтвердить платёж (изменяем статус и начисляем баланс)
   */
  async confirmPayment(paymentId, txId, receivedAmount) {
    const trx = await db.tx(async t => {
      // Получаем платёж
      const payment = await t.one(
        'SELECT * FROM payments WHERE id = $1 FOR UPDATE',
        [paymentId]
      );
      
      if (payment.status !== 'pending') {
        throw new Error('Payment already processed');
      }
      
      // Меняем статус
      const updated = await t.one(
        `UPDATE payments 
         SET status = 'paid', tx_id = $2, received_amount = $3, paid_at = NOW() 
         WHERE id = $1 RETURNING *`,
        [paymentId, txId, receivedAmount]
      );
      
      // Начисляем баланс на аккаунт пользователя
      if (payment.currency === 'USDT' && payment.method === 'cryptobot') {
        // Начисление USDT: либо на баланс аккаунта (если он есть), либо создаём запись в балансе
        await t.none(
          `INSERT INTO user_balance (user_id, balance_usdt, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (user_id) 
           DO UPDATE SET balance_usdt = user_balance.balance_usdt + EXCLUDED.balance_usdt`,
          [payment.user_id, receivedAmount]
        );
      }
      
      return updated;
    });
    
    logger.info(`Payment confirmed: ${paymentId}, amount: ${receivedAmount}`);
    return trx;
  }

  /**
   * Получить историю платежей пользователя
   */
  async getUserPayments(userId, limit = 20) {
    return await db.any(
      `SELECT p.*, u.username 
       FROM payments p 
       LEFT JOIN users u ON p.user_id = u.id 
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
  }

  /**
   * Сгенерировать ссылку для оплаты (CryptoBot)
   */
  generateCryptoBotLink(invoiceId, amount, description) {
    const baseUrl = 'https://t.me/CryptoBot';
    const params = new URLSearchParams({
      invoice: invoiceId,
      amount: amount.toString(),
      currency: 'USDT',
      description: description
    });
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Сгенерировать ссылку для оплаты (ЮKassa)
   */
  generateYooMoneyLink(invoiceId, amount, description) {
    const shopId = process.env.YOOMONEY_SHOP_ID;
    const secret = process.env.YOOMONEY_SECRET;
    
    const data = {
      'shopId': shopId,
      'orderId': invoiceId,
      'amount': amount,
      'currency': 'RUB',
      'desc': description,
      'successURL': `${config.server.publicUrl}/payments/success?invoice=${invoiceId}`
    };
    
    // Создаём подпись
    const signature = this.generateYooMoneySignature(data, secret);
    data['signature'] = signature;
    
    const params = new URLSearchParams(data);
    return `https://yoomoney.ru/payments?${params.toString()}`;
  }

  /**
   * Периодическая проверкаpending платежей
   */
  async pollPendingPayments() {
    const pending = await db.any(
      `SELECT p.*, u.telegram_id 
       FROM payments p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.status = 'pending' AND p.expires_at > NOW()`
    );
    
    logger.info(`Polling ${pending.length} pending payments`);
    
    for (const payment of pending) {
      try {
        let result;
        
        if (payment.method === 'cryptobot') {
          result = await this.checkCryptoBotPayment(payment.invoice_id);
        } else if (payment.method === 'yoomoney') {
          result = await this.checkYooMoneyPayment(payment.invoice_id);
        } else {
          continue;
        }
        
        if (result && result.status === 'paid') {
          await this.confirmPayment(payment.id, result.tx_id || result.operation_id, result.amount);
          
          // Уведомление пользователю (TODO: через Telegram сервис)
          logger.info(`Payment ${payment.invoice_id} confirmed, notifying user ${payment.user_id}`);
        }
        
      } catch (error) {
        logger.error(`Failed to check payment ${payment.invoice_id}:`, error.message);
      }
    }
  }
}

module.exports = new PaymentService();
