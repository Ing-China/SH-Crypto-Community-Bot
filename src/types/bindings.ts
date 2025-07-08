export interface CloudflareBindings {
  SOCIAL_CACHE: KVNamespace;
  FACEBOOK_ACCESS_TOKEN: string;
  FACEBOOK_PAGE_ID: string;
}

export interface SocialMetrics {
  followers: number;
  lastUpdated: string;
}
