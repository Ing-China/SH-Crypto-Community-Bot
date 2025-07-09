#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
const wranglerFile = path.join(__dirname, 'wrangler.jsonc');

if (!fs.existsSync(envFile)) {
  console.error('❌ .env file not found! Please create it first.');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envFile, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value && !key.startsWith('#')) {
    envVars[key.trim()] = value.trim();
  }
});

// Read wrangler.jsonc
let wranglerContent = fs.readFileSync(wranglerFile, 'utf8');

// Replace placeholders
const replacements = {
  'YOUR_FACEBOOK_ACCESS_TOKEN': envVars.FACEBOOK_ACCESS_TOKEN,
  'YOUR_FACEBOOK_PAGE_ID': envVars.FACEBOOK_PAGE_ID,
  'YOUR_TELEGRAM_BOT_TOKEN': envVars.TELEGRAM_BOT_TOKEN,
  'YOUR_SH_NEWS_GROUP_ID': envVars.TELEGRAM_SH_NEWS_GROUP_ID,
  'YOUR_SH_COMMUNITY_GROUP_ID': envVars.TELEGRAM_SH_COMMUNITY_GROUP_ID,
  'YOUR_SH_CRYPTO_LESSON_GROUP_ID': envVars.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
  'YOUR_KV_NAMESPACE_ID': envVars.KV_NAMESPACE_ID,
  'YOUR_D1_DATABASE_ID': envVars.D1_DATABASE_ID
};

Object.entries(replacements).forEach(([placeholder, value]) => {
  if (value) {
    wranglerContent = wranglerContent.replace(new RegExp(placeholder, 'g'), value);
  }
});

// Write back to wrangler.jsonc
fs.writeFileSync(wranglerFile, wranglerContent);

console.log('✅ wrangler.jsonc has been updated with values from .env');
console.log('🚀 You can now run: npm run deploy');