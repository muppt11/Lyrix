import { getDataProvider } from '@/lib/data';
import type { DiscoverResult, Niche } from '@/types/discover';

export async function discoverContent(query: string, niche: Niche): Promise<DiscoverResult> {
  return getDataProvider().discoverContent(query, niche);
}