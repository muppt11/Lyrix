import { StatTile } from '@/components/StatTile';
import { Panel } from '@/components/Panel';
import { Activity, DollarSign, Users, Eye } from 'lucide-react';
import { PLATFORM_LIST } from '@/lib/creator-platform/platforms';
import { getMockAccount, getMockRevenue, getMockEngagement } from '@/lib/creator-platform/mock';
import { formatCompactNumber, formatCurrencyFromCents } from '@/lib/utils';
import { PLATFORM_ICONS } from '@/components/platform-icons';
import Link from 'next/link';

export default function HomePage() {
  const accounts = PLATFORM_LIST.map((p) => getMockAccount(p.id));
  const totalFollowers = accounts.reduce((sum, a) => sum + a.followers, 0);

  const revenuePlatforms = PLATFORM_LIST.filter((p) => getMockRevenue(p.id, '30d').totalCents > 0);
  const totalRevenueCents = revenuePlatforms.reduce((sum, p) => sum + getMockRevenue(p.id, '30d').totalCents, 0);

  const totalViews = PLATFORM_LIST.reduce((sum, p) => sum + getMockEngagement(p.id, '30d').views, 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow">Neural Core</h1>
        <p className="text-gray-400 mt-1">
          Unified overview across every connected platform. All figures below use demo data.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Total Followers"
          value={formatCompactNumber(totalFollowers)}
          delta="+2.3% vs last 30d"
          positive
          icon={Users}
        />
        <StatTile
          label="Revenue (30d)"
          value={formatCurrencyFromCents(totalRevenueCents)}
          delta="+5.1% vs prior period"
          positive
          icon={DollarSign}
        />
        <StatTile
          label="Total Views (30d)"
          value={formatCompactNumber(totalViews)}
          delta="+8.7% vs prior period"
          positive
          icon={Eye}
        />
        <StatTile
          label="Platforms Connected"
          value={`${accounts.filter((a) => a.connected).length} / ${accounts.length}`}
          delta="Demo mode active"
          icon={Activity}
        />
      </div>

      <section>
        <h2 className="font-orbitron text-lg text-white mb-4">Connected Platforms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_LIST.map((platform) => {
            const Icon = PLATFORM_ICONS[platform.id];
            const account = getMockAccount(platform.id);
            const engagement = getMockEngagement(platform.id, '30d');
            return (
              <Link key={platform.id} href="/creator-platform">
                <Panel className="flex flex-col gap-3 hover:border-neon-cyan/40 transition-colors h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={20} style={{ color: platform.color }} />
                      <span className="font-medium text-white">{platform.label}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-yellow/10 text-neon-yellow border border-neon-yellow/30">
                      Demo
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Followers</span>
                    <span className="text-white">{formatCompactNumber(account.followers)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Views (30d)</span>
                    <span className="text-white">{formatCompactNumber(engagement.views)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Engagement rate</span>
                    <span className="text-neon-cyan">{(engagement.engagementRate * 100).toFixed(1)}%</span>
                  </div>
                </Panel>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
