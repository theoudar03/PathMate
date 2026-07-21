import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const ProfileSkeleton = () => {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6 font-sans">
      <div className="space-y-2">
        <SkeletonLine width="w-28" height="h-4" />
        <SkeletonLine width="w-48" height="h-8" />
        <SkeletonLine width="w-3/4" height="h-4" />
      </div>

      <div className="bg-white border border-outline/30 rounded-[20px] p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-4">
          <SkeletonCircle size="w-16 h-16" />
          <div className="space-y-2 flex-1">
            <SkeletonLine width="w-1/2" height="h-6" />
            <SkeletonLine width="w-1/3" height="h-4" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline/20">
          <div className="space-y-2">
            <SkeletonLine width="w-20" height="h-3" />
            <SkeletonLine width="w-28" height="h-5" />
          </div>
          <div className="space-y-2">
            <SkeletonLine width="w-20" height="h-3" />
            <SkeletonLine width="w-28" height="h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
