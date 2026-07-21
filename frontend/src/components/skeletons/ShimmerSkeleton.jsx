import React from 'react';

export const SkeletonBox = ({ className = '', style = {} }) => (
  <div
    className={`animate-shimmer rounded-xl ${className}`}
    style={{
      backgroundColor: '#E2E8F0',
      ...style,
    }}
  />
);

export const SkeletonCircle = ({ size = 'w-10 h-10', className = '' }) => (
  <div
    className={`animate-shimmer rounded-full flex-shrink-0 ${size} ${className}`}
    style={{ backgroundColor: '#E2E8F0' }}
  />
);

export const SkeletonLine = ({ width = 'w-full', height = 'h-4', className = '' }) => (
  <div
    className={`animate-shimmer rounded-md ${width} ${height} ${className}`}
    style={{ backgroundColor: '#E2E8F0' }}
  />
);

export default {
  SkeletonBox,
  SkeletonCircle,
  SkeletonLine,
};
