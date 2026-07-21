import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const TableSkeleton = () => {
  return (
    <div className="space-y-4 font-sans w-full">
      <div className="flex items-center justify-between gap-4 pb-2">
        <SkeletonBox className="w-64 h-10 rounded-xl" />
        <div className="flex gap-2">
          <SkeletonBox className="w-24 h-10 rounded-xl" />
          <SkeletonBox className="w-24 h-10 rounded-xl" />
        </div>
      </div>

      <div className="bg-white border border-outline/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-outline/20 flex items-center justify-between">
          <SkeletonLine width="w-24" height="h-4" />
          <SkeletonLine width="w-32" height="h-4" />
          <SkeletonLine width="w-20" height="h-4" />
          <SkeletonLine width="w-16" height="h-4" />
        </div>

        <div className="divide-y divide-outline/10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/4">
                <SkeletonCircle size="w-8 h-8" />
                <SkeletonLine width="w-3/4" height="h-4" />
              </div>
              <SkeletonLine width="w-1/4" height="h-4" />
              <SkeletonLine width="w-1/6" height="h-4" className="rounded-full" />
              <SkeletonBox className="w-16 h-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
