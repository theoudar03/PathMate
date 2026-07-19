import React from 'react';
import MatchCard from './MatchCard';
import { HelpCircle } from 'lucide-react';

const MatchList = ({ clubs = [] }) => {
  if (clubs.length === 0) {
    return (
      <div className="bg-surface border border-customBorder rounded-xl p-8 text-center max-w-md mx-auto">
        <HelpCircle className="w-12 h-12 text-textSecondary mx-auto mb-4" />
        <h3 className="text-lg font-serif font-semibold text-primary mb-2">
          No matches found
        </h3>
        <p className="text-sm font-sans text-textSecondary leading-relaxed">
          Please update your interests in onboarding to receive recommendations for SCE clubs and student societies.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clubs.map((club, index) => (
        <MatchCard key={club.id} club={club} index={index} />
      ))}
    </div>
  );
};

export default MatchList;
