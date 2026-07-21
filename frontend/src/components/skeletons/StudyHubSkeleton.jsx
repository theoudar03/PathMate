import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const StudyHubSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 font-sans">
      <div className="space-y-3">
        <SkeletonLine width="w-40" height="h-8" />
        <SkeletonLine width="w-1/2" height="h-4" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonBox key={i} className="w-28 h-9 rounded-full flex-shrink-0" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-outline/30 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="w-10 h-10" />
              <div className="space-y-1 flex-1">
                <SkeletonLine width="w-2/3" height="h-5" />
                <SkeletonLine width="w-1/3" height="h-3" />
              </div>
            </div>
            <SkeletonLine width="w-full" height="h-4" />
            <SkeletonLine width="w-4/5" height="h-4" />
            <div className="flex items-center justify-between pt-2">
              <SkeletonLine width="w-20" height="h-3" />
              <SkeletonBox className="w-24 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudyHubSkeleton;
