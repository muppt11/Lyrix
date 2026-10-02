import type { CreatorPlatformId, PlatformMeta } from '@/types/creator-platform';

export const PLATFORM_LIST: PlatformMeta[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Audience and content performance for Instagram.',
    icon: 'Instagram',
    color: '#c13584',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: 'Video views, engagement, and channel performance.',
    icon: 'Youtube',
    color: '#ff0033',
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'Short-form video and audience performance.',
    icon: 'Music2',
    color: '#111111',
    docsUrl: 'https://developers.tiktok.com/',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Page reach, audience, and engagement.',
    icon: 'Facebook',
    color: '#1877f2',
    docsUrl: 'https://developers.facebook.com/docs/graph-api/',
  },
  {
    id: 'x',
    label: 'X',
    description: 'Post engagement and audience activity.',
    icon: 'Twitter',
    color: '#1d9bf0',
    docsUrl: 'https://developer.x.com/en/docs',
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    description: 'CSV-imported pin performance. No live connector is configured.',
    icon: 'Image',
    color: '#bd081c',
    docsUrl: 'https://developers.pinterest.com/',
  },
  {
    id: 'onlyfans',
    label: 'OnlyFans',
    description: 'Demo analytics. No public developer API is available.',
    icon: 'Heart',
    color: '#00aff0',
    docsUrl: 'https://onlyfans.com/',
  },
  {
    id: 'patreon',
    label: 'Patreon',
    description: 'Membership and creator revenue analytics.',
    icon: 'Gift',
    color: '#ff424d',
    docsUrl: 'https://docs.patreon.com/',
  },
];

export function getPlatformMeta(platform: CreatorPlatformId): PlatformMeta {
  return PLATFORM_LIST.find((entry) => entry.id === platform)!;
}