import React, { useState, useEffect } from 'react';

// Global cache to avoid check latency on every icon mount
let isFontReadyCached = false;

if (typeof document !== 'undefined' && document.fonts) {
  isFontReadyCached = document.fonts.check('1em "Material Symbols Outlined"');
}

export const useFontLoader = () => {
  const [isReady, setIsReady] = useState(isFontReadyCached);

  useEffect(() => {
    if (isReady) return;

    if (!document.fonts) {
      setIsReady(true);
      isFontReadyCached = true;
      return;
    }

    let active = true;

    const checkFont = () => {
      if (document.fonts.check('1em "Material Symbols Outlined"')) {
        if (active) {
          setIsReady(true);
          isFontReadyCached = true;
        }
        return true;
      }
      return false;
    };

    if (checkFont()) return;

    // Check again when ready resolves
    document.fonts.ready.then(() => {
      checkFont();
    });

    // Check on change events as fallback
    const handleLoadingDone = () => {
      checkFont();
    };

    document.fonts.addEventListener('loadingdone', handleLoadingDone);
    return () => {
      active = false;
      document.fonts.removeEventListener('loadingdone', handleLoadingDone);
    };
  }, [isReady]);

  return isReady;
};

/**
 * Reusable MaterialIcon component wrapper.
 * Prevents FOUT (Flash of Unstyled Text) by displaying a pulsing circular
 * skeleton placeholder until the icon font is fully loaded and ready to draw.
 */
export const MaterialIcon = ({ name, className = '', style = {}, size }) => {
  const isReady = useFontLoader();

  // If a size prop is passed, use it; otherwise, inspect class names for text-[size]
  let inlineSize = size;
  if (!inlineSize) {
    const sizeMatch = className.match(/text-\[(\d+)px\]/);
    if (sizeMatch) {
      inlineSize = parseInt(sizeMatch[1], 10);
    }
  }
  // Default fallback size for icons
  const iconSize = inlineSize || 20;

  if (!isReady) {
    return (
      <span
        className={`inline-block rounded-full bg-slate-200/45 dark:bg-slate-700/40 animate-pulse ${className}`}
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          verticalAlign: 'middle',
          ...style
        }}
      />
    );
  }

  return (
    <span
      className={`material-symbols-outlined select-none ${className}`}
      style={{
        fontSize: size ? `${size}px` : undefined,
        verticalAlign: 'middle',
        ...style
      }}
    >
      {name}
    </span>
  );
};

export default MaterialIcon;
