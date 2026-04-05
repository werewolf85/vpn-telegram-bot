-- VPN Telegram Bot — Database Schema
-- PostgreSQL 15+

-- Пользователи Telegram
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);

-- Серверы (VPS с Xray)
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,          -- 'DE-Hetzner-1', 'FI-Vultr-2'
    country CHAR(2) NOT NULL,            -- 'DE', 'FI', 'SG'
    ip INET NOT NULL,                    -- Серверный IP
    port INTEGER NOT NULL DEFAULT 443,   -- Порт VLESS
    reality_pubkey VARCHAR(255) NOT NULL, -- Публичный ключ REALITY
    reality_shortid VARCHAR(50) NOT NULL, -- Короткий ID REALITY
    load_percent REAL DEFAULT 0.0,       -- Нагрузка (для выбора)
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_servers_country ON servers(country);
CREATE INDEX idx_servers_enabled ON servers(enabled);

-- Аккаунты VPN (по одному на пользователя на сервер)
CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    server_id INTEGER NOT NULL REFERENCES servers(id),
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,        -- Уникальный email-like идентификатор
    traffic_limit BIGINT DEFAULT 0,     -- В байтах (0 = безлимит)
    traffic_used BIGINT DEFAULT 0,      -- В байтах
    expires_at TIMESTAMPTZ,             -- Дата истечения аккаунта
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, server_id)          -- Один пользователь может иметь только один аккаунт на сервер
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_server_id ON accounts(server_id);
CREATE INDEX idx_accounts_active ON accounts(active);
CREATE INDEX idx_accounts_expires ON accounts(expires_at);

-- Платежи (USDT через CryptoBot)
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    amount_usdt NUMERIC(10,2) NOT NULL,  -- Сумма в USDT
    txid VARCHAR(255),                   -- TxID в блокчейне
    crypto VARCHAR(20) DEFAULT 'USDT_TRC20',
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_txid ON payments(txid);

-- Логи трафика (можно агрегировать пакетно)
CREATE TABLE IF NOT EXISTS traffic_logs (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES accounts(id),
    upload_bytes BIGINT NOT NULL DEFAULT 0,
    download_bytes BIGINT NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traffic_logs_account_id ON traffic_logs(account_id);
CREATE INDEX idx_traffic_logs_timestamp ON traffic_logs(timestamp);

-- Реферальные связи (опционально)
CREATE TABLE IF NOT EXISTS referrals (
    referrer_id BIGINT NOT NULL REFERENCES users(id), -- Кто пригласил
    referee_id BIGINT NOT NULL REFERENCES users(id), -- Кого пригласил
    bonus_usdt NUMERIC(10,2) DEFAULT 0.0,             -- Бонус за приглашение
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(referrer_id, referee_id)
);

CREATE INDEX idx_referrals_referee ON referrals(referee_id);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at
    BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Представление для быстрой статистики пользователя
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.first_name,
    COUNT(a.id) as active_accounts,
    COALESCE(SUM(a.traffic_used), 0) as total_traffic_used,
    COALESCE(SUM(a.traffic_limit), 0) as total_traffic_limit,
    MAX(a.expires_at) as latest_expiry
FROM users u
LEFT JOIN accounts a ON u.id = a.user_id AND a.active = TRUE
GROUP BY u.id, u.username, u.first_name;

-- Представление для выбора сервера с минимальной нагрузкой
CREATE OR REPLACE VIEW server_load AS
SELECT 
    s.*,
    COUNT(a.id) as active_connections
FROM servers s
LEFT JOIN accounts a ON s.id = a.server_id AND a.active = TRUE
WHERE s.enabled = TRUE
GROUP BY s.id
ORDER BY s.load_percent ASC, active_connections ASC;
