import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import MatchCard from '../components/matches/MatchCard';

const ClubsEvents = () => {
  const { getMatchedClubs } = useApp();
  const [filterType, setFilterType] = useState('All'); // 'All', 'Club', 'Event'

  const allMatches = getMatchedClubs();

  // Filter based on selected Segmented Button
  const filteredMatches = allMatches.filter(item => {
    if (filterType === 'All') return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-6 border-b border-outline/30">
        <div>
          <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Recommendations
          </span>
          <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            Curated Clubs & Events
          </h1>
          <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
            Discover and join extracurricular communities. These matches are curated based on your onboarding profile and department interests.
          </p>
        </div>

        {/* Gemini stamp */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-bold text-amber-700 select-none flex-shrink-0">
          <span className="material-symbols-outlined text-[15px] align-middle select-none" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <span>Gemini Ranked</span>
        </div>
      </div>

      {/* Filter Segmented Button Controls */}
      <div className="flex justify-start">
        <div className="inline-flex border border-outline/40 rounded-full p-1 bg-white" role="group" aria-label="Filter matches by type"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {['All', 'Club', 'Event', 'Committee'].map(type => {
            const isSelected = filterType === type;
            const displayLabel = type === 'All' ? 'All Matches' : type === 'Club' ? 'Clubs Only' : type === 'Event' ? 'Events Only' : 'Committees Only';
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                  isSelected
                    ? 'bg-primaryContainer text-primary shadow-sm'
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
        <div className="bg-white border border-outline/40 rounded-[20px] p-12 text-center max-w-md mx-auto"
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(15,23,42,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl bg-surfaceContainer flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px] text-onSurfaceVariant select-none">explore</span>
          </div>
          <h4 className="text-sm font-bold text-onSurface">No matching items</h4>
          <p className="text-xs text-onSurfaceVariant mt-1 leading-relaxed">
            There are no {filterType.toLowerCase()} matching items computed for your current interests.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClubsEvents;

