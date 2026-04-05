# 📋 Сводка проекта: VPN Telegram Bot

**Дата:** 2026-04-05
**Статус:** Шаг 8 завершён, готов к тестированию
**Репозиторий:** https://github.com/werewolf85/vpn-telegram-bot

---

## 🎯 Общая архитектура

```
Пользователь → Telegram Bot → Backend API (Node.js + Express) → PostgreSQL
                                    ↓
                              Xray-core (VLESS + REALITY)
                                    ↓
                              Интернет
```

---

## ✅ Выполненные шаги (1-8)

### Шаг 1: Структура проекта
- ✅ Директории: `src/`, `config/`, `docs/`, `scripts/`, `db/`
- ✅ `package.json`, `.gitignore`, `TODO.md`
- ✅ Инициализация Git (локально)

**Коммит:** `65547a8`

---

### Шаг 2: База данных
- ✅ Полная схема PostgreSQL (`db/schema.sql`)
- ✅ Таблицы: `users`, `servers`, `accounts`, `traffic_logs`
- ✅ Индексы, триггеры, комментарии

**Коммит:** `65547a8`

---

### Шаг 3: Конфигурация и deploy
- ✅ Конфиг: `src/config/index.js`
- ✅ `.env.example`, `scripts/deploy.sh`
- ✅ Документация деплоя: `docs/deployment.md`

**Коммит:** `65547a8`

**Деплой:** Создано репо на GitHub, первый push

---

### Шаг 4: Express.js API
- ✅ `src/server.js` — Express + helmet + cors
- ✅ Логгер: `src/utils/logger.js`
- ✅ Подключение к PostgreSQL: `src/db/index.js`
- ✅ Health-check: `/health`
- ✅ Auto-migrations в development

**Коммит:** `e427240`

---

### Шаг 5: Telegram бот (Telegraf)
- ✅ `src/bot.js` — инициализация, middleware авторизации
- ✅ Обработчики команд:
  - `/start` — регистрация
  - `/config` — создать/получить VPN конфиг
  - `/balance` — баланс и трафик
  - `/traffic` — детальная статистика
  - `/servers` — список серверов
  - `/status` — статус системы
- ✅ `src/services/userService.js` — работа с пользователями и аккаунтами

**Коммит:** `8fcf067`

---

### Шаг 6: Интеграция Xray-core
- ✅ `src/xray/manager.js` — управление конфигами, REALITY ключи
- ✅ `src/services/xrayService.js` — provision/deprovision аккаунтов
- ✅ Скрипты:
  - `scripts/install-xray.sh` — установка Xray на VPS
  - `scripts/generate-reality-keys.js` — генерация REALITY ключей
- ✅ Шаблон конфига: `config/xray-config-template.json`
- ✅ Автоматическое добавление UUID в Xray конфиг при создании аккаунта

**Коммит:** `68a1099`

---

### Шаг 7: Мониторинг трафика
- ✅ `src/services/trafficMonitor.js` — опрос Xray API каждые 5 минут
- ✅ Логирование в `traffic_logs`
- ✅ Авто-блокировка аккаунта при превышении лимита (`active = FALSE`)
- ✅ Команда `/status` — общая статистика системы
- ✅ Интеграция в сервер (автозапуск при старте)

**Коммит:** `fef6b48`

---

### Шаг 8: Платежная система
- ✅ `src/services/paymentService.js` — поддержка двух платёжных систем:
  - **CryptoBot** (USDT через Telegram)
  - **ЮKassa** (RUB через веб)
- ✅ Таблицы: `payments`, `user_balance`
- ✅ Миграция: `db/migrations/002_add_payments.sql`
- ✅ Команды:
  - `/deposit <сумма> [cryptobot|yoomoney]` — создание invoices
  - `/payments` — история платежей
- ✅ Периодический опрос pending платежей (каждые 2 минуты)
- ✅ Автоматическое начисление баланса при подтверждении
- ✅ Обновлён `/balance` — показывает USDT и RUB
- ✅ Автоматические миграции в development режиме

**Коммит:** `ad6e642`, `d943801`

---

## 📊 Текущие возможности

### Telegram бот
- Регистрация пользователей
- Автоматическое создание VPN-аккаунтов на лучшем сервере
- Генерация VLESS+REALITY ссылок для импорта в V2RayNG/Shadowrocket
- Статистика по трафику и балансу
- Пополнение баланса (USDT через CryptoBot, RUB через ЮKassa)
- История платежей
- Общий статус системы

### Backend
- REST API (Express)
- Подключение к PostgreSQL
- Модули:
  - User Service
  - Xray Service
  - Traffic Monitor
  - Payment Service
- Автоматические миграции
- Логирование (Winston)

### База данных
- Полная схема готова
- Индексы для производительности
- Триггеры для автоматического обновления `updated_at`
- Поддержка foreign keys и каскадных удалений

---

## 📁 Структура проекта (основные файлы)

```
vpn-telegram-bot/
├── src/
│   ├── bot.js                      # Инициализация Telegraf
│   ├── bot/handlers/               # 8 обработчиков команд
│   ├── config/index.js             # Конфигурация из .env
│   ├── db/index.js                 # Подключение к PostgreSQL
│   ├── server.js                   # Express сервер
│   ├── services/
│   │   ├── userService.js          # Пользователи и аккаунты
│   │   ├── xrayService.js          # Управление Xray
│   │   ├── trafficMonitor.js       # Мониторинг трафика
│   │   └── paymentService.js       # Платежи (CryptoBot + ЮKassa)
│   ├── xray/manager.js             # Менеджер конфигов Xray
│   └── utils/logger.js             # Логгер Winston
├── db/
│   ├── schema.sql                  # Полная схема БД
│   └── migrations/
│       └── 002_add_payments.sql    # Миграция платежей
├── config/
│   └── xray-config-template.json   # Шаблон Xray конфига
├── scripts/
│   ├── init-db.js
│   ├── migrate.js
│   ├── install-xray.sh             # Установка Xray на VPS
│   └── generate-reality-keys.js    # Генерация REALITY ключей
├── .env.example                    # Пример переменных окружения
├── ENV_SETUP.md                    # Подробное руководство по настройке
├── package.json
└── README.md                       # Основная документация
```

---

## 🔧 Что нужно заполнить для запуска

### Минимум (для тестов без платежей и Xray):
```
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=...
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=secret
```

### Полный набор (все функции):
```
TELEGRAM_BOT_TOKEN=...
ADMIN_TELEGRAM_IDS=...
DB_HOST=...
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=...
DB_PASSWORD=...

# Платежи (опционально)
CRYPTOBOT_TOKEN=...
MIN_DEPOSIT_USDT=1.0
YOOMONEY_SHOP_ID=...
YOOMONEY_SECRET=...
MIN_DEPOSIT_RUB=100.0

# Xray (опционально)
XRAY_CONFIG_PATH=/etc/xray/config.json
```

---

## 🚀 Как протестировать

```bash
# 1. Клонировать и установить
git clone https://github.com/werewolf85/vpn-telegram-bot
cd vpn-telegram-bot
npm install

# 2. Создать .env
cp .env.example .env
nano .env  # заполнить минимум (см. выше)

# 3. Запустить БД
docker run --name vpn-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
docker exec -it vpn-db psql -U postgres -c "CREATE DATABASE vpn_bot;"

# 4. Применить миграции
npm run db:migrate

# 5. Запустить
npm run dev     # Express API (порт 3000)
npm run bot     # Telegram бот (отдельный процесс)

# 6. В Telegram
/start
/config  # покажет "нет серверов" — нужно добавить серверы в БД вручную
/deposit 1  # если заданы платежные токены
```

---

## 📈 Статистика кода

- **Файлов создано:** ~40
- **Строк кода:** ~2500+
- **Коммитов:** 10+
- **Библиотек:** express, telegraf, pg-promise, winston, axios, uuid
- **Модулей:** 8 (server, bot, 4 services, xray manager, config)

---

## 🔜 Что дальше?

### Тестирование
1. Запустить локально с реальным Telegram ботом
2. Проверить регистрацию (/start)
3. Проверить создание аккаунта (/config) — потребует добавления сервера в БД
4. Проверить платежи (если настроены CryptoBot/ЮKassa)

### Первый деплой на VPS (опционально)
1. Настроить PostgreSQL на VPS
2. Установить Xray (`npm run xray:install`)
3. Сгенерировать REALITY ключи (`npm run xray:keys`)
4. Добавить серверы в БД (INSERT INTO servers ...)
5. Запустить бота и API
6. Настроить Nginx как reverse proxy
7. Настроить systemd services для автозапуска

---

## 📝 Примечания

- ** REALITY ключи:** сейчас генерируются через node-crypto (заглушка). Для продакшена нужно использовать `xray crypto` напрямую или доработать генерацию.
- **Webhook платежей:** реализован polling каждые 2 минуты. Можно добавить webhook для мгновенных уведомлений.
- **Выбор сервера:** сейчас выбирается автоматически (с минимальной нагрузкой). Можно добавить выбор пользователем.
- **Автоматическое списание:** логика для списания трафика за VPN не реализована (пока только лимит).
- **Баланс:** пополняется в USDT/RUB, но не используется для автоматического создания/продления аккаунтов.

---

**Статус:** Готов к тестированию базовой функциональности ✅

**Последний коммит:** `d943801` — документация по настройке окружения
