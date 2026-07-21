import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import MatchCard from '../components/matches/MatchCard';
import EmptyState from '../components/common/EmptyState';
import ToastSnackbar from '../components/common/ToastSnackbar';
import { Sparkles } from 'lucide-react';

const ClubsEvents = () => {
  const { getMatchedClubs } = useApp();
  const [filterType, setFilterType] = useState('All');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const allMatches = getMatchedClubs();

  const filteredMatches = allMatches.filter(item => {
    if (filterType === 'All') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-outline/30">
        <div>
          <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Saranathan Student Communities
          </span>
          <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            Curated Clubs & Campus Events
          </h1>
          <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
            Discover and join extracurricular communities. Matches are dynamically curated based on your academic interests.
          </p>
        </div>

        {/* Gemini stamp */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-bold text-amber-700 select-none flex-shrink-0">
          <span className="material-symbols-outlined text-[15px] align-middle select-none" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span>Gemini AI Ranked</span>
        </div>
      </div>

      {/* Filter Segmented Button Controls */}
      <div className="flex justify-start">
        <div className="inline-flex border border-outline/40 rounded-full p-1 bg-white shadow-xs" role="group">
          {['All', 'Club', 'Event', 'Committee'].map(type => {
            const isSelected = filterType === type;
            const displayLabel = type === 'All' ? 'All Matches' : type === 'Club' ? 'Clubs Only' : type === 'Event' ? 'Events Only' : 'Committees Only';
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all duration-150 ${
                  isSelected
                    ? 'bg-primaryContainer text-primary shadow-xs'
                    : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((item, idx) => (
            <MatchCard key={item.id} club={item} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title={`No ${filterType} matches found`}
          description="Try selecting a different filter category or update your academic interests in your profile."
          actionLabel="View All Matches"
          onAction={() => setFilterType('All')}
        />
      )}

      <ToastSnackbar
        isOpen={showToast}
        message={toastMessage}
        type="success"
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ClubsEvents;
