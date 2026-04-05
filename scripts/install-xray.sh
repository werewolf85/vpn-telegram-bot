#!/bin/bash
# install-xray.sh — Установка Xray на VPS (Debian/Ubuntu)
# Использование: sudo bash scripts/install-xray.sh

set -e

echo "🔧 Installing Xray-core..."

# Определяем архитектуру
ARCH=$(uname -m)
case $ARCH in
  x86_64) XRAY_ARCH="amd64" ;;
  aarch64) XRAY_ARCH="arm64" ;;
  armv7l) XRAY_ARCH="arm" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Версия Xray (можно менять)
XRAY_VERSION="1.8.10"
XRAY_URL="https://github.com/XTLS/Xray-core/releases/download/v${XRAY_VERSION}/xray-linux-${XRAY_ARCH}.zip"

# Скачивание
echo "📥 Downloading Xray ${XRAY_VERSION} (${XRAY_ARCH})..."
wget -q --show-progress -O /tmp/xray.zip "$XRAY_URL" || {
  echo "❌ Failed to download Xray"
  exit 1
}

# Распаковка
unzip -q /tmp/xray.zip -d /tmp/xray
sudo mv /tmp/xray/xray /usr/local/bin/xray
sudo chmod +x /usr/local/bin/xray
rm -rf /tmp/xray /tmp/xray.zip

# Создаём директории
sudo mkdir -p /etc/xray
sudo mkdir -p /var/log/xray

# Создаём базовый конфиг (будет перезаписан нашим менеджером)
sudo tee /etc/xray/config.json > /dev/null <<'EOF'
{
  "log": {
    "access": "/var/log/xray/access.log",
    "error": "/var/log/xray/error.log",
    "loglevel": "warning"
  },
  "inbounds": [],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
EOF

# Создаём systemd service
sudo tee /etc/systemd/system/xray.service > /dev/null <<'EOF'
[Unit]
Description=Xray Proxy
After=network.target

[Service]
Type=simple
User=nobody
ExecStart=/usr/local/bin/xray run -config /etc/xray/config.json
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Запуск
sudo systemctl daemon-reload
sudo systemctl enable xray
sudo systemctl start xray

echo "✅ Xray installed and started"
echo "   Config: /etc/xray/config.json"
echo "   Status: sudo systemctl status xray"
