# 🔧 Настройка переменных окружения (.env)

Этот файл содержит все необходимые настройки для работы VPN Telegram Bot.

---

## 📋 Содержание

1. [Обязательные переменные](#обязательные-переменные)
2. [Платежные системы](#платежные-системы)
3. [База данных](#база-данных)
4. [Xray](#xray)
5. [Сервер и логирование](#сервер-и-логирование)
6. [Полный пример .env](#полный-пример-env)

---

## 📦 Обязательные переменные

### `TELEGRAM_BOT_TOKEN`

**Описание:** Токен вашего Telegram бота от @BotFather

**Как получить:**
1. Откройте Telegram
2. Найдите бота **@BotFather**
3. Отправьте `/newbot`
4. Следуйте инструкциям (выберите имя, username)
5. BotFather пришлёт токен формата: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890`
6. Скопируйте его (без `BotToken:`)

**Пример:**
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
```

---

### `ADMIN_TELEGRAM_IDS`

**Описание:** ID администраторов (разделённые запятой). Только эти пользователи смогут использовать бота.

**Как получить ID:**
1. Откройте Telegram
2. Найдите бота **@userinfobot** (или любой бот, показывающий ваш ID)
3. Отправьте любое сообщение
4. Бот вернёт ваш `id` (число)
5. Для нескольких админов перечислите через запятую

**Пример:**
```env
ADMIN_TELEGRAM_IDS=820780825,123456789
```

---

## 💳 Платежные системы

### CryptoBot (USDT)

**`CRYPTOBOT_TOKEN`**

Токен от бота **@CryptoBot** для приёма USDT (TRC20)

**Как получить:**
1. Откройте Telegram
2. Найдите бота **@CryptoBot**
3. Отправьте `/start`
4. Нажмите "👛 Кошелёк"
5. "📥 Receive"
6. "🔗 Generate Payment Link"
7. В поле "Token" скопируйте токен (формат: `123456:ABC...`)
8. Или откройте @BotFather → выберите @CryptoBot → API Tokens → Copy Token

**Минимальная сумма:** `MIN_DEPOSIT_USDT` (по умолчанию 1.0)

```env
CRYPTOBOT_TOKEN=123456:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
MIN_DEPOSIT_USDT=1.0
```

---

### ЮKassa (RUB)

**`YOOMONEY_SHOP_ID`**

ID вашего магазина в ЮKassa

**Как получить:**
1. Зайдите на [ЮKassa](https://yookassa.ru/)
2. Авторизуйтесь
3. Настройки магазина → Интеграция → API
4. Создайте API-ключ (购物者类型)
5. Скопируйте **Shop ID** (цифры, например: `123456`)

**`YOOMONEY_SECRET`**

Секретный ключ (API-ключ) для подписи запросов

**Как получить:**
Тот же раздел "Интеграция → API" → создать ключ → скопировать значение (длинная строка)

```env
YOOMONEY_SHOP_ID=123456
YOOMONEY_SECRET=test_ABCD1234567890abcdefghijklmnopqrstuvwxyz
MIN_DEPOSIT_RUB=100.0
```

**Примечание:** Для тестов можно использовать тестовый режим ЮKassa (перед переводом в продакшен измените `YOOMONEY_SECRET` на боевой).

---

## 🗄️ База данных

### PostgreSQL

**`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`**

Данные для подключения к PostgreSQL

**Как настроить:**

**Вариант A: Локальный PostgreSQL**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=ваш_пароль_от_postgres
```

**Вариант B: Docker (проще)**
```bash
docker run --name vpn-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=vpn_bot \
  -p 5432:5432 \
  -d postgres:15
```
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=secret
```

**Вариант C: Облачный PostgreSQL (Supabase, Neon, RDS)**
- Получите connection string от провайдера
- Разберите на части:

Connection string: `postgresql://user:password@host:port/database`

```env
DB_HOST=your-host.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=your-user
DB_PASSWORD=your-password
```

---

## ⚙️ Xray

### `XRAY_CONFIG_PATH`

Путь к конфигурационному файлу Xray на сервере

**По умолчанию:** `/etc/xray/config.json` (если установлен через скрипт)

**Как изменить:** если укажете другой путь, менеджер будет использовать его

```env
XRAY_CONFIG_PATH=/etc/xray/config.json
```

---

## 🖥️ Сервер и логирование

### `PORT`, `NODE_ENV`

Порт сервера и режим выполнения

**Рекомендации:**
- Development: `NODE_ENV=development`, `PORT=3000`
- Production: `NODE_ENV=production`, `PORT=8080` (или 80/443 через reverse proxy)

```env
PORT=3000
NODE_ENV=development
```

### `LOG_LEVEL`, `LOG_FILE`

Уровень логирования и файл логов

```env
LOG_LEVEL=info       # debug, info, warn, error
LOG_FILE=./logs/vpn-bot.log
```

---

## 🔒 Прочие настройки (опционально)

### `SERVERS_JSON_PATH`

Путь к JSON-файлу с конфигурацией серверов (если хотите хранить в файле)

**Пример `config/servers.json`:**
```json
[
  {
    "name": "Singapore-1",
    "country": "SG",
    "ip": "1.2.3.4",
    "port": 443,
    "reality_shortid": "sg123"
  }
]
```

```env
SERVERS_JSON_PATH=./config/servers.json
```

### `DEFAULT_TRAFFIC_LIMIT_GB`, `DEFAULT_EXPIRY_DAYS`

Лимиты по умолчанию для новых аккаунтов

```env
DEFAULT_TRAFFIC_LIMIT_GB=100
DEFAULT_EXPIRY_DAYS=30
```

---

## 📝 Полный пример `.env`

```env
# ============================================
# TELEGRAM BOT
# ============================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
ADMIN_TELEGRAM_IDS=820780825

# ============================================
# DATABASE (PostgreSQL)
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vpn_bot
DB_USER=postgres
DB_PASSWORD=secret

# ============================================
# PAYMENTS — CryptoBot (USDT)
# ============================================
CRYPTOBOT_TOKEN=123456:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890
MIN_DEPOSIT_USDT=1.0

# ============================================
# PAYMENTS — ЮKassa (RUB)
# ============================================
YOOMONEY_SHOP_ID=123456
YOOMONEY_SECRET=test_ABCD1234567890abcdefghijklmnopqrstuvwxyz
MIN_DEPOSIT_RUB=100.0

# ============================================
# XRAY
# ============================================
XRAY_CONFIG_PATH=/etc/xray/config.json

# ============================================
# SERVER & LOGGING
# ============================================
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_FILE=./logs/vpn-bot.log

# ============================================
# OPTIONAL
# ============================================
SERVERS_JSON_PATH=./config/servers.json
DEFAULT_TRAFFIC_LIMIT_GB=100
DEFAULT_EXPIRY_DAYS=30
```

---

## ⚠️ Что НЕ нужно (если нет)

Эти переменные используются в будущих шагах, но сейчас не требуются:

- `TELEGRAM_WEBHOOK_URL` — для webhook (вместо polling)
- `XRAY_API_PORT` — если хотите другой порт для API
- `REFERRAL_BONUS` — реферальная программа
- `NOTION_API_KEY`, `BRAVESEARCH_API_KEY` — для поиска (дополнительно)

---

## ✅ Проверка настройки

После заполнения `.env` выполните:

```bash
# 1. Проверьте синтаксис
node -e "require('dotenv').config(); console.log('OK: TELEGRAM_BOT_TOKEN' in process.env ? '✅' : '❌')"

# 2. Убедитесь, что все обязательные переменные заданы
cat .env | grep -v '^#' | grep -v '^$' | wc -l
# Должно быть минимум 8 строк с данными (без комментариев)

# 3. Запустите миграции
npm run db:migrate

# 4. Старт сервера
npm run dev
# В логах должно быть: "✅ All migrations applied" или ошибка с указанием какой переменной не хватает
```

---

## 🔄 Где что заполнять

| Переменная | Где взять | Кто заполняет |
|------------|-----------|---------------|
| TELEGRAM_BOT_TOKEN | @BotFather | Вы |
| ADMIN_TELEGRAM_IDS | @userinfobot | Вы |
| DB_* | Локальный PostgreSQL / Docker / Облако | Вы/админ БД |
| CRYPTOBOT_TOKEN | @CryptoBot → API | Вы |
| YOOMONEY_* | yookassa.ru → Настройки магазина → API | Вы (или бухгалтер) |
| XRAY_CONFIG_PATH | Путь на VPS (/etc/xray/config.json) | Админ сервера |

---

## 🤔 Проблемы?

### Ошибка: "Missing required environment variables"
Перечислите все обязательные переменные в `.env` (см. список в начале файла).

### CryptoBot не приходит платёж
- Убедитесь, что бот **@CryptoBot** добавлен в администраторы кассира (если используете кассу)
- Проверьте, что токен имеет права на `create_invoice`
- Минимальная сумма: 1 USDT

### ЮKassa: "Invalid shopId"
- Проверьте Shop ID в настройках магазина
- Убедитесь, что ключ активен (не удалён)
- Для тестов используйте тестовые ключи (`test_` префикс)

### Xray: "Failed to reload"
- Убедитесь, что Xray установлен (`/usr/local/bin/xray`)
- Проверьте права на конфиг: `sudo chown nobody:nogroup /etc/xray/config.json`
- Запустите вручную: `sudo systemctl status xray`

---

**После заполнения `.env`:**  
1. Сохраните файл в корне проекта  
2. Никогда не коммитьте его в Git (уже в `.gitignore`)  
3. Запустите `npm run db:migrate`  
4. Стартуйте бота: `npm run bot` и сервер: `npm run dev`

Удачи! 🚀
