# Setup Instructions

## 🚀 Quick Start

1. **Clone the repository** and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd sh-crypto-community-bot
   npm install
   ```

2. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

3. **Fill in your actual values** in `.env`:
   - Replace `YOUR_FACEBOOK_ACCESS_TOKEN` with your Facebook access token
   - Replace `YOUR_TELEGRAM_BOT_TOKEN` with your Telegram bot token
   - Replace group IDs with your actual Telegram group IDs
   - Replace resource IDs with your Cloudflare resource IDs

4. **Update wrangler.jsonc** with your actual values:
   ```bash
   # Copy values from .env.local to wrangler.jsonc
   ```

## 🔧 Configuration

### Facebook Configuration
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and get your access token
3. Get your Facebook page ID

### Telegram Configuration
1. Create a bot using [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Add the bot to your Telegram groups as admin
4. Get group IDs using: `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Cloudflare Configuration
1. Create KV namespace: `wrangler kv:namespace create "SOCIAL_CACHE"`
2. Create D1 database: `wrangler d1 create sh-crypto-telegram-db`
3. Apply database schema: `wrangler d1 execute sh-crypto-telegram-db --file=schema.sql --remote`

## 🛠️ Development

```bash
# Start development server
npm run dev

# Generate types
npm run cf-typegen

# Deploy to production
npm run deploy
```

## 📊 API Endpoints

- **Main Info**: `GET /`
- **Facebook Followers**: `GET /api/facebook/followers`
- **Telegram Group Counts**: `GET /api/telegram/group-counts`
- **Active Members**: `GET /api/telegram/active-members`
- **Chart Data**: `GET /api/telegram/chart-data`

## 🔐 Security

- Never commit `.env` files
- Use placeholder values in `wrangler.jsonc` for public repos
- Keep your bot tokens and API keys secure
- Regularly rotate your access tokens

## 📝 Notes

- The bot tracks messages only from the shCommunityChat group
- Cron job runs every 10 minutes to update group member counts
- Webhook processes messages in real-time for activity tracking