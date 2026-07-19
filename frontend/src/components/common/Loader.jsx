import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';

const LOADING_STEPS = [
  "Analyzing your department preferences...",
  "Searching the Saranathan clubs registry...",
  "Grounded AI matching with SCE societies...",
  "Preparing your personalized Study Hub resources..."
];

const Loader = ({ active = false }) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-primary/95 backdrop-blur-sm text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Loading recommendation results"
    >
      <div className="flex flex-col items-center max-w-sm text-center space-y-6">
        {/* Animated Icon Container */}
        <div className="relative">
          {/* Pulsing ring outer */}
          <div className="absolute inset-0 rounded-2xl bg-accent/20 animate-ping" />
          
          {/* Main logo block */}
          <div className="relative w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-primary shadow-lg border border-accent-hover">
            <Landmark className="w-8 h-8 fill-current" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-2 font-sans">
          <h3 className="text-lg font-bold text-accent">
            Creating Your Portal
          </h3>
          <p className="text-sm text-gray-300 min-h-[40px] leading-relaxed transition-all duration-300">
            {LOADING_STEPS[stepIndex]}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-1.5 justify-center items-center" aria-hidden="true">
          <span className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default Loader;
