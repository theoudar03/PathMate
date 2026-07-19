import React from 'react';

/**
 * BrandedSplashLoader is a premium Material Design 3 compliant full-screen
 * splash loader. It features a pulsing logo, clean typography matching the
 * institutional brand, and an animated linear progress bar.
 */
export const BrandedSplashLoader = () => {
  return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center z-50 p-6 font-sans">
      <div className="flex flex-col items-center max-w-sm w-full text-center space-y-6 animate-fade-in">
        {/* Animated Brand Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary text-onPrimary flex items-center justify-center shadow-elevation2 animate-pulse">
          <span className="material-symbols-outlined text-[36px] select-none text-onPrimary font-bold">
            account_balance
          </span>
        </div>

        {/* Brand Labels */}
        <div className="space-y-1">
          <h2 className="text-xs font-black tracking-widest text-onSurfaceVariant uppercase leading-none">
            Saranathan College of Engineering
          </h2>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase leading-none pt-0.5">
            PathMate
          </h1>
          <span className="inline-block text-[9px] text-primary bg-primaryContainer/50 border border-primary/10 px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase mt-1.5">
            Freshers Portal
          </span>
        </div>

        {/* Animated Linear Progress Bar (MD3 Style) */}
        <div className="w-48 h-1 bg-surfaceVariant rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-primary w-2/5 rounded-full animate-indeterminate-bar" />
        </div>

        {/* Loader Caption */}
        <p className="text-xs text-onSurfaceVariant font-bold tracking-wide animate-pulse">
          Preparing your PathMate experience...
        </p>
      </div>

      {/* Embedded bar animation styling */}
      <style>{`
        @keyframes indeterminate-bar {
          0% {
            left: -40%;
            width: 40%;
          }
          50% {
            left: 20%;
            width: 60%;
          }
          100% {
            left: 100%;
            width: 40%;
          }
        }
        .animate-indeterminate-bar {
          animation: indeterminate-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default BrandedSplashLoader;
