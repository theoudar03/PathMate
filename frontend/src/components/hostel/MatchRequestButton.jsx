import React from 'react';
import { Mail } from 'lucide-react';

const MatchRequestButton = ({ roommateId, email, name }) => {
  // Assign a random Saranathan mail ID if one doesn't exist
  const mailId = email || (name ? `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@saranathan.ac.in` : 'student@saranathan.ac.in');

  return (
    <a
      href={`mailto:${mailId}`}
      className="w-full py-2.5 px-4 rounded-full text-xs font-bold bg-primary hover:bg-[#123669] text-onPrimary shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none"
    >
      <span className="material-symbols-outlined text-[16px] align-middle select-none">mail</span>
      <span>Send Mail to Connect</span>
    </a>
  );
};

export default MatchRequestButton;
