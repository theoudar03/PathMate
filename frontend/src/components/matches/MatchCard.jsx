import React from 'react';
import { ArrowRight, Compass, Calendar, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MatchCard = ({ club, index }) => {
  const navigate = useNavigate();

  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl p-5 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/30 transition-all duration-200 ease-out stagger-item stagger-delay-${(index % 8) + 1} flex flex-col justify-between`}
    >
      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondaryContainer text-onSecondaryContainer">
            <span className="material-symbols-outlined text-[14px] align-middle select-none mr-1">explore</span>
            {club.category}
          </span>
          <span className="text-xs text-onSurfaceVariant font-medium">
            SCE
          </span>
        </div>

        <h3 className="text-lg font-bold text-onSurface mb-2 line-clamp-1 text-left">
          {club.name}
        </h3>

        {/* Intelligent Match Reason */}
        <div className="bg-surfaceContainerLow/85 rounded-xl p-3.5 border-l-4 border-warning mb-4 font-sans text-left">
          <span className="block text-[10px] font-bold text-onSurfaceVariant/85 uppercase tracking-wide mb-1">
            Why this matches you
          </span>
          <p className="text-xs text-onSurface leading-relaxed">
            {club.reason}
          </p>
        </div>

        {/* Info Rows */}
        <div className="space-y-2 mb-5 font-sans text-xs text-onSurfaceVariant text-left">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary align-middle select-none flex-shrink-0">location_on</span>
            <span className="truncate">{club.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary align-middle select-none flex-shrink-0">calendar_today</span>
            <span className="truncate">{club.timings}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => navigate(`/club-event/${club.id}`)}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none shadow-sm hover:shadow-elevation1"
      >
        <span>View Registration Steps</span>
        <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_forward</span>
      </button>
    </div>
  );
};

export default MatchCard;
