import { Hono } from "hono";
import { CloudflareBindings } from "../types/bindings";
import { FacebookService } from "../services/facebook";

const facebook = new Hono<{ Bindings: CloudflareBindings }>();

// Get cached Facebook followers
facebook.get("/followers", async (c) => {
  try {
    const facebookService = new FacebookService(
      c.env.FACEBOOK_ACCESS_TOKEN,
      c.env.FACEBOOK_PAGE_ID
    );

    const cachedData = await facebookService.getFollowersFromKV(
      c.env.SOCIAL_CACHE
    );

    if (!cachedData) {
      return c.json(
        {
          error:
            "No cached data available. Please wait for the next update cycle.",
        },
        404
      );
    }

    return c.json({
      platform: "facebook",
      followers: cachedData.followers,
      lastUpdated: cachedData.lastUpdated,
    });
  } catch (error) {
    console.error("Error getting Facebook followers:", error);
    return c.json({ error: "Failed to retrieve follower count" }, 500);
  }
});

// Manual refresh endpoint (optional)
facebook.post("/refresh", async (c) => {
  try {
    const facebookService = new FacebookService(
      c.env.FACEBOOK_ACCESS_TOKEN,
      c.env.FACEBOOK_PAGE_ID
    );

    const metrics = await facebookService.updateFollowersInKV(
      c.env.SOCIAL_CACHE
    );

    return c.json({
      platform: "facebook",
      followers: metrics.followers,
      lastUpdated: metrics.lastUpdated,
      message: "Follower count updated successfully",
    });
  } catch (error) {
    console.error("Error refreshing Facebook followers:", error);
    return c.json({ error: "Failed to refresh follower count" }, 500);
  }
});

export default facebook;
