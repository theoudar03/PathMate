import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

const EmptyState = ({
  icon: IconComponent = Sparkles,
  title = "No Data Found",
  description = "No items available to display right now.",
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-surfaceContainerLowest border border-surfaceVariant/60 rounded-3xl p-10 text-center max-w-md mx-auto shadow-xs my-6 space-y-4 font-sans select-none animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
        <IconComponent size={28} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-black text-onSurface leading-snug">{title}</h3>
        <p className="text-xs text-onSurfaceVariant leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primaryHover text-white text-xs font-black shadow-md transition-all active:scale-[0.98]"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
