import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const ActivityManagerSkeleton = () => {
  return (
    <div className="space-y-6 font-sans p-4">
      {/* Top Metrics Row Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 border border-outline/20 p-3 rounded-2xl space-y-2">
            <SkeletonLine width="w-16" height="h-3" />
            <SkeletonLine width="w-10" height="h-6" />
          </div>
        ))}
      </div>

      {/* Progress & Quick Actions Header Skeleton */}
      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <div className="flex items-center gap-4">
          <SkeletonCircle size="w-12 h-12" />
          <div className="space-y-1">
            <SkeletonLine width="w-32" height="h-4" />
            <SkeletonLine width="w-20" height="h-3" />
          </div>
        </div>
        <SkeletonBox className="w-28 h-9 rounded-full" />
      </div>

      {/* Task Cards List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-white border border-outline/20 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-1">
              <SkeletonCircle size="w-6 h-6" />
              <div className="space-y-2 flex-1">
                <SkeletonLine width="w-3/4" height="h-4" />
                <div className="flex gap-2">
                  <SkeletonLine width="w-16" height="h-3" className="rounded-full" />
                  <SkeletonLine width="w-20" height="h-3" className="rounded-full" />
                </div>
              </div>
            </div>
            <SkeletonBox className="w-20 h-6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityManagerSkeleton;
