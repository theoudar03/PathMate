import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const HomeSkeleton = () => {
  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left">
      {/* Hero Section Skeleton */}
      <div className="bg-white border border-outline/40 rounded-[24px] p-7 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 shadow-sm border-l-4 border-l-primary/30">
        <div className="flex-1 space-y-4 w-full">
          <SkeletonLine width="w-32" height="h-6" className="rounded-full" />
          <SkeletonLine width="w-3/4" height="h-10" className="rounded-xl" />
          <SkeletonLine width="w-1/2" height="h-6" className="rounded-lg" />
          <SkeletonLine width="w-5/6" height="h-4" className="rounded-md" />
          <div className="flex gap-3 pt-2">
            <SkeletonBox className="w-28 h-10 rounded-full" />
            <SkeletonBox className="w-28 h-10 rounded-full" />
          </div>
        </div>
        <div className="w-full md:w-2/5 flex items-center justify-center">
          <SkeletonBox className="w-64 h-48 rounded-2xl" />
        </div>
      </div>

      {/* Quick Actions Grid Skeleton */}
      <div className="space-y-4">
        <SkeletonLine width="w-36" height="h-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-outline/30 rounded-[20px] p-5 space-y-4 shadow-sm">
              <SkeletonCircle size="w-12 h-12" className="rounded-2xl" />
              <SkeletonLine width="w-3/4" height="h-5" />
              <SkeletonLine width="w-full" height="h-3" />
              <div className="flex justify-end pt-2">
                <SkeletonLine width="w-6" height="h-6" className="rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Campus Snapshot Grid Skeleton */}
      <div className="space-y-4">
        <SkeletonLine width="w-40" height="h-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-outline/30 rounded-[20px] p-5 space-y-3 shadow-sm border-l-4 border-l-gray-300">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-8 h-8" className="rounded-lg" />
                <SkeletonLine width="w-24" height="h-3" />
              </div>
              <SkeletonLine width="w-2/3" height="h-6" />
              <SkeletonLine width="w-full" height="h-3" className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
