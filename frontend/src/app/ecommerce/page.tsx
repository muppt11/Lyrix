'use client';

import { Panel } from '@/components/Panel';
import { StatTile } from '@/components/StatTile';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { formatCompactNumber, formatCurrencyFromCents } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const seriesDates = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().slice(5, 10);
});

const revenueSeries = seriesDates.map((date, i) => ({
  date,
  revenue: Math.round(8000 + Math.sin(i / 3) * 1500 + i * 80),
}));

const topProducts = [
  { name: 'Cyber Hoodie', units: 482, revenueCents: 1928000 },
  { name: 'Neon Sneakers', units: 311, revenueCents: 2487900 },
  { name: 'Holo Backpack', units: 256, revenueCents: 1535900 },
  { name: 'Data Glasses', units: 198, revenueCents: 3563820 },
  { name: 'Pulse Watch', units: 142, revenueCents: 2129580 },
];

export default function EcommercePage() {
  const totalRevenueCents = revenueSeries.reduce((sum, p) => sum + p.revenue, 0) * 100;
  const totalOrders = topProducts.reduce((sum, p) => sum + p.units, 0);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <header>
        <h1 className="font-orbitron text-3xl text-neon-cyan text-shadow-glow">Commerce Matrix</h1>
        <p className="text-gray-400 mt-1">Sales performance and product analytics (demo data).</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Revenue (30d)" value={formatCurrencyFromCents(totalRevenueCents)} delta="+4.2%" positive icon={DollarSign} />
        <StatTile label="Orders" value={formatCompactNumber(totalOrders)} delta="+1.8%" positive icon={ShoppingCart} />
        <StatTile label="Avg Order Value" value={formatCurrencyFromCents(totalRevenueCents / totalOrders)} icon={TrendingUp} />
        <StatTile label="Active SKUs" value={String(topProducts.length)} icon={Package} />
      </div>

      <Panel>
        <h3 className="font-orbitron text-sm text-white mb-4">Revenue trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={revenueSeries}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#0a0f19', border: '1px solid rgba(0,255,255,0.2)', borderRadius: 8 }}
              labelStyle={{ color: '#00ffff' }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#00ffff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel>
        <h3 className="font-orbitron text-sm text-white mb-4">Top products</h3>
        <div className="flex flex-col divide-y divide-white/5">
          {topProducts.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-3 text-sm">
              <span className="text-white">{p.name}</span>
              <span className="text-gray-400">{p.units} units</span>
              <span className="text-neon-cyan">{formatCurrencyFromCents(p.revenueCents)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
