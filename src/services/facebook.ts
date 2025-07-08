import { SocialMetrics } from "../types/bindings";

export class FacebookService {
  private accessToken: string;
  private pageId: string;

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async getFollowerCount(): Promise<number> {
    const url = `https://graph.facebook.com/v18.0/${this.pageId}?fields=followers_count&access_token=${this.accessToken}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Facebook API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      return data.followers_count || 0;
    } catch (error) {
      console.error("Error fetching Facebook followers:", error);
      throw error;
    }
  }

  async updateFollowersInKV(kv: KVNamespace): Promise<SocialMetrics> {
    const followerCount = await this.getFollowerCount();

    const metrics: SocialMetrics = {
      followers: followerCount,
      lastUpdated: new Date().toISOString(),
    };

    await kv.put("facebook_followers", JSON.stringify(metrics));

    return metrics;
  }

  async getFollowersFromKV(kv: KVNamespace): Promise<SocialMetrics | null> {
    const cached = await kv.get("facebook_followers");

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached) as SocialMetrics;
    } catch (error) {
      console.error("Error parsing cached Facebook data:", error);
      return null;
    }
  }
}
