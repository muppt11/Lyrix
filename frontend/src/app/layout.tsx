import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Lyrix — Creator Workspace',
  description: 'A focused workspace for creator trends and media.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f7fa] text-[#20202a] [font-family:var(--font-figtree)]">
        <AppShell>{children}</AppShell>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
