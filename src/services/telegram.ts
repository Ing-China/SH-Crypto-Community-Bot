import { CloudflareBindings } from "../types/bindings";

export interface TelegramGroupData {
  id: string;
  name: string;
  title: string;
  memberCount: number;
  subscriberCount?: number; // For channels
  type: 'group' | 'supergroup' | 'channel';
  lastUpdated: string;
}

export interface TelegramAnalytics {
  date: string;
  shNews: number;        // Daily member joins for SH News group
  shCommunity: number;   // Daily member joins for SH Community group
  shCryptoLesson: number; // Daily member joins for SH Crypto Lesson group
}

export interface ActiveMember {
  id: number;
  telegramId: number;
  name: string;
  username?: string;
  messages: number;
  groupName: string;
  lastMessageDate?: string;
}

export interface GroupMemberCount {
  groupName: string;
  memberCount: number;
  lastUpdated: string;
}

export class TelegramService {
  constructor(
    private botToken: string,
    private groupIds: {
      shNews: string;
      shCommunity: string;
      shCryptoLesson: string;
    }
  ) {}

  async getGroupInfo(groupId: string): Promise<TelegramGroupData | null> {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getChat?chat_id=${groupId}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }
      
      const chat = data.result;
      const chatType = chat.type;
      
      // Get member/subscriber count based on chat type
      let memberCount = 0;
      let subscriberCount = 0;
      
      if (chatType === 'channel') {
        // For channels, try to get subscriber count
        const memberResponse = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getChatMemberCount?chat_id=${groupId}`
        );
        
        const memberData = await memberResponse.json();
        if (memberData.ok) {
          subscriberCount = memberData.result;
        }
      } else {
        // For groups and supergroups, get member count
        const memberResponse = await fetch(
          `https://api.telegram.org/bot${this.botToken}/getChatMemberCount?chat_id=${groupId}`
        );
        
        const memberData = await memberResponse.json();
        if (memberData.ok) {
          memberCount = memberData.result;
        }
      }
      
      return {
        id: groupId,
        name: this.getGroupNameById(groupId),
        title: chat.title,
        memberCount,
        subscriberCount: chatType === 'channel' ? subscriberCount : undefined,
        type: chatType as 'group' | 'supergroup' | 'channel',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error getting group info for ${groupId}:`, error);
      return null;
    }
  }

  private getGroupNameById(groupId: string): string {
    if (groupId === this.groupIds.shNews) return "shNews";
    if (groupId === this.groupIds.shCommunity) return "shCommunityChat";
    if (groupId === this.groupIds.shCryptoLesson) return "shCryptoLesson";
    return "unknown";
  }

  // Get 30-day member joins chart data from D1
  async getChartData(db: D1Database, days: number = 30): Promise<TelegramAnalytics[]> {
    try {
      const query = `
        SELECT date, sh_news as shNews, sh_community as shCommunity, sh_crypto_lesson as shCryptoLesson
        FROM daily_member_joins 
        WHERE date >= date('now', '-${days} days')
        ORDER BY date ASC
      `;
      
      const result = await db.prepare(query).all();
      return result.results as TelegramAnalytics[];
    } catch (error) {
      console.error("Error getting chart data from D1:", error);
      return [];
    }
  }

  // Get top 20 active members from D1
  async getActiveMembers(db: D1Database, limit: number = 20): Promise<ActiveMember[]> {
    try {
      const query = `
        SELECT 
          telegram_id as telegramId,
          name,
          username,
          messages,
          group_name as groupName,
          last_message_date as lastMessageDate
        FROM active_members 
        ORDER BY messages DESC 
        LIMIT ?
      `;
      
      const result = await db.prepare(query).bind(limit).all();
      return result.results as ActiveMember[];
    } catch (error) {
      console.error("Error getting active members from D1:", error);
      return [];
    }
  }

  // Get active members for a specific group
  async getActiveMembersForGroup(db: D1Database, groupName: string, limit: number = 20): Promise<ActiveMember[]> {
    try {
      const query = `
        SELECT 
          telegram_id as telegramId,
          name,
          username,
          messages,
          group_name as groupName,
          last_message_date as lastMessageDate
        FROM active_members 
        WHERE group_name = ?
        ORDER BY messages DESC 
        LIMIT ?
      `;
      
      const result = await db.prepare(query).bind(groupName, limit).all();
      return result.results as ActiveMember[];
    } catch (error) {
      console.error("Error getting active members for group from D1:", error);
      return [];
    }
  }

  // Get group member counts from D1
  async getGroupMemberCounts(db: D1Database): Promise<GroupMemberCount[]> {
    try {
      const query = `
        SELECT 
          group_name as groupName,
          member_count as memberCount,
          last_updated as lastUpdated
        FROM group_info 
        ORDER BY group_name
      `;
      
      const result = await db.prepare(query).all();
      return result.results as GroupMemberCount[];
    } catch (error) {
      console.error("Error getting group member counts from D1:", error);
      return [];
    }
  }

  // Update group information in D1
  async updateGroupInfo(db: D1Database): Promise<void> {
    try {
      const groups = await Promise.all([
        this.getGroupInfo(this.groupIds.shNews),
        this.getGroupInfo(this.groupIds.shCommunity),
        this.getGroupInfo(this.groupIds.shCryptoLesson)
      ]);

      for (const group of groups) {
        if (group) {
          await db.prepare(`
            INSERT OR REPLACE INTO group_info (group_id, group_name, title, member_count, subscriber_count, type, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).bind(
            group.id,
            group.name,
            group.title,
            group.memberCount,
            group.subscriberCount || null,
            group.type,
            group.lastUpdated
          ).run();
        }
      }
    } catch (error) {
      console.error("Error updating group info in D1:", error);
    }
  }

  // Calculate and store daily member joins
  async updateDailyMemberJoins(db: D1Database): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get current member counts
      const groups = await Promise.all([
        this.getGroupInfo(this.groupIds.shNews),
        this.getGroupInfo(this.groupIds.shCommunity),
        this.getGroupInfo(this.groupIds.shCryptoLesson)
      ]);

      // Get yesterday's member counts
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayQuery = `
        SELECT member_count, group_name 
        FROM group_info 
        WHERE DATE(last_updated) = ?
      `;
      
      const yesterdayResult = await db.prepare(yesterdayQuery).bind(yesterdayStr).all();
      const yesterdayCounts = yesterdayResult.results as { member_count: number; group_name: string }[];

      // Calculate new joins/subscribers
      const getNewJoins = (groupName: string, group: TelegramGroupData | null): number => {
        if (!group) return 0;
        
        const currentCount = group.type === 'channel' ? (group.subscriberCount || 0) : group.memberCount;
        const yesterday = yesterdayCounts.find(y => y.group_name === groupName);
        return yesterday ? Math.max(0, currentCount - yesterday.member_count) : 0;
      };

      const shNewsJoins = getNewJoins("shNews", groups[0]);
      const shCommunityJoins = getNewJoins("shCommunity", groups[1]);
      const shCryptoLessonJoins = getNewJoins("shCryptoLesson", groups[2]);

      // Store daily joins
      await db.prepare(`
        INSERT OR REPLACE INTO daily_member_joins (date, sh_news, sh_community, sh_crypto_lesson)
        VALUES (?, ?, ?, ?)
      `).bind(
        today,
        shNewsJoins,
        shCommunityJoins,
        shCryptoLessonJoins
      ).run();

    } catch (error) {
      console.error("Error updating daily member joins:", error);
    }
  }

  // This would be called by webhook to track messages and update active members
  async trackMessage(db: D1Database, telegramId: number, groupId: string, userName: string, username?: string, messageId?: number): Promise<void> {
    try {
      const groupName = this.getGroupNameById(groupId);
      const now = new Date().toISOString();

      // Log the message
      await db.prepare(`
        INSERT INTO message_logs (telegram_id, group_id, message_id, user_name, username, message_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(telegramId, groupId, messageId || 0, userName, username, now).run();

      // Update or insert active member
      await db.prepare(`
        INSERT INTO active_members (telegram_id, name, username, messages, group_name, last_message_date, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(telegram_id, group_name) DO UPDATE SET
          name = excluded.name,
          username = excluded.username,
          messages = messages + 1,
          last_message_date = excluded.last_message_date,
          updated_at = excluded.updated_at
      `).bind(telegramId, userName, username, groupName, now, now).run();

    } catch (error) {
      console.error("Error tracking message:", error);
    }
  }

  // Main update function called by cron
  async updateAllData(db: D1Database): Promise<void> {
    try {
      await this.updateGroupInfo(db);
      await this.updateDailyMemberJoins(db);
      console.log("All Telegram data updated successfully");
    } catch (error) {
      console.error("Error updating all Telegram data:", error);
    }
  }
}