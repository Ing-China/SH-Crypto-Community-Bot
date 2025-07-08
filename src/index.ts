import { Hono } from "hono";
import { CloudflareBindings } from "./types/bindings";
import { FacebookService } from "./services/facebook";
import facebook from "./routes/facebook";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => {
  return c.json({
    message: "SH Crypto Community Bot API",
    endpoints: {
      facebook: "/api/facebook/followers",
      refresh: "/api/facebook/refresh",
    },
  });
});

// Mount Facebook routes
app.route("/api/facebook", facebook);

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
    const facebookService = new FacebookService(
      env.FACEBOOK_ACCESS_TOKEN,
      env.FACEBOOK_PAGE_ID
    );

    await facebookService.updateFollowersInKV(env.SOCIAL_CACHE);
    console.log("Facebook followers updated successfully via cron");
  } catch (error) {
    console.error("Error updating Facebook followers via cron:", error);
  }
}
