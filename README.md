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

### 2026-04-05 (сессия)
- [x] **Шаг 1:** Создание структуры проекта
  - Директории: `src/`, `config/`, `docs/`, `scripts/`, `tmp/`
  - Инициализация Git-репозитория (локально, commit `ca14627` → `65547a8`)
  - Определение архитектуры и технологии (VLESS + REALITY)

- [x] **Шаг 2:** Настройка базы данных
  - Полная схема PostgreSQL (`src/db/schema.sql`)
  - Таблицы: users, servers, accounts, payments, traffic_logs, referrals
  - Индексы, представления, триггеры

- [x] **Шаг 3:** Базовая конфигурация проекта
  - `package.json` с зависимостями
  - `.env.example`, `.gitignore`
  - `TODO.md` (15 шагов)
  - `scripts/deploy.sh` для деплоя через git-deploy
  - Создана подробная инструкция по деплою: `docs/deployment.md`

- [x] **Деплой на GitHub**
  - Репозиторий создан: **https://github.com/werewolf85/vpn-telegram-bot**
  - Первый push выполнен (commit `65547a8`)
  - Всё рабочее состояние сохранено в истории Git

---

## 📋 План разработки (по шагам)

4. ⏳ **Шаг 4:** Базовый Express.js сервер с API
5. ⏳ **Шаг 5:** Telegram-бот (Telegraf) — команды /start, /balance
6. ⏳ **Шаг 6:** Интеграция Xray-core
7. ⏳ **Шаг 7:** Генерация REALITY-конфигов
8. ⏳ **Шаг 8:** Мониторинг трафика
9. ⏳ **Шаг 9:** Система оплаты USDT
10. ⏳ **Шаг 10:** Автоматическое списание трафика
11. ⏳ **Шаг 11:** Мульти-сервер поддержка
12. ⏳ **Шаг 12:** Админ-панель
13. ⏳ **Шаг 13:** Деплой на VPS
14. ⏳ **Шаг 14:** Тестирование E2E
15. ⏳ **Шаг 15:** Подготовка к продакшену

---

## 🛠️ Технологии

- **Node.js** 22+
- **Express.js** (REST API)
- **Telegraf.js** (Telegram bot)
- **PostgreSQL**
- **Xray-core** (VLESS + REALITY)
- **Docker**
- **USDT (TRC20)** — @CryptoBot

---

## 🚀 Быстрый старт

```bash
git clone https://github.com/werewolf85/vpn-telegram-bot.git
cd vpn-telegram-bot
npm install
cp .env.example .env
# отредактируйте .env

docker run --name vpn-db -e POSTGRES_PASSWORD=secret -p 5432:5432 -d postgres:15
docker exec -it vpn-db psql -U postgres -c "CREATE DATABASE vpn_bot;"
psql -U postgres -d vpn_bot -f src/db/schema.sql

npm run dev    # Express API
npm run bot    # Telegram bot
```

---

## 📝 Лицензия

MIT.

---

**Статус:** 🟢 В разработке (начато 2026-04-05)

**Прогресс:** Шаги 1-3 завершены, код задеплоен на GitHub: https://github.com/werewolf85/vpn-telegram-bot

**Следующий шаг:** Шаг 4 — Базовый Express.js сервер с API.