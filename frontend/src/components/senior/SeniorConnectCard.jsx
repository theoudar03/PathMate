import React from 'react';
import { Mail, GraduationCap, Award, HelpCircle } from 'lucide-react';

const SeniorConnectCard = ({ senior, index }) => {
  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl p-5 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/30 transition-all duration-200 ease-out flex flex-col justify-between stagger-item stagger-delay-${(index % 8) + 1}`}
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="inline-flex items-center gap-1 bg-secondaryContainer text-onSecondaryContainer px-2.5 py-0.5 rounded-full text-[10px] font-bold">
            {senior.branch} Mentor
          </span>
          <span className="text-[10px] font-sans font-semibold text-onSurfaceVariant flex items-center gap-0.5">
            <span className="material-symbols-outlined text-primary text-[14px] align-middle select-none">school</span>
            {senior.year}
          </span>
        </div>

        {/* Details */}
        <h3 className="text-base font-bold text-onSurface mb-1 text-left">
          {senior.name}
        </h3>
        
        {/* Mentorship Topics */}
        <div className="my-3 font-sans text-xs text-left">
          <span className="text-onSurfaceVariant block mb-1.5 font-medium">Guides freshers in:</span>
          <div className="flex flex-wrap gap-1">
            {senior.areas.map(topic => (
              <span
                key={topic}
                className="px-2 py-0.5 bg-secondaryContainer text-onSecondaryContainer rounded-full text-[10px] font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Senior Peer Tip */}
        <div className="bg-surfaceContainerLow/85 rounded-xl p-3.5 border-l-4 border-warning my-4 font-sans text-xs text-left">
          <span className="block text-[10px] font-bold text-onSurfaceVariant/85 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[16px] align-middle select-none">military_tech</span>
            Senior peer tip
          </span>
          <p className="text-onSurfaceVariant italic leading-relaxed">
            "{senior.tip}"
          </p>
        </div>
      </div>

      {/* Action Shortcut */}
      <a
        href={`mailto:${senior.contact}?subject=PathMate Freshman Inquiry`}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-4 rounded-full transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none shadow-sm mt-2"
      >
        <span className="material-symbols-outlined text-[16px] align-middle select-none">mail</span>
        <span>Send Mentorship Email</span>
      </a>
    </div>
  );
};

export default SeniorConnectCard;
