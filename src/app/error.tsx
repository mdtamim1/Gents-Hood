'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream p-8 text-center text-ink">
      <h2 className="text-4xl font-bold tracking-tight">Something went wrong</h2>
      <p className="mt-4 text-sm text-muted">An unexpected error has occurred.</p>
      <button
        onClick={() => reset()}
        className="mt-8 bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-looser text-cream transition-colors hover:bg-ink-soft"
      >
        Try again
      </button>
    </main>
  );
}
