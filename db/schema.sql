-- Полная схема базы данных VPN Telegram Bot

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Пользователи Telegram
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Серверы Xray
CREATE TABLE IF NOT EXISTS servers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  ip INET NOT NULL,
  port INTEGER NOT NULL,
  reality_pubkey TEXT NOT NULL,
  reality_shortid VARCHAR(50) NOT NULL,
  load_percent INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_servers_enabled ON servers(enabled);
CREATE INDEX idx_servers_country ON servers(country);

-- Аккаунты (VPN-подключения)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  server_id INTEGER NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  uuid UUID NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  traffic_limit BIGINT NOT NULL DEFAULT 0, -- в байтах (0 = unlimited)
  traffic_used BIGINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_server_id ON accounts(server_id);
CREATE INDEX idx_accounts_uuid ON accounts(uuid);
CREATE INDEX idx_accounts_active ON accounts(active);
CREATE INDEX idx_accounts_expires_at ON accounts(expires_at);

-- Баланс пользователей
CREATE TABLE IF NOT EXISTS user_balance (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance_usdt DECIMAL(12,4) DEFAULT 0.0,
  balance_rub DECIMAL(12,4) DEFAULT 0.0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_balance_updated ON user_balance(updated_at);

-- Платежи
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

-- Логи трафика (опционально, для детальной аналитики)
CREATE TABLE IF NOT EXISTS traffic_logs (
  id BIGSERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  upload_bytes BIGINT NOT NULL DEFAULT 0,
  download_bytes BIGINT NOT NULL DEFAULT 0,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_traffic_logs_account_id ON traffic_logs(account_id);
CREATE INDEX idx_traffic_logs_timestamp ON traffic_logs(timestamp);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_balance_updated_at 
  BEFORE UPDATE ON user_balance 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- Комментарии
COMMENT ON TABLE users IS 'Пользователи Telegram бота';
COMMENT ON TABLE servers IS 'Серверы Xray с REALITY';
COMMENT ON TABLE accounts IS 'VPN-аккаунты (UUID) привязанные к серверам';
COMMENT ON TABLE user_balance IS 'Баланс пользователей в USDT и RUB';
COMMENT ON TABLE payments IS 'История платежей через CryptoBot и ЮKassa';
COMMENT ON TABLE traffic_logs IS 'Логи трафика по аккаунтам (опционально)';
