import { Panel } from './Panel';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon?: LucideIcon;
}

export function StatTile({ label, value, delta, positive, icon: Icon }: StatTileProps) {
  return (
    <Panel className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-gray-400">{label}</span>
        {Icon && <Icon size={18} className="text-neon-cyan" />}
      </div>
      <span className="font-orbitron text-2xl text-white text-shadow-glow">{value}</span>
      {delta && (
        <span className={cn('text-xs font-medium', positive ? 'text-neon-green' : 'text-neon-red')}>
          {delta}
        </span>
      )}
    </Panel>
  );
}
