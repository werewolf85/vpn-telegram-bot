# ProxyGate VPN Telegram Bot 🚀

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

## ✅ Выполненные задачи (2026-04-05)

- [x] Шаг 1: Структура проекта (ProxyGate)
- [x] Шаг 2: База данных PostgreSQL (полная схема)
- [x] Шаг 3: Конфигурация и деплой на GitHub
- [x] Шаг 4: Express.js API (health-check, логгер, авто-миграции)
- [x] Шаг 5: Telegram бот (Telegraf) — команды /start, /config, /balance, /traffic, /servers, /status, /deposit, /payments
- [x] Шаг 6: Интеграция Xray-core (VLESS + REALITY, provision аккаунтов)
- [x] Шаг 7: Мониторинг трафика (Xray API каждые 5 мин, авто-блокировка)
- [x] Шаг 8: Платежная система (CryptoBot USDT + ЮKassa RUB)

**Репозиторий:** https://github.com/werewolf85/vpn-telegram-bot
**Последний коммит:** d943801 (документация по настройке окружения)

---

## 📋 План разработки (оставшиеся шаги)

- [ ] Шаг 9: Webhook для мгновенных платежей (вместо polling)
- [ ] Шаг 10: Автоматическое списание трафика за VPN из баланса
- [ ] Шаг 11: Мульти-сервер — выбор сервера пользователем (кнопки)
- [ ] Шаг 12: Админ-панель (Web UI) — управление серверами, пользователями, статистикой
- [ ] Шаг 13: Деплой на VPS (Ansible или Docker Compose для всего стека)
- [ ] Шаг 14: Тестирование E2E (интеграционные тесты)
- [ ] Шаг 15: Продуктовая готовность (мониторинг, логи, бэкапы, безопасность)

---

## 🎯 Приоритеты на завтра (2026-04-06)

- [ ] Настроить окружение — заполнить `.env` (см. `ENV_SETUP.md`)
- [ ] Запустить локально: PostgreSQL, миграции, сервер, бот
- [ ] Протестировать базовый функционал:
  - [ ] `/start` — регистрация
  - [ ] `/servers` — добавить тестовый сервер в БД вручную
  - [ ] `/config` — создание аккаунта и получение VLESS+REALITY ссылки
  - [ ] `/deposit 1` — если есть CryptoBot токен, протестировать платёж (testnet)
- [ ] Настроить Xray на VPS (если готова инфраструктура)
- [ ] Добавить серверы в БД (админ-запрос или скрипт)
- [ ] Протестировать реальное подключение (V2RayNG с полученной ссылкой)

---

## 🧪 Быстрый старт (тестовый запуск)

### 1. Установка зависимостей
```bash
git clone https://github.com/werewolf85/vpn-telegram-bot.git
cd vpn-telegram-bot
npm install
```

### 2. Настройка окружения
```bash
cp .env.example .env
nano .env  # заполнить минимум (см. ENV_SETUP.md)
```

**Минимальный набор:**
```env
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=820780825
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=secret
```

### 3. Запуск PostgreSQL (Docker)
```bash
docker run --name vpn-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
docker exec -it vpn-db psql -U postgres -c "CREATE DATABASE vpn_bot;"
```

### 4. Миграции базы данных
```bash
npm run db:migrate
```

### 5. Запуск приложения (два терминала)
```bash
# Терминал 1: Express API
npm run dev   # http://localhost:3000

# Терминал 2: Telegram бот
npm run bot
```

### 6. Проверка в Telegram
```
/start          # Регистрация
/balance        # Баланс (пока 0)
/servers        # Список серверов (пусто, нужно добавить)
/config         # Создать аккаунт (требует наличия серверов в БД)
/deposit 1      # Тест платежа (если настроен CryptoBot)
/status         # Статус системы
```

---

## 🗄️ Добавление тестового сервера в БД

Перед использованием `/config` нужно добавить сервер:

```sql
-- В psql или любом клиенте PostgreSQL
INSERT INTO servers (name, country, ip, port, reality_pubkey, reality_shortid, load_percent, enabled)
VALUES (
  'Test-Server',
  'DE',
  '1.2.3.4',  -- замените на реальный IP вашего VPS
  443,
  'your_public_key_here',   -- сгенерировать через npm run xray:keys
  'shortid123',
  0,
  TRUE
);
```

**Как получить REALITY ключи:**
```bash
npm run xray:keys test-server
# Ключи сохранятся в config/reality-keys/test-server.json
```

---

## 💳 Платежи (CryptoBot + ЮKassa)

### Настройка CryptoBot (USDT)
1. В Telegram: @CryptoBot → /start → 👛 Кошелёк → 📥 Receive → 🔗 Generate Payment Link
2. Скопируйте **Token** (формат: `123456:ABC...`)
3. В `.env`: `CRYPTOBOT_TOKEN=ваш_токен`
4. Для тестов включите **Testnet Mode** в настройках кассы (@CryptoBot → Settings)
5. `/deposit 1` в боте → получите ссылку для оплаты test USDT

### Настройка ЮKassa (RUB)
1. Зайдите на [yookassa.ru](https://yookassa.ru/)
2. Настройки магазина → Интеграция → API
3. Создайте API-ключ, скопируйте **Shop ID** и **Secret key**
4. В `.env`: `YOOMONEY_SHOP_ID=...` и `YOOMONEY_SECRET=...`
5. `/deposit 100 yoomoney` → ссылка на оплату на сайте ЮKassa

---

## 🌐 Xray Integration

**Установка на VPS:**
```bash
sudo bash scripts/install-xray.sh
# Установит Xray, создаст systemd service, базовый конфиг
```

**Генерация REALITY ключей:**
```bash
npm run xray:keys my-server
# Ключи: config/reality-keys/my-server.json
```

**Важно:** Текущая генерация через node-crypto (заглушка). Для production используйте `xray crypto reality` или доработайте скрипт.

---

## 📁 Структура проекта (ProxyGate)

```
proxygate-vpn-bot/
├── src/
│   ├── bot.js                      # Инициализация Telegraf
│   ├── bot/handlers/               # 8 обработчиков команд
│   ├── config/index.js             # Конфигурация из .env
│   ├── db/index.js                 # Подключение к PostgreSQL
│   ├── routes/                     # Express роуты (health, API)
│   ├── server.js                   # Express сервер
│   ├── services/                   # Бизнес-логика
│   │   ├── userService.js          # Пользователи, аккаунты
│   │   ├── xrayService.js          # Управление Xray
│   │   ├── trafficMonitor.js       # Мониторинг трафика (5 мин)
│   │   └── paymentService.js       # Платежи (CryptoBot + ЮKassa)
│   ├── xray/manager.js             # Менеджер конфигов Xray
│   └── utils/logger.js             # Winston логгер
├── config/
│   └── xray-config-template.json   # Шаблон Xray конфига
├── db/
│   ├── schema.sql                  # Полная схема БД
│   └── migrations/
│       └── 002_add_payments.sql    # Миграция платежей и баланса
├── scripts/
│   ├── init-db.js
│   ├── migrate.js                  # Автоматические миграции
│   ├── install-xray.sh             # Установка Xray на VPS
│   └── generate-reality-keys.js    # Генерация REALITY ключей
├── .env.example                    # Пример переменных окружения
├── ENV_SETUP.md                    # Подробное руководство по настройке
├── README.md                       # Этот файл
└── SUMMARY.md                      # Полный свод проекта

```

---

## 🔧 Переменные окружения (.env)

**Обязательные минимум:**
```env
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=820780825
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=secret
```

**Полный набор:**
```env
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=...
DB_HOST=...
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=...
DB_PASSWORD=...
CRYPTOBOT_TOKEN=...
MIN_DEPOSIT_USDT=1.0
YOOMONEY_SHOP_ID=...
YOOMONEY_SECRET=...
MIN_DEPOSIT_RUB=100.0
XRAY_CONFIG_PATH=/etc/xray/config.json
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_FILE=./logs/vpn-bot.log
```

**Полное руководство:** `ENV_SETUP.md` (где получить каждый токен/ключ)

---

## 📊 База данных

### Таблицы
- `users` — Telegram пользователи
- `servers` — серверы Xray (ip, port, reality_pubkey, reality_shortid)
- `accounts` — VPN-аккаунты (uuid, traffic_limit, traffic_used, expires_at, active)
- `user_balance` — баланс (USDT, RUB)
- `payments` — история платежей (invoice_id, amount, currency, method, status)
- `traffic_logs` — логи трафика (upload, download)

### Особенности
- Auto-migrations в development (загружаются все `db/migrations/*.sql`)
- Триггеры для обновления `updated_at`
- Индексы на все ключевые поля

---

## 🤖 Команды Telegram бота

| Команда | Описание |
|---------|----------|
| `/start` | Регистрация, приветствие |
| `/config` | Создать/получить VPN конфиг (VLESS+REALITY) |
| `/balance` | Баланс (USDT/RUB) и трафик |
| `/traffic` | Детальная статистика по аккаунтам |
| `/servers` | Список доступных серверов |
| `/status` | Статус системы (серверы, нагрузка, трафик) |
| `/deposit <сумма> [cryptobot\|yoomoney]` | Пополнение баланса |
| `/payments` | История платежей |

**Авторизация:** только пользователи из `ADMIN_TELEGRAM_IDS`

---

## 💳 Платежные системы

### CryptoBot (USDT)
- Создание invoice через API @CryptoBot
- Пользователь оплачивает в своем криптокошельке (Trust Wallet, Binance и т.д.)
- Polling каждые 2 минуты → подтверждение → начисление на баланс
- Минимум: 1 USDT (настраивается)

### ЮKassa (RUB)
- Создание платёжа через ЮKassa API
- Ссылка ведёт на сайт оплаты (банковская карта, Сбер, Альфа и др.)
- После оплаты статус обновляется → баланс в RUB начисляется
- Минимум: 100 RUB (настраивается)

**Вывод средств:**
- **USDT:** Вывод на внешний кошелёк через @CryptoBot → конвертация в RUB/USD через P2P (Binance) → на банковскую карту
- **RUB:** Вывод напрямую на банковскую карту через ЮKassa (требуется верификация магазина)

---

## 📈 Traffic Monitor

- **Опрос:** каждые 5 минут
- **Источник:** Xray API (`/stats?pattern=user:uuid`)
- **Логи:** запись в `traffic_logs`
- **Обновление:** `accounts.traffic_used += upload + download`
- **Авто-блокировка:** при `traffic_used >= traffic_limit` → `active = FALSE`
- **Команда:** `/status` — статистика по серверам и аккаунтам

---

## 🐛 Известные ограничения

1. **REALITY ключи** — генерация через node-crypto (заглушка). В продакшене нужно `xray crypto`.
2. **Выбор сервера** — автоматический (минимальная нагрузка). Нет выбора пользователем.
3. **Webhook платежей** — polling каждые 2 минуты.
4. **Автоматическое списание** — не реализовано (только блокировка по лимиту).
5. **Админ-панель** — только Telegram.
6. **Деплой на VPS** — только скрипт установки Xray.
7. **Тестирование** — не тестировалось на реальном Xray и платежных системах.

---

## 🎯 Следующие шаги (Plans for Steps 9-15)

9. Webhook платежей — мгновенные начисления
10. Авто-списание трафика из баланса (биллинг)
11. Мульти-сервер — выбор через кнопки
12. Веб-админка (Web UI)
13. Деплой на VPS (Ansible/Docker Compose)
14. E2E тестирование
15. Продакшен-готовность (мониторинг, бэкапы, безопасность)

---

## 💡 Идеи для улучшения

- Referral-программа (бонусы за приглашения)
- Автопродление аккаунтов (списание с баланса)
- Push-уведомления о низком балансе/трафике
- Графики статистики (Chart.js)
- Поддержка VMESS, Trojan, Shadowsocks
- Multi-language (EN/RU/KZ)
- Аффилиат-панель

---

## 📝 Лицензия

MIT.

---

**Статус:** 🟢 Готов к тестированию (начато 2026-04-05)

**Репозиторий:** https://github.com/werewolf85/vpn-telegram-bot

**Следующий шаг:** Настроить окружение и протестировать локально (см. раздел "Приоритеты на завтра").

**Автор:** Proxima (Проксима) для Виталия Вяткина
