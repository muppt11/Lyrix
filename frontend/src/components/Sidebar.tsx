'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Image,
  LayoutDashboard,
  ListTodo,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelMark } from '@/components/PixelMark';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Project', icon: ListTodo },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/social', label: 'Progress', icon: TrendingUp },
  { href: '/discover', label: 'Assets', icon: Image },
  { href: '/creator-platform', label: 'Apps', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-56 flex-col border-r border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-10">
        <PixelMark />
        <span className="lyrix-brand-word">LYRIX</span>
      </div>
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-sky-50 text-sky-800 border border-sky-200'
                  : 'text-gray-600 hover:bg-sky-50 hover:text-sky-800'
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
