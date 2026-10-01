'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      const explicitFrom = searchParams.get('from');
      const destination =
        explicitFrom && explicitFrom !== '/admin/dashboard'
          ? explicitFrom
          : data.redirectUrl || explicitFrom || '/admin/dashboard';

      router.push(destination);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const reasonMessage =
    reason === 'deactivated'
      ? 'Your account has been deactivated by an administrator.'
      : reason === 'session_expired' || reason === 'invalid_session'
        ? 'Your session has expired. Please login again.'
        : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080809]">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/[0.06] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.03] blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative flex h-16 w-44 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2.5 shadow-2xl shadow-black/50">
            <Image
              src="/images/logo.png"
              alt="Gents Hood Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Console</h1>
          <p className="mt-1 text-[13px] text-white/40">Gents Hood Operations Center</p>
        </div>

        {/* Reason warning */}
        {reasonMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-4 py-3 text-[12px] font-medium text-amber-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {reasonMessage}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
          <div className="p-6">
            <h2 className="mb-5 text-[15px] font-semibold text-white">Sign in to continue</h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="email"
                    id="admin-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0f0f11] py-3 pl-10 pr-4 text-[13px] text-white placeholder-white/20 outline-none transition-all focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="admin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#0f0f11] py-3 pl-10 pr-10 text-[13px] text-white placeholder-white/20 outline-none transition-all focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-[12px] font-medium text-red-400">
                  <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="admin-login-btn"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 py-3.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:from-indigo-400 hover:to-indigo-500 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-6 py-4">
            <p className="text-center text-[11px] text-white/20">
              Access restricted to authorized personnel only
            </p>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-white/20">
            <Shield className="h-3 w-3" />
            Encrypted Session
          </div>
          <span className="text-white/10">·</span>
          <div className="flex items-center gap-1.5 text-[10px] text-white/20">
            <Lock className="h-3 w-3" />
            Secure Authentication
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
