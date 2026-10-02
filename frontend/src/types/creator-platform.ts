/**
 * Creator Platform — shared types
 *
 * These types describe a normalized, platform-agnostic shape for creator
 * analytics so the UI can render any connected platform the same way.
 * Real integrations are implemented as "providers" (see src/lib/creator-platform)
 * that fetch from each platform's official API and map into this shape.
 *
 * IMPORTANT: Out of the box, every provider is backed by MOCK data
 * (see src/lib/creator-platform/mock.ts). No platform credentials are
 * required to explore the dashboard. Wire up a real provider by
 * implementing `CreatorPlatformProvider` and supplying real API credentials
 * for that platform.
 */

export type CreatorPlatformId =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'facebook'
  | 'x'
  | 'onlyfans'
  | 'patreon';

export interface PlatformMeta {
  id: CreatorPlatformId;
  label: string;
  /** Short description of what this platform integration covers. */
  description: string;
  /** Lucide icon name used by the UI. */
  icon: string;
  /** Brand accent color (hex) used for charts/badges. */
  color: string;
  /** Link to the platform's official developer docs. */
  docsUrl: string;
}

export interface PlatformAccount {
  platform: CreatorPlatformId;
  /** Whether this platform has a real connection configured. */
  connected: boolean;
  /** Display name / handle, e.g. "@creator" */
  handle: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  /** Follower delta over the selected period. */
  followerChange: number;
}

export interface RevenueSummary {
  platform: CreatorPlatformId;
  /** Total revenue in minor currency units (cents) for the period. */
  totalCents: number;
  currency: string;
  /** Revenue broken out by source (subscriptions, tips, ads, sponsorships, etc). */
  bySource: { label: string; amountCents: number }[];
  /** Daily revenue series for charting. */
  series: { date: string; amountCents: number }[];
}

export interface EngagementSummary {
  platform: CreatorPlatformId;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  /** Engagement rate as a fraction, e.g. 0.042 = 4.2% */
  engagementRate: number;
  series: { date: string; views: number; engagements: number }[];
}

export interface ContentItem {
  id: string;
  platform: CreatorPlatformId;
  type: 'photo' | 'video' | 'short' | 'reel' | 'post' | 'story' | 'audio' | 'text';
  title: string;
  publishedAt: string;
  thumbnailUrl?: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    revenueCents?: number;
  };
}

export interface AudienceInsight {
  platform: CreatorPlatformId;
  topCountries: { country: string; percent: number }[];
  ageRanges: { range: string; percent: number }[];
  genderSplit: { label: string; percent: number }[];
}

export type DateRange = '7d' | '30d' | '90d' | 'ytd';

/**
 * Implement this interface per-platform to connect a real data source.
 * Each method should return data already normalized to the shapes above.
 */
export interface CreatorPlatformProvider {
  platform: CreatorPlatformId;
  isConfigured(): boolean;
  getAccount(): Promise<PlatformAccount>;
  getRevenue(range: DateRange): Promise<RevenueSummary>;
  getEngagement(range: DateRange): Promise<EngagementSummary>;
  getTopContent(range: DateRange, limit?: number): Promise<ContentItem[]>;
  getAudience(): Promise<AudienceInsight>;
}
