'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Panel } from '@/components/Panel';
import { StatTile } from '@/components/StatTile';
import { SourceStatusBadge } from '@/components/SourceStatusBadge';
import { discoverContent } from '@/lib/discover/api';
import { formatCompactNumber, formatPercent } from '@/lib/utils';
import type { DiscoverResult, Niche } from '@/types/discover';
import {
  Search,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Flame,
  Youtube,
  Loader2,
  TrendingUp,
  Layers,
  AlertCircle,
} from 'lucide-react';

const NICHES: { id: Niche; label: string; accent: string }[] = [
  { id: 'dance', label: 'Dance', accent: '#00ffff' },
  { id: 'fashion', label: 'Fashion', accent: '#ff0080' },
];

const EXAMPLE_QUERIES: Record<Niche, string[]> = {
  dance: ['street dance choreography', 'breakdance battle', 'dance challenge', 'contemporary dance'],
  fashion: ['y2k fashion trend', 'streetwear haul', 'thrift flip', 'capsule wardrobe'],
};

function velocityLabel(viewsPerDay: number | null | undefined): string | null {
  if (!viewsPerDay) return null;
  return `${formatCompactNumber(viewsPerDay)}/day`;
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [niche, setNiche] = useState<Niche>('dance');
  const [result, setResult] = useState<DiscoverResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setError('Enter at least 2 characters to search.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await discoverContent(trimmed, niche);
      setResult(res);
    } catch {
      setError('Search failed. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void runSearch(query);
  }

  function handleExampleClick(q: string) {
    setQuery(q);
    void runSearch(q);
  }

  const summary = useMemo(() => {
    if (!result || result.items.length === 0) return null;
    const totalViews = result.items.reduce((s, it) => s + it.metrics.views, 0);
    const peakVelocity = Math.max(...result.items.map((it) => it.metrics.viewVelocity ?? 0));
    const avgEngagement =
      result.items.reduce((s, it) => s + (it.metrics.likes + it.metrics.comments) / Math.max(it.metrics.views, 1), 0) /
      result.items.length;
    return { totalViews, peakVelocity, avgEngagement, count: result.items.length };
  }, [result]);

  const activeAccent = NICHES.find((n) => n.id === niche)?.accent ?? '#00ffff';

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow flex items-center gap-3">
            <Sparkles className="text-neon-purple" />
            Discover
          </h1>
          <p className="text-gray-400 mt-1 max-w-xl">
            Search a niche keyword to see what&apos;s trending right now, ranked by real view velocity
            — not just total views.
          </p>
        </div>
      </header>

      <Panel className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-20 transition-colors duration-500"
          style={{
            background: `radial-gradient(circle at 15% 0%, ${activeAccent}33 0%, transparent 60%)`,
          }}
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex gap-2">
            {NICHES.map((n) => {
              const active = niche === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNiche(n.id)}
                  className="relative rounded-lg border px-4 py-2 text-sm font-medium transition-all"
                  style={
                    active
                      ? {
                          borderColor: `${n.accent}66`,
                          backgroundColor: `${n.accent}1a`,
                          color: n.accent,
                          boxShadow: `0 0 20px ${n.accent}33`,
                        }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }
                  }
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${niche} keywords, e.g. "${EXAMPLE_QUERIES[niche][0]}"`}
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-neon-cyan/50 focus:outline-none focus:ring-1 focus:ring-neon-cyan/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-neon-cyan/40 bg-neon-cyan/10 px-5 py-2.5 text-sm font-medium text-neon-cyan transition-colors hover:bg-neon-cyan/20 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Searching' : 'Search'}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES[niche].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleExampleClick(q)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-neon-cyan/30 hover:text-neon-cyan"
              >
                {q}
              </button>
            ))}
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-neon-red">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>
      </Panel>

      {!result && !loading && (
        <Panel className="flex flex-col items-center gap-2 text-center text-gray-500 py-16">
          <Layers size={28} className="text-gray-600" />
          Search a niche keyword above, or tap an example, to see real trending content.
        </Panel>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Panel key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-video w-full rounded-lg bg-white/5" />
              <div className="h-4 w-4/5 rounded bg-white/5" />
              <div className="h-3 w-1/3 rounded bg-white/5" />
              <div className="h-3 w-full rounded bg-white/5" />
            </Panel>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {result && !loading && (
          <motion.div
            key={result.query + result.niche}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-wrap items-center gap-2">
              <SourceStatusBadge status={result.source} label="YouTube" />
              {result.trendSource && <SourceStatusBadge status={result.trendSource} label="Google Trends" />}
            </div>

            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile label="Results" value={String(summary.count)} icon={Layers} />
                <StatTile label="Combined Views" value={formatCompactNumber(summary.totalViews)} icon={Eye} />
                <StatTile
                  label="Peak Velocity"
                  value={velocityLabel(summary.peakVelocity) ?? '—'}
                  icon={Flame}
                />
                <StatTile label="Avg Engagement" value={formatPercent(summary.avgEngagement)} icon={TrendingUp} />
              </div>
            )}

            <Panel className="flex items-start gap-2 text-sm text-gray-400 border-neon-purple/20">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-neon-purple" />
              <span>{result.baselineNote}</span>
            </Panel>

            {result.trendSignal && result.trendSignal.length > 0 && (
              <Panel>
                <h3 className="font-orbitron text-sm text-white mb-4">
                  Search interest — &quot;{result.query}&quot;
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={result.trendSignal}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8000ff" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#8000ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={11} minTickGap={30} />
                    <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#0a0f19', border: '1px solid rgba(128,0,255,0.3)', borderRadius: 8 }}
                      labelStyle={{ color: '#8000ff' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      stroke="#8000ff"
                      strokeWidth={2}
                      fill="url(#trendFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            )}

            {result.items.length === 0 ? (
              <Panel className="text-center text-gray-500 py-12">
                No results for &quot;{result.query}&quot; in the last 30 days. Try a different keyword.
              </Panel>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.items.map((item, i) => {
                  const velocity = velocityLabel(item.metrics.viewVelocity);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Panel className="group flex flex-col gap-3 h-full transition-all hover:border-neon-cyan/30 hover:shadow-cyber-glow-lg hover:-translate-y-0.5">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
                          {item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-700">
                              <Youtube size={28} />
                            </div>
                          )}
                          {velocity && (
                            <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm border border-neon-orange/40 px-2 py-1 text-[11px] font-medium text-neon-orange">
                              <Flame size={11} /> {velocity}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-white line-clamp-2 leading-snug">{item.title}</span>
                          {item.channelTitle && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Youtube size={12} className="text-[#FF0000]" /> {item.channelTitle}
                            </span>
                          )}
                        </div>
                        <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-gray-400 border-t border-white/5 pt-3">
                          <span className="flex items-center gap-1">
                            <Eye size={13} /> {formatCompactNumber(item.metrics.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart size={13} /> {formatCompactNumber(item.metrics.likes)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={13} /> {formatCompactNumber(item.metrics.comments)}
                          </span>
                        </div>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-xs text-gray-300 transition-colors hover:border-neon-cyan/40 hover:text-neon-cyan"
                          >
                            Watch <ExternalLink size={12} />
                          </a>
                        )}
                      </Panel>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
