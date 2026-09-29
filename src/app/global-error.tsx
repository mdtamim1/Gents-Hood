'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError] Root error caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#171718] p-8 text-center text-[#FFFFF3]">
        <h2 className="text-3xl font-bold tracking-tight">System Encountered an Error</h2>
        <p className="mt-3 text-sm text-[#B9B9AE]">
          We apologize for the disruption. Our technical team has been notified.
        </p>
        <button
          onClick={() => reset()}
          className="mt-8 border border-[rgba(255,255,243,0.16)] bg-[#FFFFF3] px-8 py-3 text-xs font-semibold uppercase tracking-widest text-[#171718] transition-colors hover:bg-[#F4F4E6]"
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
