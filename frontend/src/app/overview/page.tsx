import { Panel } from '@/components/Panel';
import { StatTile } from '@/components/StatTile';
import { PLATFORM_ICONS } from '@/components/platform-icons';
import { PLATFORM_LIST } from '@/lib/creator-platform/platforms';
import { getMockAccount, getMockEngagement, getMockRevenue } from '@/lib/creator-platform/mock';
import { formatCompactNumber, formatCurrencyFromCents } from '@/lib/utils';
import { DollarSign, Eye, Users } from 'lucide-react';

const accounts = PLATFORM_LIST.map((platform) => getMockAccount(platform.id));
const totalFollowers = accounts.reduce((total, account) => total + account.followers, 0);
const totalViews = PLATFORM_LIST.reduce(
  (total, platform) => total + getMockEngagement(platform.id, '30d').views,
  0
);
const totalRevenue = PLATFORM_LIST.reduce(
  (total, platform) => total + getMockRevenue(platform.id, '30d').totalCents,
  0
);

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-7 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan">Overview</h1>
        <p className="mt-1 text-gray-400">A clear view of your creator channels.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Followers" value={formatCompactNumber(totalFollowers)} icon={Users} />
        <StatTile label="Views this month" value={formatCompactNumber(totalViews)} icon={Eye} />
        <StatTile label="Revenue this month" value={formatCurrencyFromCents(totalRevenue)} icon={DollarSign} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <span className="text-sm text-gray-500">Demo data</span>
        </div>
        <Panel className="divide-y divide-white/5 p-0">
          {PLATFORM_LIST.map((platform) => {
            const Icon = PLATFORM_ICONS[platform.id];
            const account = getMockAccount(platform.id);
            const engagement = getMockEngagement(platform.id, '30d');
            return (
              <div key={platform.id} className="overview-channel-row">
                <div className="flex min-w-0 items-center gap-3">
                  <Icon size={18} style={{ color: platform.color }} />
                  <span className="truncate font-medium">{platform.label}</span>
                </div>
                <span className="overview-channel-handle">{account.handle}</span>
                <span>{formatCompactNumber(account.followers)} followers</span>
                <span>{formatCompactNumber(engagement.views)} views</span>
              </div>
            );
          })}
        </Panel>
      </section>
    </div>
  );
}