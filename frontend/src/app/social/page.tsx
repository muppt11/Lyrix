'use client';

import { Panel } from '@/components/Panel';
import { StatTile } from '@/components/StatTile';
import { PLATFORM_LIST } from '@/lib/creator-platform/platforms';
import { PLATFORM_ICONS } from '@/components/platform-icons';
import { getMockEngagement, getMockAccount } from '@/lib/creator-platform/mock';
import { formatCompactNumber, formatPercent } from '@/lib/utils';
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

const SOCIAL_PLATFORMS = PLATFORM_LIST.filter((p) =>
  ['instagram', 'facebook', 'youtube', 'tiktok', 'x'].includes(p.id)
);

export default function SocialPage() {
  const stats = SOCIAL_PLATFORMS.map((p) => ({
    platform: p,
    engagement: getMockEngagement(p.id, '30d'),
    account: getMockAccount(p.id),
  }));

  const totalViews = stats.reduce((sum, s) => sum + s.engagement.views, 0);
  const totalLikes = stats.reduce((sum, s) => sum + s.engagement.likes, 0);
  const totalComments = stats.reduce((sum, s) => sum + s.engagement.comments, 0);
  const totalShares = stats.reduce((sum, s) => sum + s.engagement.shares, 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow">Social Grid Monitor</h1>
        <p className="text-gray-400 mt-1">
          Cross-platform engagement across Instagram, Facebook, YouTube, TikTok, and X (demo data).
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Views (30d)" value={formatCompactNumber(totalViews)} icon={Eye} />
        <StatTile label="Likes (30d)" value={formatCompactNumber(totalLikes)} icon={Heart} />
        <StatTile label="Comments (30d)" value={formatCompactNumber(totalComments)} icon={MessageCircle} />
        <StatTile label="Shares (30d)" value={formatCompactNumber(totalShares)} icon={Share2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stats.map(({ platform, engagement, account }) => {
          const Icon = PLATFORM_ICONS[platform.id];
          return (
            <Panel key={platform.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Icon size={20} style={{ color: platform.color }} />
                <span className="font-medium text-white">{platform.label}</span>
                <span className="text-xs text-gray-500 ml-auto">{account.handle}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Views</p>
                  <p className="text-white">{formatCompactNumber(engagement.views)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Engagement rate</p>
                  <p className="text-neon-cyan">{formatPercent(engagement.engagementRate)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Likes</p>
                  <p className="text-white">{formatCompactNumber(engagement.likes)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Comments</p>
                  <p className="text-white">{formatCompactNumber(engagement.comments)}</p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
