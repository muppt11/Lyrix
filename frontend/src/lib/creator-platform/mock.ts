import type {
  AudienceInsight,
  CreatorPlatformId,
  DateRange,
  EngagementSummary,
  PlatformAccount,
  RevenueSummary,
} from '@/types/creator-platform';
import type { ContentItem } from '@/types/creator-platform';
import { getPlatformMeta } from './platforms';

const PLATFORM_METRICS: Record<CreatorPlatformId, { followers: number; views: number; revenueCents: number }> = {
  instagram: { followers: 28400, views: 192000, revenueCents: 186000 },
  youtube: { followers: 12800, views: 318000, revenueCents: 412000 },
  tiktok: { followers: 41600, views: 526000, revenueCents: 97000 },
  facebook: { followers: 9600, views: 84000, revenueCents: 53000 },
  x: { followers: 7200, views: 56000, revenueCents: 0 },
  pinterest: { followers: 5400, views: 76000, revenueCents: 0 },
  onlyfans: { followers: 1800, views: 12000, revenueCents: 265000 },
  patreon: { followers: 950, views: 4200, revenueCents: 328000 },
};

const RANGE_FACTOR: Record<DateRange, number> = { '7d': 0.24, '30d': 1, '90d': 2.8, ytd: 7.2 };

function getSeriesDates(): string[] {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (5 - index) * 5);
    return date.toISOString().slice(0, 10);
  });
}

export function getMockAccount(platform: CreatorPlatformId): PlatformAccount {
  const meta = getPlatformMeta(platform);
  const metrics = PLATFORM_METRICS[platform];
  return {
    platform,
    connected: true,
    handle: `@lyrix_${platform}`,
    displayName: `${meta.label} Creator`,
    followers: metrics.followers,
    followerChange: Math.round(metrics.followers * 0.023),
  };
}

export function getMockEngagement(platform: CreatorPlatformId, range: DateRange): EngagementSummary {
  const metrics = PLATFORM_METRICS[platform];
  const views = Math.round(metrics.views * RANGE_FACTOR[range]);
  const likes = Math.round(views * 0.084);
  const comments = Math.round(views * 0.009);
  const shares = Math.round(views * 0.013);

  return {
    platform,
    views,
    likes,
    comments,
    shares,
    engagementRate: (likes + comments + shares) / Math.max(views, 1),
    series: getSeriesDates().map((date, index) => ({
      date,
      views: Math.round((views * (index + 1)) / 21),
      engagements: Math.round(((likes + comments + shares) * (index + 1)) / 21),
    })),
  };
}

export function getMockRevenue(platform: CreatorPlatformId, range: DateRange): RevenueSummary {
  const totalCents = Math.round(PLATFORM_METRICS[platform].revenueCents * RANGE_FACTOR[range]);
  const bySource = totalCents === 0
    ? []
    : [
        { label: 'Subscriptions', amountCents: Math.round(totalCents * 0.62) },
        { label: 'Partnerships', amountCents: Math.round(totalCents * 0.25) },
        { label: 'Other', amountCents: Math.round(totalCents * 0.13) },
      ];

  return {
    platform,
    totalCents,
    currency: 'USD',
    bySource,
    series: getSeriesDates().map((date, index) => ({
      date,
      amountCents: Math.round((totalCents * (index + 1)) / 21),
    })),
  };
}

export function getMockTopContent(platform: CreatorPlatformId, range: DateRange, limit = 5): ContentItem[] {
  const metrics = getMockEngagement(platform, range);
  const revenue = getMockRevenue(platform, range).totalCents;
  const types: ContentItem['type'][] = ['video', 'reel', 'post', 'video', 'story'];

  return Array.from({ length: Math.max(0, limit) }, (_, index) => ({
    id: `${platform}-demo-${index + 1}`,
    platform,
    type: types[index % types.length],
    title: `${getPlatformMeta(platform).label} post ${index + 1}`,
    publishedAt: new Date(Date.now() - index * 86400000).toISOString(),
    metrics: {
      views: Math.round((metrics.views * (5 - index)) / 15),
      likes: Math.round((metrics.likes * (5 - index)) / 15),
      comments: Math.round((metrics.comments * (5 - index)) / 15),
      shares: Math.round((metrics.shares * (5 - index)) / 15),
      revenueCents: revenue > 0 ? Math.round((revenue * (5 - index)) / 15) : undefined,
    },
  }));
}

export function getMockAudience(platform: CreatorPlatformId): AudienceInsight {
  return {
    platform,
    topCountries: [
      { country: 'United States', percent: 38 },
      { country: 'United Kingdom', percent: 17 },
      { country: 'Canada', percent: 12 },
      { country: 'Australia', percent: 9 },
    ],
    ageRanges: [
      { range: '18-24', percent: 28 },
      { range: '25-34', percent: 42 },
      { range: '35-44', percent: 20 },
      { range: '45+', percent: 10 },
    ],
    genderSplit: [
      { label: 'Women', percent: 54 },
      { label: 'Men', percent: 43 },
      { label: 'Other', percent: 3 },
    ],
  };
}