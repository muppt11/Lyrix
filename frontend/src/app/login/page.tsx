'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PixelMark } from '@/components/PixelMark';

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push('/overview');
  }

  return (
    <main className="lyrix-login">
      <header className="lyrix-login-header">
        <Link className="lyrix-brand" href="/login" aria-label="Lyrix sign in">
          <PixelMark />
          <span className="lyrix-brand-word">LYRIX</span>
        </Link>
        <Link className="lyrix-preview-link" href="/overview">Preview dashboard <span aria-hidden="true">●</span></Link>
      </header>

      <section className="lyrix-login-content" aria-labelledby="login-title">
        <span className="lyrix-login-kicker">CREATOR WORKSPACE</span>
        <h1 id="login-title">Welcome back</h1>
        <p className="lyrix-login-subtitle">Sign in to your account</p>

        <form className="lyrix-login-form" method="post" action="/login" onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <button type="submit">
            Enter demo workspace <ArrowRight size={17} />
          </button>
        </form>
        <p className="lyrix-login-note">Demo access only. Authentication is not configured.</p>
      </section>
    </main>
  );
}