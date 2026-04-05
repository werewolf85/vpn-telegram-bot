#!/bin/bash
# deploy.sh — Деплой проекта на GitHub через git-deploy навык
# Использование: ./deploy.sh <remote_url> [branch]

set -e

PROJECT_DIR="$HOME/.openclaw/workspace/projects/vpn-telegram-bot"
DEPLOY_TARGET="${HOME}/deploys/vpn-telegram-bot"

REMOTE_URL="${1:-https://github.com/USERNAME/REPO.git}"
BRANCH="${2:-main}"

echo "🚀 Deploying VPN Telegram Bot to ${REMOTE_URL} (branch: ${BRANCH})"
echo "📁 Source: ${PROJECT_DIR}"
echo "📁 Target: ${DEPLOY_TARGET}"

# Проверка, что проект существует
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Использование навыка git-deploy
echo "📤 Running git-deploy..."
deploy_git "$PROJECT_DIR" "$DEPLOY_TARGET" "$REMOTE_URL" "$BRANCH"

echo "✅ Deploy completed!"
