import type {
  AudienceInsight,
  ContentItem,
  CreatorPlatformId,
  DateRange,
  EngagementSummary,
  PlatformAccount,
  RevenueSummary,
} from '@/types/creator-platform';
import type { DiscoverResult, Niche, SourceStatus } from '@/types/discover';

export type DataMode = 'mock' | 'api';

export interface SourceStatusEntry {
  name: string;
  status: SourceStatus;
  detail?: string | null;
}

export interface DataProvider {
  readonly mode: DataMode;
  discoverContent(query: string, niche: Niche): Promise<DiscoverResult>;
  getSources(): Promise<SourceStatusEntry[]>;
  getAccount(platform: CreatorPlatformId): Promise<PlatformAccount>;
  getEngagement(platform: CreatorPlatformId, range: DateRange): Promise<EngagementSummary>;
  getRevenue(platform: CreatorPlatformId, range: DateRange): Promise<RevenueSummary>;
  getTopContent(platform: CreatorPlatformId, range: DateRange, limit?: number): Promise<ContentItem[]>;
  getAudience(platform: CreatorPlatformId): Promise<AudienceInsight>;
}

export class ApiCapabilityUnavailableError extends Error {
  constructor(capability: string) {
    super(`The API does not provide ${capability} yet.`);
    this.name = 'ApiCapabilityUnavailableError';
  }
}