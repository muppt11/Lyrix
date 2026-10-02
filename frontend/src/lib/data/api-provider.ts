import type {
  CreatorPlatformId,
  DateRange,
} from '@/types/creator-platform';
import type { DiscoverResult, Niche } from '@/types/discover';
import type {
  AudienceInsight,
  ContentItem,
  EngagementSummary,
  PlatformAccount,
  RevenueSummary,
} from '@/types/creator-platform';
import type { DataProvider, SourceStatusEntry } from './provider';
import { ApiCapabilityUnavailableError } from './provider';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

export class ApiProvider implements DataProvider {
  readonly mode = 'api' as const;

  async discoverContent(query: string, niche: Niche): Promise<DiscoverResult> {
    const params = new URLSearchParams({ query, niche });
    return getJson<DiscoverResult>(`/discover?${params.toString()}`);
  }

  async getSources(): Promise<SourceStatusEntry[]> {
    const response = await getJson<{ sources: SourceStatusEntry[] }>('/sources');
    return response.sources;
  }

  getAccount(_platform: CreatorPlatformId): Promise<PlatformAccount> {
    return Promise.reject(new ApiCapabilityUnavailableError('platform account analytics'));
  }

  getEngagement(_platform: CreatorPlatformId, _range: DateRange): Promise<EngagementSummary> {
    return Promise.reject(new ApiCapabilityUnavailableError('platform engagement analytics'));
  }

  getRevenue(_platform: CreatorPlatformId, _range: DateRange): Promise<RevenueSummary> {
    return Promise.reject(new ApiCapabilityUnavailableError('platform revenue analytics'));
  }

  getTopContent(
    _platform: CreatorPlatformId,
    _range: DateRange,
    _limit = 5
  ): Promise<ContentItem[]> {
    return Promise.reject(new ApiCapabilityUnavailableError('platform top-content analytics'));
  }

  getAudience(_platform: CreatorPlatformId): Promise<AudienceInsight> {
    return Promise.reject(new ApiCapabilityUnavailableError('platform audience analytics'));
  }
}