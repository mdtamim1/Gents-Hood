'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setIsSuccess(true);
      showToast(data.message, 'success');
      setEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error subscribing. Please try again.';
      showToast(msg, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="border-cream/20 bg-cream/5 flex items-center gap-2 rounded-[1px] border px-4 py-3 text-xs text-cream">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
        <span>Welcome to the Hood. Check your email for private capsule dispatches.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            className="border-muted-inv/40 placeholder:text-muted-inv/60 w-full rounded-[1px] border bg-ink px-4 py-3 text-xs text-cream transition-colors focus:border-cream focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-[1px] bg-cream px-6 py-3 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:bg-cream-soft disabled:opacity-50"
        >
          {isLoading ? (
            'Joining...'
          ) : (
            <>
              <span>Join the Hood</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-inv">
        Early access to limited garment drops & VIP invitations. No spam.
      </p>
    </form>
  );
}
