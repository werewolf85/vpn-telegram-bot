# VPN Telegram Bot 🚀

**VPN-сервис с управлением через Telegram, поддержкой REALITY-маскировки и оплатой в USDT / RUB.**

---

## 🎯 Цель

Обеспечить стабильный доступ к заблокированным сервисам (Telegram, WhatsApp, YouTube, соцсети) для пользователей в РФ через простой и удобный Telegram-интерфейс. Монетизация через криптовалюты (USDT) и фиат (RUB) с автоматическим списанием по трафику.

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

## ✅ Выполненные задачи (на 2026-04-05)

- [x] **Шаг 1:** Создание структуры проекта
- [x] **Шаг 2:** Настройка базы данных (PostgreSQL)
- [x] **Шаг 3:** Базовая конфигурация (package.json, .env, deploy.sh)
- [x] **Шаг 4:** Express.js API (health-check, middleware)
- [x] **Шаг 5:** Telegram-бот (Telegraf) — команды /start, /config, /balance, /traffic, /servers, /status
- [x] **Шаг 6:** Интеграция Xray-core (VLESS + REALITY)
- [x] **Шаг 7:** Мониторинг трафика (Xray API, авто-блокировка)
- [x] **Шаг 8:** Платежная система (CryptoBot USDT + ЮKassa RUB)

**Репозиторий:** https://github.com/werewolf85/vpn-telegram-bot

---

## 🏃 Быстрый старт

### 1. Установка

```bash
git clone https://github.com/werewolf85/vpn-telegram-bot.git
cd vpn-telegram-bot
npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
# Отредактируйте .env с вашими данными
```

**Ключевые переменные:**
```env
TELEGRAM_BOT_TOKEN=12345:ABC...
ADMIN_TELEGRAM_IDS=820780825
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=vpn_user
DB_PASSWORD=secret
CRYPTOBOT_TOKEN=...
YOOMONEY_SHOP_ID=...
YOOMONEY_SECRET=...
```

### 3. База данных

```bash
# Создайте БД в PostgreSQL, затем:
npm run db:migrate
```

### 4. Установка Xray (на VPS)

```bash
sudo bash scripts/install-xray.sh
```

Скрипт установит Xray, создаст systemd service и базовый конфиг.

### 5. Генерация REALITY ключей

```bash
npm run xray:keys my-server
# Ключи сохранятся в config/reality-keys/my-server.json
```

### 6. Запуск

**Режим разработки:**
```bash
npm run dev   # Express API с hot reload
npm run bot   # Telegram бот (отдельный процесс)
```

**Production:**
```bash
npm start     # Запуск API
# Бот можно запустить отдельно: npm run bot
```

---

## 🤖 Команды Telegram бота

| Команда | Описание |
|---------|----------|
| `/start` | Регистрация, приветствие |
| `/config` | Получить/создать VPN конфиг (VLESS + REALITY) |
| `/balance` | Баланс (USDT/RUB) и трафик |
| `/traffic` | Детальная статистика по аккаунтам |
| `/servers` | Список доступных серверов |
| `/status` | Статус системы (серверы, трафик) |
| `/deposit <сумма> [cryptobot\|yoomoney]` | Пополнение баланса |
| `/payments` | История платежей |
| `/help` | Справка |

---

## 💳 Платежи

### CryptoBot (USDT)
1. `/deposit 10` — создаёт invoice на 10 USDT
2. Бот пришлёт ссылку на оплату в Telegram
3. После оплаты баланс начислится автоматически (опрос каждые 2 мин)

### ЮKassa (RUB)
1. `/deposit 500 yoomoney` — создаёт платёж на 500 ₽
2. Ссылка ведёт на сайт ЮKassa
3. После оплаты баланс в RUB зачисляется автоматически

**Минимальные суммы:**
- USDT: 1.0 (настраивается через `MIN_DEPOSIT_USDT`)
- RUB: 100.0 (настраивается через `MIN_DEPOSIT_RUB`)

---

## 📊 API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check |
| GET | `/api/stats` | Общая статистика (админ) |
| POST | `/api/users/:id/balance` | Пополнение баланса (внутренний) |

---

## 🔧 Desarrollo

### Структура проекта

```
vpn-telegram-bot/
├── src/
│   ├── bot.js                 # Инициализация Telegraf
│   ├── bot/handlers/          # Обработчики команд
│   │   ├── start.js
│   │   ├── balance.js
│   │   ├── config.js
│   │   ├── deposit.js
│   │   ├── payments.js
│   │   ├── servers.js
│   │   ├── status.js
│   │   └── traffic.js
│   ├── config/index.js        # Конфигурация
│   ├── db/index.js            # Подключение к PostgreSQL
│   ├── routes/                # Express роуты
│   ├── server.js              # Express сервер
│   ├── services/              # Бизнес-логика
│   │   ├── userService.js
│   │   ├── xrayService.js
│   │   ├── trafficMonitor.js
│   │   └── paymentService.js
│   └── utils/logger.js        # Логгер
├── config/
│   └── xray-config-template.json
├── db/
│   ├── schema.sql             # Полная схема БД
│   └── migrations/
│       └── 002_add_payments.sql
├── scripts/
│   ├── init-db.js
│   ├── migrate.js
│   ├── install-xray.sh
│   └── generate-reality-keys.js
├── .env.example
├── package.json
└── README.md
```

---

## 🧪 Тестирование

1. **Локальная БД:**
   ```bash
   docker run --name vpn-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
   docker exec -it vpn-db psql -U postgres -c "CREATE DATABASE vpn_bot;"
   npm run db:migrate
   ```

2. **Запуск:**
   ```bash
   npm run dev
   npm run bot
   ```

3. **Проверка:**
   - Откройте Telegram, найдите вашего бота
   - `/start` — регистрация
   - `/config` — создаст аккаунт на сервере (если есть серверы в БД)
   - `/deposit 1` — создаст invoice (проверьте логи)

**Примечание:** Для полного теста нужен Xray на сервере и реальные платежи.

---

## 🔒 Безопасность

- Токены хранятся в `.env` (никогда не коммитим)
- Admin-only команды (проверка `ADMIN_TELEGRAM_IDS`)
- PostgreSQL: пароли, параметризованные запросы
- Xray: REALITY (обфускация трафика)

---

## 📝 Лицензия

MIT.

---

**Статус:** 🟢 В разработке (начато 2026-04-05)

**Прогресс:** Шаги 1-8 завершены, код на GitHub: https://github.com/werewolf85/vpn-telegram-bot

**Следующий шаг:** Шаг 9 — Webhook для платежей (для мгновенных уведомлений).
