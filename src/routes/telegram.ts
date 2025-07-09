import { Hono } from "hono";
import { CloudflareBindings } from "../types/bindings";
import { TelegramService } from "../services/telegram";

const telegram = new Hono<{ Bindings: CloudflareBindings }>();

// GET /api/telegram/chart-data - 30-day member joins chart data
telegram.get("/chart-data", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const { days = "30" } = c.req.query();
    const chartData = await telegramService.getChartData(c.env.TELEGRAM_DB, parseInt(days));
    
    if (chartData.length === 0) {
      return c.json(
        {
          error: "No chart data available. Please wait for data collection to begin.",
        },
        404
      );
    }
    
    return c.json({
      data: chartData,
      total: chartData.length,
      summary: {
        totalShNews: chartData.reduce((sum, item) => sum + item.shNews, 0),
        totalShCommunity: chartData.reduce((sum, item) => sum + item.shCommunity, 0),
        totalShCryptoLesson: chartData.reduce((sum, item) => sum + item.shCryptoLesson, 0),
      }
    });
  } catch (error) {
    console.error("Error getting chart data:", error);
    return c.json({ error: "Failed to retrieve chart data" }, 500);
  }
});

// GET /api/telegram/active-members - Top 20 active members
telegram.get("/active-members", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const { limit = "20" } = c.req.query();
    const activeMembers = await telegramService.getActiveMembersForGroup(c.env.TELEGRAM_DB, "shCommunityChat", parseInt(limit));
    
    if (activeMembers.length === 0) {
      return c.json(
        {
          error: "No active members data available. Please wait for data collection to begin.",
        },
        404
      );
    }
    
    return c.json({
      data: activeMembers,
      total: activeMembers.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting active members:", error);
    return c.json({ error: "Failed to retrieve active members data" }, 500);
  }
});

// GET /api/telegram/group-counts - Group member counts for website display
telegram.get("/group-counts", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const groupCounts = await telegramService.getGroupMemberCounts(c.env.TELEGRAM_DB);
    
    if (groupCounts.length === 0) {
      return c.json(
        {
          error: "No group counts data available. Please wait for data collection to begin.",
        },
        404
      );
    }
    
    return c.json({
      data: groupCounts,
      total: groupCounts.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error getting group counts:", error);
    return c.json({ error: "Failed to retrieve group counts data" }, 500);
  }
});

// GET /api/telegram/analytics - Legacy endpoint for backward compatibility
telegram.get("/analytics", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const { startDate, endDate } = c.req.query();
    let analyticsData = await telegramService.getChartData(c.env.TELEGRAM_DB, 30);
    
    if (startDate && endDate) {
      analyticsData = analyticsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }
    
    if (analyticsData.length === 0) {
      return c.json(
        {
          error: "No analytics data available. Please wait for data collection to begin.",
        },
        404
      );
    }
    
    return c.json({
      data: analyticsData,
      total: analyticsData.length,
      summary: {
        totalShNews: analyticsData.reduce((sum, item) => sum + item.shNews, 0),
        totalShCommunity: analyticsData.reduce((sum, item) => sum + item.shCommunity, 0),
        totalShCryptoLesson: analyticsData.reduce((sum, item) => sum + item.shCryptoLesson, 0),
      }
    });
  } catch (error) {
    console.error("Error getting telegram analytics:", error);
    return c.json({ error: "Failed to retrieve analytics data" }, 500);
  }
});

// GET /api/telegram/group/:groupName - Specific group analytics
telegram.get("/group/:groupName", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const groupName = c.req.param("groupName");
    
    if (!["shNews", "shCommunityChat", "shCryptoLesson"].includes(groupName)) {
      return c.json({ error: "Invalid group name" }, 400);
    }
    
    const analyticsData = await telegramService.getChartData(c.env.TELEGRAM_DB, 30);
    const groupCounts = await telegramService.getGroupMemberCounts(c.env.TELEGRAM_DB);
    
    if (analyticsData.length === 0) {
      return c.json(
        {
          error: "No analytics data available. Please wait for data collection to begin.",
        },
        404
      );
    }
    
    const groupAnalytics = analyticsData.map(item => ({
      date: item.date,
      joins: item[groupName as keyof typeof item] as number
    }));
    
    const groupInfo = groupCounts.find(g => g.groupName === groupName);
    
    return c.json({
      group: groupName,
      analytics: groupAnalytics,
      memberCount: groupInfo?.memberCount || 0,
      lastUpdated: groupInfo?.lastUpdated || new Date().toISOString(),
      summary: {
        totalJoins: groupAnalytics.reduce((sum, item) => sum + item.joins, 0),
        averageDaily: Math.round(groupAnalytics.reduce((sum, item) => sum + item.joins, 0) / groupAnalytics.length),
      }
    });
  } catch (error) {
    console.error("Error getting group analytics:", error);
    return c.json({ error: "Failed to retrieve group analytics" }, 500);
  }
});

// POST /api/telegram/cleanup - Clean up old group names
telegram.post("/cleanup", async (c) => {
  try {
    // Update old group names to new names
    await c.env.TELEGRAM_DB.prepare(`
      UPDATE active_members SET group_name = 'shCommunityChat' WHERE group_name = 'shCommunity'
    `).run();
    
    await c.env.TELEGRAM_DB.prepare(`
      UPDATE group_info SET group_name = 'shCommunityChat' WHERE group_name = 'shCommunity'
    `).run();
    
    return c.json({
      message: "Database cleaned up successfully",
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error cleaning up database:", error);
    return c.json({ error: "Failed to clean up database" }, 500);
  }
});

// POST /api/telegram/refresh - Manual refresh endpoint
telegram.post("/refresh", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    await telegramService.updateAllData(c.env.TELEGRAM_DB);
    
    return c.json({
      message: "Telegram data updated successfully",
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error refreshing telegram data:", error);
    return c.json({ error: "Failed to refresh telegram data" }, 500);
  }
});

// POST /api/telegram/webhook - Webhook endpoint for message tracking
telegram.post("/webhook", async (c) => {
  try {
    const telegramService = new TelegramService(
      c.env.TELEGRAM_BOT_TOKEN,
      {
        shNews: c.env.TELEGRAM_SH_NEWS_GROUP_ID,
        shCommunity: c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID,
        shCryptoLesson: c.env.TELEGRAM_SH_CRYPTO_LESSON_GROUP_ID,
      }
    );

    const update = await c.req.json();
    
    if (update.message) {
      const message = update.message;
      const user = message.from;
      const chat = message.chat;
      
      // Only process messages from shCommunityChat group
      if (chat.id.toString() === c.env.TELEGRAM_SH_COMMUNITY_GROUP_ID) {
        await telegramService.trackMessage(
          c.env.TELEGRAM_DB,
          user.id,
          chat.id.toString(),
          user.first_name + (user.last_name ? ` ${user.last_name}` : ''),
          user.username,
          message.message_id
        );
      }
    }
    
    return c.json({ ok: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return c.json({ error: "Failed to process webhook" }, 500);
  }
});

export default telegram;