import React from 'react';
import { useNavigate } from 'react-router-dom';

const MatchCard = ({ club, index }) => {
  const navigate = useNavigate();

  const isEvent = club.type === 'Event';
  const isClub = club.type === 'Club';
  const isComm = club.type === 'Committee';

  const imageUrl = club.image_url || club.poster || club.logo_url;

  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl overflow-hidden shadow-elevation1 hover:shadow-elevation2 hover:border-primary/40 transition-all duration-200 ease-out stagger-item stagger-delay-${(index % 8) + 1} flex flex-col justify-between group`}
    >
      <div>
        {/* Banner / Poster Header */}
        {imageUrl ? (
          <div className="relative h-40 w-full overflow-hidden bg-surfaceContainerLow">
            <img
              src={imageUrl}
              alt={club.name || club.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            {/* Fallback container if image fails to load */}
            <div className="hidden absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/20 items-center justify-center p-4">
              <span className="material-symbols-outlined text-4xl text-primary/60">
                {isEvent ? 'event' : isClub ? 'groups' : 'account_balance'}
              </span>
            </div>
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-surface/90 text-onSurface shadow-xs backdrop-blur-xs">
                <span className="material-symbols-outlined text-[14px] align-middle select-none mr-1 text-primary">
                  {isEvent ? 'event' : isClub ? 'groups' : 'school'}
                </span>
                {club.category || club.type}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-surfaceContainerLow p-4 flex flex-col justify-between relative border-b border-surfaceVariant/50">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primaryContainer text-onPrimaryContainer">
                <span className="material-symbols-outlined text-[14px] align-middle select-none mr-1">
                  {isEvent ? 'event' : isClub ? 'groups' : 'account_balance'}
                </span>
                {club.category || club.type}
              </span>
              <span className="text-[11px] text-onSurfaceVariant font-bold uppercase tracking-wider">
                SCE Campus
              </span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-3xl opacity-80">
                {isEvent ? 'calendar_month' : isClub ? 'diversity_3' : 'stars'}
              </span>
              <span className="text-xs font-bold text-onSurfaceVariant">
                {isEvent ? 'Campus Event' : isClub ? 'Student Club' : 'College Committee'}
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-onSurface mb-2 line-clamp-1 text-left group-hover:text-primary transition-colors">
            {club.name || club.title}
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-onSurfaceVariant leading-relaxed line-clamp-2 text-left mb-4">
            {club.short_description || club.description || 'Join and participate in campus activities at Saranathan College of Engineering.'}
          </p>

          {/* Info Rows */}
          <div className="space-y-2 mb-4 font-sans text-xs text-onSurfaceVariant text-left bg-surfaceContainerLow/50 p-3 rounded-xl border border-outline/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary align-middle select-none flex-shrink-0">location_on</span>
              <span className="truncate">{club.venue || club.meeting_location || club.location || 'SCE Campus'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary align-middle select-none flex-shrink-0">schedule</span>
              <span className="truncate">{club.timings || club.meeting_schedule || 'Check details'}</span>
            </div>
            {isEvent && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary align-middle select-none flex-shrink-0">how_to_reg</span>
                <span>Registrations: <strong>{club.registration_count || 0}</strong> / {club.capacity || 'Unlimited'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={() => navigate(`/club-event/${club.id}`)}
          className="w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none shadow-xs hover:shadow-elevation1"
        >
          <span>{isEvent ? 'View Event & Register' : 'View Club Details'}</span>
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
