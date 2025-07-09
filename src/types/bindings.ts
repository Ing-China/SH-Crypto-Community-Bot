export interface CloudflareBindings {
  SOCIAL_CACHE: KVNamespace;
  TELEGRAM_DB: D1Database;
  FACEBOOK_ACCESS_TOKEN: string;
  FACEBOOK_PAGE_ID: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_SH_NEWS_GROUP_ID: string;
  TELEGRAM_SH_COMMUNITY_GROUP_ID: string;
  TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID: string;
}

export interface SocialMetrics {
  followers: number;
  lastUpdated: string;
}
