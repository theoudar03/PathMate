import React from 'react';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DigestBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-primaryContainer text-onPrimaryContainer border border-outline/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sans relative overflow-hidden">
      <div className="flex gap-4 items-start pl-2 text-left">
        <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mt-0.5 flex-shrink-0">campaign</span>
        <div>
          <span className="text-xs font-bold text-primary block uppercase tracking-wider">
            Weekly freshers digest
          </span>
          <h2 className="text-lg font-bold text-onPrimaryContainer mt-1 leading-snug">
            Welcome to Saranathan College of Engineering!
          </h2>
          <p className="text-xs text-onPrimaryContainer/80 mt-1 max-w-xl leading-relaxed">
            First-year orientation begins <strong className="text-onPrimaryContainer">Monday, Aug 3</strong> at 9:00 AM in Santhanam Auditorium. Review your onboarding matches and complete document clearing before arrival.
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 w-full md:w-auto pl-2 md:pl-0 text-left">
        <button
          type="button"
          onClick={() => navigate('/timeline')}
          className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary font-bold text-xs py-2.5 px-5 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary shadow-sm"
        >
          <span>View Onboarding Timeline</span>
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default DigestBanner;
