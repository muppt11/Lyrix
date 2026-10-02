import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass-panel p-5 shadow-cyber-glow', className)} {...props}>
      {children}
    </div>
  );
}
