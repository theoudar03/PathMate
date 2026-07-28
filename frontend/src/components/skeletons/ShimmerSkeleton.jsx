import React from 'react';

export const SkeletonBox = ({ className = '', style = {} }) => (
  <div
    className={`animate-shimmer bg-surfaceVariant/40 rounded-xl ${className}`}
    style={style}
  />
);

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <div
    className={`animate-shimmer bg-surfaceVariant/40 rounded-full flex-shrink-0 ${size} ${className}`}
  />
);

export const SkeletonLine = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div
    className={`animate-shimmer bg-surfaceVariant/40 rounded-md ${width} ${height} ${className}`}
  />
);

export default {
  SkeletonBox,
  SkeletonCircle,
  SkeletonLine,
};
