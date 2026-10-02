import { cn } from '@/lib/utils';
import type { SourceStatus } from '@/types/discover';

const STATUS_STYLES: Record<SourceStatus, string> = {
  live: 'text-neon-green border-neon-green/30 bg-neon-green/5',
  degraded: 'text-neon-orange border-neon-orange/30 bg-neon-orange/5',
  csv: 'text-neon-blue border-neon-blue/30 bg-neon-blue/5',
  mock: 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/5',
};

const STATUS_LABELS: Record<SourceStatus, string> = {
  live: 'Live',
  degraded: 'Degraded',
  csv: 'CSV import',
  mock: 'Sample data',
};

export function SourceStatusBadge({ status, label }: { status: SourceStatus; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ? `${label}: ${STATUS_LABELS[status]}` : STATUS_LABELS[status]}
    </span>
  );
}
