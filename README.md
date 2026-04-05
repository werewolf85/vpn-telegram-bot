# VPN Telegram Bot 🚀

**VPN-сервис с управлением через Telegram, поддержкой REALITY-маскировки и оплатой в USDT.**

---

## 🎯 Цель

Обеспечить стабильный доступ к заблокированным сервисам (Telegram, WhatsApp, YouTube, соцсети) для пользователей в РФ через простой и удобный Telegram-интерфейс. Монетизация через криптовалюты (USDT) с автоматическим списанием по трафику.

---

## 🏗️ Архитектура

```
Пользователь → Telegram Bot → Backend API → Xray-core (VPS) → Интернет
```

- **Telegram Bot** — интерфейс управления (баланс, конфиги, статистика)
- **Backend** — Node.js + Express + PostgreSQL
- **Xray-core** — прокси-сервер с REALITY (маскировка под HTTPS)
- **VPS** — Hetzner/Vultr (DE, FI, SG)

---

## ✅ Выполненные задачи

### 2026-04-05
- [x] Шаг 1: Создание структуры проекта
  - Директории: `src/`, `config/`, `docs/`, `scripts/`, `tmp/`
  - Инициализация Git-репозитория (локально)
  - Создание базового README.md с планом разработки
  - Определение архитектуры: Telegram Bot + Express API + PostgreSQL + Xray-core
  - Выбор технологии: VLESS + REALITY для обхода DPI

- [x] Шаг 2: Настройка базы данных
  - Спроектирована схема PostgreSQL (schema.sql)
  - Таблицы: users, servers, accounts, payments, traffic_logs, referrals
  - Индексы для производительности
  - Представления (views) для статистики и выбора сервера
  - Триггеры для автоматического обновления `updated_at`

---

## 📋 План разработки (по шагам)

1. ✅ **Шаг 1:** Создание структуры проекта (выполнен)
2. ✅ **Шаг 2:** Настройка базы данных (PostgreSQL schema) (выполнен)
3. ⏳ **Шаг 3:** Базовый Express.js сервер с API
4. ⏳ **Шаг 4:** Telegram-бот (Telegraf) — команды /start, /balance
5. ⏳ **Шаг 5:** Интеграция Xray-core: создание пользователей, управление
6. ⏳ **Шаг 6:** Генерация REALITY-конфигов (vless://)
7. ⏳ **Шаг 7:** Мониторинг трафика (Xray API → БД)
8. ⏳ **Шаг 8:** Система оплаты USDT (CryptoBot integration)
9. ⏳ **Шаг 9:** Автоматическое списание трафика, блокировка при превышении
10. ⏳ **Шаг 10:** Мульти-сервер поддержка, выбор сервера
11. ⏳ **Шаг 11:** Админ-панель (статистика, управление пользователями)
12. ⏳ **Шаг 12:** Деплой на VPS (Docker-compose)
13. ⏳ **Шаг 13:** Тестирование E2E, нагрузочное тестирование
14. ⏳ **Шаг 14:** Подготовка к продакшену (бэкапы, мониторинг, логи)

---

## 🛠️ Технологии

- **Node.js** 22+
- **Express.js** (REST API)
- **Telegraf.js** (Telegram bot)
- **PostgreSQL** (данные пользователей, payments, traffic)
- **Xray-core** (VLESS + REALITY)
- **Docker** (деплой)
- **USDT (TRC20)** — приём платежей через @CryptoBot

---

## 📂 Структура проекта

```
vpn-telegram-bot/
├── src/
│   ├── bot.js              # Telegram bot logic
│   ├── server.js           # Express API server
│   ├── db/
│   │   ├── schema.sql      # Database schema
│   │   ├── models/         # ORM models (pg-promise)
│   │   └── migrations/     # DB migrations
│   ├── xray/
│   │   ├── manager.js      # Xray config management
│   │   ├── stats.js        # Traffic stats collector
│   │   └── configs/        # Generated Xray configs
│   ├── payments/
│   │   ├── cryptobot.js    # CryptoBot API integration
│   │   └── invoices.js     # Invoice generation
│   ├── config/
│   │   └── servers.json    # Server list (IP, country, reality keys)
│   └── utils/
│       ├── logger.js       # Winston logger
│       └── helpers.js      # Common helpers
├── config/
│   ├── xray-config.json   # Xray base config template
│   └── reality-keys/       # Generated REALITY keypairs per server
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   └── user-guide.md
├── scripts/
│   ├── deploy.sh           # Deploy to VPS
│   ├── backup.sh           # Database backup
│   └── monitor.sh          # Health check script
├── docker/
│   ├── Dockerfile.bot
│   ├── Dockerfile.xray
│   └── docker-compose.yml
├── tests/
│   └── integration.test.js
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── TODO.md
```

---

## 🔐 Безопасность

- **Токены** хранятся в переменных окружения (`.env`)
- **GITHUB_TOKEN** — для деплоя кода (есть в окружении)
- **CRYPTOBOT_TOKEN** — для приёма USDT
- **DB_PASSWORD** — надёжный пароль
- **Xray Reality Keys** — генерируются индивидуально на сервер

---

## 💾 База данных (PostgreSQL)

```sql
-- Пользователи Telegram
users: telegram_id (PK), username, first_name, last_name, created_at, updated_at

-- Аккаунты VPN (на серверах)
accounts: id, user_id (FK), server_id (FK), uuid, email, traffic_limit, traffic_used, expires_at, active, created_at

-- Серверы
servers: id, name, country, ip, port, reality_pubkey, reality_shortid, load_percent, enabled, created_at

-- Платежи
payments: id, user_id, amount_usdt, txid, crypto, status, confirmed_at, created_at

-- Транзакции трафика (логи)
traffic_logs: id, account_id, upload_bytes, download_bytes, timestamp

-- Реферальные связи (опционально)
referrals: referrer_id, referee_id, bonus_amount, created_at
```

---

## 🚀 Быстрый старт (разработка)

```bash
# Клонировать проект
git clone <repo-url>
cd vpn-telegram-bot

# Установить зависимости
npm install

# Настроить .env (скопировать из .env.example)
cp .env.example .env
# Отредактировать .env: DB_URL, TELEGRAM_BOT_TOKEN, CRYPTOBOT_TOKEN

# Запустить БД (PostgreSQL) — можно через Docker
docker run --name vpn-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15

# Применить миграции
npm run db:migrate

# Запустить в dev-режиме
npm run dev
```

---

## 📝 Лицензия

MIT — можно использовать коммерчески.

---

**Статус:** 🟢 В разработке (активная разработка начата 2026-04-05)
