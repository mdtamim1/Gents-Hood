'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-muted/30 w-full max-w-md space-y-8 border bg-[#1e1e20] p-8 shadow-2xl sm:p-10">
      {/* Header */}
      <div className="space-y-2 text-center">
        <span className="label-caps tracking-widest text-muted">Internal Administration</span>
        <h1 className="display-sm tracking-tight text-cream">GENTS HOOD</h1>
        <p className="text-xs text-muted">
          Sign in with verified administrator credentials to access the store management console.
        </p>
      </div>

      {/* Error notification */}
      {error && (
        <div className="border-danger/40 bg-danger/10 border px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Login form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-looser text-muted">
            Admin Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gentshood.com"
              className="border-muted/40 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-3 pl-10 text-sm text-cream focus:border-cream focus:outline-none"
            />
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-looser text-muted">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="border-muted/40 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-3 pl-10 text-sm text-cream focus:border-cream focus:outline-none"
            />
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted" />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full bg-cream py-3.5 text-xs font-bold tracking-looser text-ink hover:bg-cream-soft"
        >
          Authenticate Portal
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="border-muted/20 border-t pt-4 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted">
          Protected by Cloudflare & End-to-End Cryptographic Sessions
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12 text-cream selection:bg-cream selection:text-ink">
      <Suspense
        fallback={<div className="text-xs uppercase text-muted">Loading authentication...</div>}
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
