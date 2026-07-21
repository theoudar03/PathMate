import React from 'react';
import { SkeletonBox, SkeletonCircle, SkeletonLine } from './ShimmerSkeleton';

const ChatSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6 font-sans">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-outline/20">
        <div className="flex items-center gap-3">
          <SkeletonCircle size="w-10 h-10" />
          <div className="space-y-1">
            <SkeletonLine width="w-32" height="h-5" />
            <SkeletonLine width="w-24" height="h-3" />
          </div>
        </div>
        <SkeletonBox className="w-24 h-8 rounded-full" />
      </div>

      {/* Chat Messages Skeleton */}
      <div className="space-y-6 min-h-[400px] p-4 bg-slate-50/50 rounded-2xl border border-outline/20">
        {/* Assistant Message 1 */}
        <div className="flex items-start gap-3">
          <SkeletonCircle size="w-9 h-9" className="bg-primary/20" />
          <div className="space-y-2 bg-white p-4 rounded-2xl rounded-tl-none border border-outline/20 shadow-sm max-w-md w-full">
            <SkeletonLine width="w-3/4" height="h-4" />
            <SkeletonLine width="w-full" height="h-4" />
            <SkeletonLine width="w-1/2" height="h-4" />
          </div>
        </div>

        {/* User Message 1 */}
        <div className="flex items-start justify-end gap-3">
          <div className="space-y-2 bg-primary/10 p-4 rounded-2xl rounded-tr-none border border-primary/20 max-w-sm w-full">
            <SkeletonLine width="w-5/6" height="h-4" />
            <SkeletonLine width="w-2/3" height="h-4" />
          </div>
          <SkeletonCircle size="w-9 h-9" />
        </div>

        {/* Assistant Thinking Animation Message */}
        <div className="flex items-start gap-3">
          <SkeletonCircle size="w-9 h-9" className="bg-primary/20" />
          <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-outline/20 shadow-sm flex items-center gap-3">
            <div className="flex gap-1.5 items-center">
              <span className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2.5 h-2.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-onSurfaceVariant font-medium animate-pulse">Thinking & grounding answers...</span>
          </div>
        </div>
      </div>

      {/* Input Placeholder Skeleton */}
      <div className="flex items-center gap-3">
        <SkeletonBox className="flex-1 h-12 rounded-full" />
        <SkeletonCircle size="w-12 h-12" />
      </div>
    </div>
  );
};

export default ChatSkeleton;
