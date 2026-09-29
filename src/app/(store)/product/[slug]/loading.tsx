import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-10 lg:px-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Left Gallery Skeleton */}
        <div className="flex gap-4 lg:col-span-7">
          <div className="hidden flex-col gap-3 sm:flex">
            <Skeleton className="h-24 w-20" />
            <Skeleton className="h-24 w-20" />
            <Skeleton className="h-24 w-20" />
          </div>
          <Skeleton className="aspect-[3/4] w-full flex-1" />
        </div>

        {/* Right Details Skeleton */}
        <div className="space-y-6 lg:col-span-5">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-3/4" />
          <Skeleton variant="text" className="h-6 w-40" />
          <Skeleton variant="text" className="h-16 w-full" />
          <div className="flex gap-3">
            <Skeleton variant="circle" className="h-8 w-8" />
            <Skeleton variant="circle" className="h-8 w-8" />
            <Skeleton variant="circle" className="h-8 w-8" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </main>
  );
}
