import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const EventsClubsSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 font-sans">
      {/* Header & Tabs */}
      <div className="space-y-4">
        <SkeletonLine width="w-48" height="h-8" />
        <SkeletonLine width="w-2/3" height="h-4" />
        <div className="flex gap-3 pt-2">
          <SkeletonBox className="w-28 h-10 rounded-full" />
          <SkeletonBox className="w-28 h-10 rounded-full" />
          <SkeletonBox className="w-28 h-10 rounded-full" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-outline/30 rounded-[24px] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <SkeletonCircle size="w-12 h-12" className="rounded-2xl" />
              <SkeletonLine width="w-16" height="h-5" className="rounded-full" />
            </div>
            <SkeletonLine width="w-3/4" height="h-6" />
            <SkeletonLine width="w-full" height="h-4" />
            <SkeletonLine width="w-4/5" height="h-4" />
            <div className="pt-3 border-t border-outline/20 flex items-center justify-between">
              <SkeletonLine width="w-24" height="h-3" />
              <SkeletonBox className="w-20 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsClubsSkeleton;
