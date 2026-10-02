'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Image, LayoutDashboard, ListTodo, TrendingUp, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { PixelMark } from '@/components/PixelMark';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/tasks', label: 'Project', icon: ListTodo },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/social', label: 'Progress', icon: TrendingUp },
  { href: '/discover', label: 'Assets', icon: Image },
  { href: '/creator-platform', label: 'Apps', icon: Users },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="lyrix-shell">
      <header className="lyrix-topbar">
        <div className="lyrix-topbar-inner">
          <Link className="lyrix-brand" href="/discover" aria-label="Lyrix home">
            <PixelMark />
            <span className="lyrix-brand-word">LYRIX</span>
          </Link>
          <nav className="lyrix-nav" aria-label="Main navigation">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`lyrix-nav-link ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link className="lyrix-account" href="/login" aria-label="Open sign-in page" title="Demo account">
            T
          </Link>
        </div>
      </header>
      <main className="lyrix-main">{children}</main>
    </div>
  );
}