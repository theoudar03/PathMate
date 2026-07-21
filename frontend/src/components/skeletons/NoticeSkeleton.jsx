import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const NoticeSkeleton = () => {
  return (
    <div className="space-y-4 p-4 font-sans">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-white rounded-xl border border-outline/20 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <SkeletonLine width="w-24" height="h-4" className="rounded-full" />
            <SkeletonLine width="w-16" height="h-3" />
          </div>
          <SkeletonLine width="w-5/6" height="h-5" />
          <SkeletonLine width="w-full" height="h-3" />
          <SkeletonLine width="w-3/4" height="h-3" />
        </div>
      ))}
    </div>
  );
};

export default NoticeSkeleton;
