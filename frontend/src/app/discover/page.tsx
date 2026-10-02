'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Youtube,
  Loader2,
  TrendingUp,
  Layers,
  AlertCircle,
  Info,
  Check,
  Film,
  Image as ImageIcon,
  ImagePlus,
  Trash2,
} from 'lucide-react';

type PictureAsset = { id: string; name: string; url: string };

const NICHES: { id: Niche; label: string; accent: string }[] = [
  { id: 'dance', label: 'Dance', accent: '#58a8d4' },
  { id: 'fashion', label: 'Fashion', accent: '#b36b73' },
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
  const [activeTab, setActiveTab] = useState<'pictures' | 'youtube'>('pictures');
  const [pictures, setPictures] = useState<PictureAsset[]>([]);
  const [selectedPictureIds, setSelectedPictureIds] = useState<Set<string>>(new Set());
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const pictureUrls = useRef<string[]>([]);

  useEffect(
    () => () => pictureUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    []
  );

  function addPictures(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => {
        const url = URL.createObjectURL(file);
        pictureUrls.current.push(url);
        return { id: url, name: file.name, url };
      });
    setPictures((current) => [...current, ...added]);
  }

  function removePicture(picture: PictureAsset) {
    URL.revokeObjectURL(picture.url);
    pictureUrls.current = pictureUrls.current.filter((url) => url !== picture.url);
    setPictures((current) => current.filter((item) => item.id !== picture.id));
    setSelectedPictureIds((current) => {
      const next = new Set(current);
      next.delete(picture.id);
      return next;
    });
  }

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

  return (
    <div className="discover-workspace flex flex-col gap-6 animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="discover-title">Assets</h1>
          <p className="discover-lede mt-2 max-w-xl text-sm">
            Curate pictures and find YouTube videos for your workspace.
          </p>
        </div>
      </header>

      <div className="discover-tabs" role="tablist" aria-label="Media type">
        {[
          { id: 'pictures' as const, label: 'Pictures', icon: ImageIcon, count: selectedPictureIds.size },
          { id: 'youtube' as const, label: 'YouTube videos', icon: Film, count: selectedVideoIds.size },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            id={`media-tab-${id}`}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls="media-panel"
            onClick={() => setActiveTab(id)}
            className={`discover-tab ${activeTab === id ? 'is-active' : ''}`}
          >
            <Icon size={16} />
            {label}
            {count > 0 && <span className="text-xs text-gray-500">{count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'pictures' ? (
        <div id="media-panel" role="tabpanel" aria-labelledby="media-tab-pictures" className="flex flex-col gap-5">
          <Panel className="discover-toolbar">
            <div>
              <h2 className="discover-section-title">Pictures</h2>
              <p className="discover-selection-count mt-1">{selectedPictureIds.size} selected</p>
            </div>
            <label className="discover-primary-button cursor-pointer">
              <ImagePlus size={16} /> Add pictures
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addPictures(event.currentTarget.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </Panel>

          {pictures.length === 0 ? (
            <Panel className="discover-empty flex min-h-64 flex-col items-center justify-center gap-3 text-center">
              <ImageIcon size={32} />
              <p>No pictures added</p>
            </Panel>
          ) : (
            <div className="discover-gallery columns-1 sm:columns-2 xl:columns-3">
              {pictures.map((picture) => {
                const selected = selectedPictureIds.has(picture.id);
                return (
                  <Panel key={picture.id} className={`discover-asset-card ${selected ? 'is-selected' : ''}`}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${selected ? 'Deselect' : 'Select'} ${picture.name}`}
                      onClick={() =>
                        setSelectedPictureIds((current) => {
                          const next = new Set(current);
                          selected ? next.delete(picture.id) : next.add(picture.id);
                          return next;
                        })
                      }
                      className="discover-asset-preview focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-cyan"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={picture.url} alt={picture.name} />
                      <span className={`discover-check-badge ${selected ? 'is-selected' : ''}`}>
                        {selected && <Check size={15} />}
                      </span>
                    </button>
                    <div className="discover-asset-meta">
                      <span className="discover-asset-name" title={picture.name}>{picture.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${picture.name}`}
                        title="Remove picture"
                        onClick={() => removePicture(picture)}
                        className="discover-icon-button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <div id="media-panel" role="tabpanel" aria-labelledby="media-tab-youtube" className="flex flex-col gap-6">
      <Panel>
        <div className="relative flex flex-col gap-4">
          <div className="flex gap-2">
            {NICHES.map((n) => {
              const active = niche === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNiche(n.id)}
                  className={`discover-chip relative rounded-lg border px-4 py-2 text-sm font-medium transition-all ${active ? 'is-active' : ''}`}
                  style={
                    active
                      ? {
                          borderColor: `${n.accent}66`,
                          backgroundColor: `${n.accent}1a`,
                          color: n.accent,
                          boxShadow: 'none',
                        }
                      : { borderColor: '#e4e4ea', color: '#686873' }
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
                className="discover-input w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-1"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="discover-primary-button disabled:cursor-not-allowed disabled:opacity-50"
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
                className="discover-suggestion rounded-full border px-3 py-1 text-xs transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {error && (
            <p className="discover-error flex items-center gap-1.5 text-sm">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>
      </Panel>

      {!result && !loading && (
        <Panel className="discover-empty flex flex-col items-center gap-2 py-16 text-center">
          <Layers size={28} />
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
                  icon={TrendingUp}
                />
                <StatTile label="Avg Engagement" value={formatPercent(summary.avgEngagement)} icon={TrendingUp} />
              </div>
            )}

            <Panel className="flex items-start gap-2 text-sm text-gray-400 border-neon-blue/20">
              <Info size={16} className="mt-0.5 shrink-0 text-neon-blue" />
              <span>Ranked by views gained per day since publishing.</span>
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
                        <stop offset="0%" stopColor="#55a8d0" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#55a8d0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#ecebf0" />
                    <XAxis dataKey="date" stroke="#777681" fontSize={11} minTickGap={30} />
                    <YAxis stroke="#777681" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #e8e8ed', borderRadius: 6, color: '#20202a' }}
                      labelStyle={{ color: '#287fa8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="interest"
                      stroke="#55a8d0"
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
                      <Panel className="discover-video-card group flex h-full flex-col gap-3 transition-transform hover:-translate-y-0.5">
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
                            <span className="discover-velocity absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium">
                              <TrendingUp size={11} /> {velocity}
                            </span>
                          )}
                          <button
                            type="button"
                            aria-pressed={selectedVideoIds.has(item.id)}
                            aria-label={`${selectedVideoIds.has(item.id) ? 'Deselect' : 'Select'} ${item.title}`}
                            onClick={() =>
                              setSelectedVideoIds((current) => {
                                const next = new Set(current);
                                current.has(item.id) ? next.delete(item.id) : next.add(item.id);
                                return next;
                              })
                            }
                            className={`discover-video-select absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${selectedVideoIds.has(item.id) ? 'is-selected' : ''}`}
                            title={selectedVideoIds.has(item.id) ? 'Deselect video' : 'Select video'}
                          >
                            {selectedVideoIds.has(item.id) ? <Check size={15} /> : <Film size={15} />}
                          </button>
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
      )}
    </div>
  );
}
