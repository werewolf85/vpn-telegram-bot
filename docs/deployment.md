# Деплой проекта: VPN Telegram Bot

## Быстрый старт (3 шага)

### 1. Создайте репозиторий на GitHub

1. Зайдите на https://github.com/new
2. Укажите имя репозитория (например, `vpn-telegram-bot`)
3. **Не ставьте галочки**: "Add a README file", "Add .gitignore", "Add a license"
4. Нажмите "Create repository"

### 2. Запустите деплой

```bash
cd ~/.openclaw/workspace/projects/vpn-telegram-bot

# Сделайте скрипт исполняемым (один раз)
chmod +x scripts/deploy.sh

# Запустите деплой, указав URL вашего репозитория
./scripts/deploy.sh https://github.com/YOUR_USERNAME/vpn-telegram-bot.git main
```

**Что произойдёт:**
- Скрипт скопирует все файлы проекта в `~/deploys/vpn-telegram-bot`
- Инициализирует git-репозиторий (если ещё не)
- Сделает commit: `Deploy by Proxima {timestamp}`
- Отправит (push) код в ветку `main` на GitHub

### 3. Проверьте

Откройте https://github.com/YOUR_USERNAME/vpn-telegram-bot — все файлы должны быть на GitHub.

---

## Как это работает

### Навык `git-deploy`

Команда `deploy_git` принимает:
- `source_path` — откуда брать файлы (наша папка проекта)
- `target_path` — куда копировать (локальная папка-репо)
- `remote_url` — куда пушить (GitHub URL)
- `branch` — ветка (по умолчанию `main`)

```bash
deploy_git ~/.openclaw/workspace/projects/vpn-telegram-bot \
          ~/deploys/vpn-telegram-bot \
          https://github.com/username/repo.git \
          main
```

### Токен GitHub

Для авторизации используется `GITHUB_TOKEN`, который уже настроен в окружении OpenClaw. Токен имеет права `repo`, поэтому может пушить в любые репозитории.

**Важно:** Токен хранится в переменных окружения и не попадает в код.

---

## Проблемы и решения

### "Authentication failed"
- Убедитесь, что `GITHUB_TOKEN` установлен: `echo $GITHUB_TOKEN`
- Токен должен иметь права `repo` (полный доступ к приватным и публичным репо)
- Если токен просрочен, создайте новый в GitHub Settings → Developer settings → Personal access tokens

### "Repository not found"
- Проверьте, что репозиторий создан (пустой, без README)
- Проверьте URL: `https://github.com/username/repo.git` (должен быть .git)
- Убедитесь, что у вашего аккаунта есть доступ к этому репо

### "Failed to push some refs"
- Это конфликт истории. Решение:
  ```bash
  cd ~/deploys/vpn-telegram-bot
  git pull --rebase origin main
  # затем снова запустите deploy.sh
  ```
- Или используйте `--force` (перезапишет удалённую историю): `deploy_git ... --force`

---

## Дополнительные команды

### Просмотр текущих remote
```bash
cd ~/deploys/vpn-telegram-bot
git remote -v
```

### Принудительный передеплой (если что-то пошло не так)
```bash
# Очистить целевую папку
rm -rf ~/deploys/vpn-telegram-bot/*
# Заново
./scripts/deploy.sh https://github.com/username/repo.git main
```

### Смена remote URL
```bash
cd ~/deploys/vpn-telegram-bot
git remote set-url origin https://github.com/newusername/newrepo.git
```

---

## Автоматизация

После каждого завершённого шага (Шаг 4, Шаг 5, ...) выполняйте деплой:

```bash
./scripts/deploy.sh https://github.com/YOUR_USERNAME/vpn-telegram-bot.git main
```

Это сохранит прогресс в истории Git и позволит откатиться при необходимости.

---

## Отладка

Если деплой не работает, проверьте:

1. **Локальный git-репо существует?**
   ```bash
   ls -la ~/deploys/vpn-telegram-bot/.git
   ```

2. **Remote добавлен?**
   ```bash
   cd ~/deploys/vpn-telegram-bot && git remote -v
   ```

3. **Авторизация работает?**
   ```bash
   git ls-remote origin
   ```
   Должен вывести список refs (или ничего, если пустой репо).

4. **Проверьте GITHUB_TOKEN:**
   ```bash
   echo "Bearer $GITHUB_TOKEN" | curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user
   ```
   Должен вернуть информацию о пользователе.

---

## Примечания

- **Не деплойте чувствительные данные:** Убедитесь, что в `.env` и других конфигах нет реальных токенов/паролей перед коммитом. Используйте `.env.example` и документируйте переменные.
- **Секреты:** Настоящие токены (CRYPTOBOT_TOKEN, DB_PASSWORD) должны храниться только на сервере, не в GitHub.
- **Логи:** Добавьте `logs/` в `.gitignore`, чтобы не коммитить логи.

---

**После успешного деплоя** переходите к следующему шагу разработки (например, Шаг 4: Express.js сервер).
