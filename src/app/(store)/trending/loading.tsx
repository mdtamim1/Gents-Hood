import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function TrendingLoading() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-10 lg:px-14">
      <div className="space-y-3 border-b border-line pb-8">
        <Skeleton variant="text" className="h-3 w-24" />
        <Skeleton variant="text" className="h-8 w-64" />
      </div>

      <div className="flex items-center justify-between py-6">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid grid-cols-2 gap-6 pt-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] w-full" />
            <Skeleton variant="text" className="h-4 w-3/4" />
            <Skeleton variant="text" className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
