'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  Share2,
  ListTodo,
  Users,
  Zap,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Neural Core', icon: LayoutDashboard },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/ecommerce', label: 'Commerce Matrix', icon: LineChart },
  { href: '/social', label: 'Social Grid', icon: Share2 },
  { href: '/creator-platform', label: 'Creator Platform', icon: Users },
  { href: '/tasks', label: 'Task Protocol', icon: ListTodo },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-neon-cyan/15 p-6 glass-panel m-4 rounded-2xl">
      <div className="flex items-center gap-2 mb-10">
        <Zap className="text-neon-cyan" />
        <span className="font-orbitron text-lg tracking-widest text-neon-cyan text-shadow-glow">
          LYRALYTICS
        </span>
      </div>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                  : 'text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/5'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto text-xs text-gray-500 pt-6">
        v1.0.0 · Demo data mode
      </div>
    </aside>
  );
}
