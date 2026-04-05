#!/usr/bin/env node
/**
 * Генерация REALITY ключей для Xray
 * Запуск: node scripts/generate-reality-keys.js [keyName]
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

async function generateKeys(keyName) {
  if (!keyName) {
    console.error('Usage: generate-reality-keys.js <keyName>');
    process.exit(1);
  }
  
  // В реальности используем xray crypto, но для теста генерируем случайные буферы
  const privateKey = crypto.randomBytes(32).toString('hex');
  
  // Здесь должен быть алгоритм генерации публичного ключа из приватного
  // В Xray: xray crypto с методом "reality"
  // Пока сохраняем заглушку
  const publicKey = privateKey; // TODO: заменить на реальную криптографию
  
  const keys = {
    keyName,
    privateKey,
    publicKey,
    shortId: Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString()
  };
  
  const keysDir = path.join(process.cwd(), 'config', 'reality-keys');
  await fs.mkdir(keysDir, { recursive: true });
  
  const filePath = path.join(keysDir, `${keyName}.json`);
  await fs.writeFile(filePath, JSON.stringify(keys, null, 2));
  
  console.log(`✅ REALITY keys generated: ${keyName}`);
  console.log(`   Private key: ${privateKey.substring(0, 16)}... (${filePath})`);
  console.log(`   Short ID: ${keys.shortId}`);
  console.log(`   ⚠️  Public key is placeholder. Replace with real Xray-generated key.`);
}

generateKeys(process.argv[2]).catch(console.error);
