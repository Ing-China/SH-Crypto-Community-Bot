import { Hono } from "hono";
import { CloudflareBindings } from "./types/bindings";
import { FacebookService } from "./services/facebook";
import { TelegramService } from "./services/telegram";
import facebook from "./routes/facebook";
import telegram from "./routes/telegram";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  return c.json({
    message: "SH Crypto Community Bot API",
    endpoints: {
      facebook: {
        followers: "/api/facebook/followers",
        refresh: "/api/facebook/refresh",
      },
      telegram: {
        chartData: "/api/telegram/chart-data",
        activeMembers: "/api/telegram/active-members",
        groupCounts: "/api/telegram/group-counts",
        analytics: "/api/telegram/analytics",
        groupAnalytics: "/api/telegram/group/{groupName}",
        refresh: "/api/telegram/refresh",
        webhook: "/api/telegram/webhook",
      },
    },
  });
});

// Mount Facebook routes
app.route("/api/facebook", facebook);

// Mount Telegram routes
app.route("/api/telegram", telegram);

export default {
  fetch: app.fetch,

  // Scheduled handler for cron triggers
  async scheduled(
    event: ScheduledEvent,
    env: CloudflareBindings,
    ctx: ExecutionContext
  ) {
    ctx.waitUntil(handleScheduled(env));
  },
};

async function handleScheduled(env: CloudflareBindings) {
  try {
    // Update Facebook data
    const facebookService = new FacebookService(
      env.FACEBOOK_ACCESS_TOKEN,
      env.FACEBOOK_PAGE_ID
    );

    await facebookService.updateFollowersInKV(env.SOCIAL_CACHE);
    console.log("Facebook followers updated successfully via cron");

    // Update Telegram data
    const telegramService = new TelegramService(
      env.TELEGRAM_BOT_TOKEN,
      {
        shNews: env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    await telegramService.updateAllData(env.TELEGRAM_DB);
    console.log("Telegram analytics updated successfully via cron");
  } catch (error) {
    console.error("Error updating social media data via cron:", error);
  }
}
