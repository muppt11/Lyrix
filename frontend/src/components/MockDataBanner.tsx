import { Info } from 'lucide-react';

export function MockDataBanner({ platform }: { platform?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-neon-yellow/30 bg-neon-yellow/5 p-3 text-sm text-neon-yellow">
      <Info size={16} className="mt-0.5 shrink-0" />
      <span>
        {platform ? `${platform} is showing demo data. ` : 'Showing demo data. '}
        Connect a real account to replace this with live analytics — see{' '}
        <code className="text-xs">env.example</code> and{' '}
        <code className="text-xs">src/lib/creator-platform</code> for setup instructions.
      </span>
    </div>
  );
}
