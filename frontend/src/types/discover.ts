/**
 * Niche-discovery types — mirrors the Pydantic contracts in
 * `api/app/schemas/content.py` field-for-field so API responses deserialize
 * without translation.
 */

import type { CreatorPlatformId } from './creator-platform';

export type Niche = 'dance' | 'fashion';

/** Where a given value came from, shown as a badge next to the data it backs. */
export type SourceStatus = 'live' | 'degraded' | 'csv' | 'mock';

export interface ContentMetrics {
  views: number;
  likes: number;
  comments: number;
  /** YouTube's public API doesn't expose share counts — left unset, never guessed. */
  shares?: number | null;
  revenueCents?: number | null;
  /** Views/day since publish — the actual ranking key for live discovery. */
  viewVelocity?: number | null;
}

export interface DiscoveredContentItem {
  id: string;
  platform: CreatorPlatformId;
  type: 'photo' | 'video' | 'short' | 'reel' | 'post' | 'story' | 'audio' | 'text';
  title: string;
  publishedAt: string;
  thumbnailUrl?: string | null;
  channelTitle?: string | null;
  url?: string | null;
  metrics: ContentMetrics;
}

export interface TrendPoint {
  date: string;
  /** Google Trends relative interest, 0-100. */
  interest: number;
}

export interface DiscoverResult {
  query: string;
  niche?: Niche | null;
  platform: CreatorPlatformId;
  source: SourceStatus;
  fetchedAt: string;
  items: DiscoveredContentItem[];
  trendSignal?: TrendPoint[] | null;
  trendSource?: SourceStatus | null;
  /** Always present: discloses how results are ranked and that this is a
   * baseline, not the (not-yet-built) digital-twin model's recommendation. */
  baselineNote: string;
}
