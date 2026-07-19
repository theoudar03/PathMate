import React from 'react';
import { Home, Shield, Compass, MapPin, User } from 'lucide-react';
import MatchRequestButton from './MatchRequestButton';

const RoommateCard = ({ roommate, index }) => {
  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl p-5 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/30 transition-all duration-200 ease-out flex flex-col justify-between stagger-item stagger-delay-${(index % 8) + 1}`}
    >
      <div>
        {/* Card Header Profile Summary */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="text-left">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="inline-flex items-center gap-1 bg-secondaryContainer text-onSecondaryContainer px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                {roommate.branch} Student
              </span>
              <span className="text-[10px] font-sans font-semibold text-onSurfaceVariant flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px] text-primary align-middle select-none">location_on</span>
                {roommate.origin}
              </span>
            </div>
            
            <h3 className="text-base font-bold text-onSurface mb-1">
              {roommate.name}
            </h3>
            
            <strong className="text-onSurfaceVariant text-[11px] font-medium block mt-3 mb-1">Shared Interests:</strong>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {roommate.interests.map(interest => (
                <span
                  key={interest}
                  className="px-2 py-0.5 bg-secondaryContainer text-onSecondaryContainer rounded-full text-[10px] font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice & Request Trigger */}
      <div className="space-y-3 mt-3 text-left">
        <div className="flex gap-1.5 items-start bg-surfaceContainerLow rounded-xl p-3 border border-surfaceVariant/60 text-[10px] text-onSurfaceVariant leading-normal">
          <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0 select-none">shield</span>
          <p>
            <strong className="font-bold text-onSurface">Privacy Safeguard:</strong> This student has opted-in. Contact info is locked until you both agree.
          </p>
        </div>

        <MatchRequestButton roommateId={roommate.id} email={roommate.email} name={roommate.name} />
      </div>
    </div>
  );
};

export default RoommateCard;
