-- Миграция 002: Добавление таблиц платежей и баланса пользователей

BEGIN;

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL UNIQUE,
  amount DECIMAL(12,4) NOT NULL,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('USDT', 'RUB', 'USD')),
  method VARCHAR(20) NOT NULL CHECK (method IN ('cryptobot', 'yoomoney')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  tx_id VARCHAR(255),
  received_amount DECIMAL(12,4),
  paid_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Таблица баланса пользователей
CREATE TABLE IF NOT EXISTS user_balance (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_usdt DECIMAL(12,4) DEFAULT 0.0,
  balance_rub DECIMAL(12,4) DEFAULT 0.0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_balance_updated ON user_balance(updated_at);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_user_balance_updated_at 
  BEFORE UPDATE ON user_balance 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

COMMIT;

-- Комментарии
COMMENT ON TABLE payments IS 'История платежей (пополнения через CryptoBot и ЮKassa)';
COMMENT ON COLUMN payments.invoice_id IS 'Уникальный ID счета в платежной системе';
COMMENT ON COLUMN payments.method IS 'cryptobot | yoomoney';
COMMENT ON TABLE user_balance IS 'Баланс пользователей в USDT и RUB';
