import { ApiProvider } from './api-provider';
import { MockProvider } from './mock-provider';
import type { DataMode, DataProvider } from './provider';

let cachedProvider: DataProvider | undefined;

export function getDataMode(): DataMode {
  const configuredMode = process.env.NEXT_PUBLIC_LYRA_DATA_MODE ?? 'api';
  if (configuredMode !== 'mock' && configuredMode !== 'api') {
    throw new Error('NEXT_PUBLIC_LYRA_DATA_MODE must be "mock" or "api".');
  }
  return configuredMode;
}

export function getDataProvider(): DataProvider {
  if (!cachedProvider) {
    cachedProvider = getDataMode() === 'mock' ? new MockProvider() : new ApiProvider();
  }
  return cachedProvider;
}