import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'LyraLytics — Cybernetic Analytics Platform',
  description: 'A unified, multi-platform creator and business analytics dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-exo matrix-bg min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10">{children}</main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
