import type { CreatorPlatformId, DateRange } from '@/types/creator-platform';
import type { DiscoverResult, Niche } from '@/types/discover';
import {
  getMockAccount,
  getMockAudience,
  getMockEngagement,
  getMockRevenue,
  getMockTopContent,
} from '@/lib/creator-platform/mock';
import type { DataProvider, SourceStatusEntry } from './provider';

export class MockProvider implements DataProvider {
  readonly mode = 'mock' as const;

  async discoverContent(query: string, niche: Niche): Promise<DiscoverResult> {
    return {
      query,
      niche,
      platform: 'youtube',
      source: 'mock',
      fetchedAt: new Date().toISOString(),
      items: [],
      trendSignal: null,
      trendSource: 'mock',
      baselineNote: 'No sample discovery results are bundled. Switch to API mode to load live results.',
    };
  }

  async getSources(): Promise<SourceStatusEntry[]> {
    return [
      { name: 'youtube', status: 'mock', detail: 'Using sample data' },
      { name: 'google_trends', status: 'mock', detail: 'Using sample data' },
    ];
  }

  async getAccount(platform: CreatorPlatformId) {
    return getMockAccount(platform);
  }

  async getEngagement(platform: CreatorPlatformId, range: DateRange) {
    return getMockEngagement(platform, range);
  }

  async getRevenue(platform: CreatorPlatformId, range: DateRange) {
    return getMockRevenue(platform, range);
  }

  async getTopContent(platform: CreatorPlatformId, range: DateRange, limit = 5) {
    return getMockTopContent(platform, range, limit);
  }

  async getAudience(platform: CreatorPlatformId) {
    return getMockAudience(platform);
  }
}