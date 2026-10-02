'use client';

import { useMemo, useState } from 'react';
import { Panel } from '@/components/Panel';
import { StatTile } from '@/components/StatTile';
import { MockDataBanner } from '@/components/MockDataBanner';
import { PLATFORM_ICONS } from '@/components/platform-icons';
import { PLATFORM_LIST } from '@/lib/creator-platform/platforms';
import {
  getMockAccount,
  getMockAudience,
  getMockEngagement,
  getMockRevenue,
  getMockTopContent,
} from '@/lib/creator-platform/mock';
import { isUsingMockData } from '@/lib/creator-platform/providers';
import type { CreatorPlatformId, DateRange } from '@/types/creator-platform';
import { cn, formatCompactNumber, formatCurrencyFromCents, formatPercent } from '@/lib/utils';
import { DollarSign, Eye, Heart, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

const RANGES: { id: DateRange; label: string }[] = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'ytd', label: 'YTD' },
];

export default function CreatorPlatformPage() {
  const [platformId, setPlatformId] = useState<CreatorPlatformId>('instagram');
  const [range, setRange] = useState<DateRange>('30d');

  const platform = PLATFORM_LIST.find((p) => p.id === platformId)!;
  const Icon = PLATFORM_ICONS[platformId];

  const account = useMemo(() => getMockAccount(platformId), [platformId]);
  const revenue = useMemo(() => getMockRevenue(platformId, range), [platformId, range]);
  const engagement = useMemo(() => getMockEngagement(platformId, range), [platformId, range]);
  const topContent = useMemo(() => getMockTopContent(platformId, range, 5), [platformId, range]);
  const audience = useMemo(() => getMockAudience(platformId), [platformId]);
  const usingMock = isUsingMockData(platformId);

  const chartData = engagement.series.map((point, i) => ({
    date: point.date.slice(5),
    views: point.views,
    revenue: revenue.series[i]?.amountCents ? revenue.series[i].amountCents / 100 : 0,
  }));

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow">Creator Platform</h1>
        <p className="text-gray-400 mt-1">
          One dashboard for every channel — Instagram, YouTube, TikTok, Facebook, X, OnlyFans, Patreon, and more.
        </p>
      </header>

      {/* Platform selector */}
      <div className="flex flex-wrap gap-2">
        {PLATFORM_LIST.map((p) => {
          const PIcon = PLATFORM_ICONS[p.id];
          const active = p.id === platformId;
          return (
            <button
              key={p.id}
              onClick={() => setPlatformId(p.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                  : 'border-white/10 text-gray-400 hover:border-neon-cyan/30 hover:text-white'
              )}
            >
              <PIcon size={16} style={{ color: active ? undefined : p.color }} />
              {p.label}
            </button>
          );
        })}
      </div>

      {usingMock && <MockDataBanner platform={platform.label} />}

      <Panel>
        <p className="text-sm text-gray-400">{platform.description}</p>
        <a
          href={platform.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-neon-cyan hover:underline"
        >
          {platform.docsUrl}
        </a>
      </Panel>

      {/* Range selector */}
      <div className="flex items-center gap-2 self-start">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              range === r.id
                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                : 'text-gray-400 hover:text-white'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Followers"
          value={formatCompactNumber(account.followers)}
          delta={`+${formatCompactNumber(account.followerChange)} this period`}
          positive
          icon={Users}
        />
        <StatTile
          label="Views"
          value={formatCompactNumber(engagement.views)}
          delta={`${formatCompactNumber(engagement.likes)} likes`}
          positive
          icon={Eye}
        />
        <StatTile
          label="Engagement Rate"
          value={formatPercent(engagement.engagementRate)}
          icon={Heart}
        />
        <StatTile
          label="Revenue"
          value={formatCurrencyFromCents(revenue.totalCents, revenue.currency)}
          delta={revenue.totalCents > 0 ? 'Includes all revenue sources' : 'No revenue stream on this platform'}
          positive={revenue.totalCents > 0}
          icon={DollarSign}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <h3 className="font-orbitron text-sm text-white mb-4">Views over time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ffff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00ffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => formatCompactNumber(v)} />
              <Tooltip
                contentStyle={{ background: '#0a0f19', border: '1px solid rgba(0,255,255,0.2)', borderRadius: 8 }}
                labelStyle={{ color: '#00ffff' }}
                formatter={(value: number) => formatCompactNumber(value)}
              />
              <Area type="monotone" dataKey="views" stroke="#00ffff" fill="url(#viewsGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <h3 className="font-orbitron text-sm text-white mb-4">Revenue by source</h3>
          {revenue.bySource.length > 0 && revenue.totalCents > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenue.bySource}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => formatCurrencyFromCents(v)} />
                <Tooltip
                  contentStyle={{ background: '#0a0f19', border: '1px solid rgba(0,255,255,0.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#00ffff' }}
                  formatter={(value: number) => formatCurrencyFromCents(value)}
                />
                <Bar dataKey="amountCents" fill="#8000ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-gray-500">
              {platform.label} doesn&apos;t have a direct monetization revenue stream tracked here.
            </div>
          )}
        </Panel>
      </div>

      {/* Top content + audience */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel>
          <h3 className="font-orbitron text-sm text-white mb-4">Top content</h3>
          <div className="flex flex-col divide-y divide-white/5">
            {topContent.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 uppercase">{item.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-neon-cyan">{formatCompactNumber(item.metrics.views)} views</p>
                  {item.metrics.revenueCents !== undefined && (
                    <p className="text-xs text-gray-400">{formatCurrencyFromCents(item.metrics.revenueCents)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <h3 className="font-orbitron text-sm text-white mb-4">Audience — top countries</h3>
          <div className="flex flex-col gap-3">
            {audience.topCountries.map((c) => (
              <div key={c.country}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{c.country}</span>
                  <span className="text-neon-cyan">{c.percent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className="h-1.5 rounded-full bg-neon-cyan"
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="text-xs text-gray-500">
        <Icon size={14} className="inline mr-1" style={{ color: platform.color }} />
        All data shown is generated demo data for layout/preview purposes. To connect{' '}
        {platform.label}, implement a provider in{' '}
        <code>src/lib/creator-platform/providers</code> and configure credentials per{' '}
        <code>env.example</code>.
      </Panel>
    </div>
  );
}
