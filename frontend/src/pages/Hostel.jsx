import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import RoommateCard from '../components/hostel/RoommateCard';
import { Home, Shield, Users, Search, HelpCircle, Check } from 'lucide-react';

const Hostel = () => {
  const [POTENTIAL_ROOMMATES, setRoommates] = useState([]);
  useEffect(() => { fetch('/api/roommates').then(r=>r.json()).then(setRoommates).catch(() => {}) }, []);
  const { studentData, completeOnboarding } = useApp();
  const [branchFilter, setBranchFilter] = useState('All');
  const [sleepFilter, setSleepFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isHosteller = studentData.isHosteller;

  const handleOptIn = () => {
    // Modify studentData to set hosteller to true
    const updatedData = {
      ...studentData,
      isHosteller: true
    };
    completeOnboarding(updatedData);
  };

  // Filter roommate roster
  const filteredRoommates = POTENTIAL_ROOMMATES.filter(rm => {
    // If user is hosteller, filter to only show profiles in the corresponding gender block
    // Since we don't capture gender explicitly, we determine appropriate blocks:
    // We can show all or show B-Block (Boys) / A-Block (Girls) based on the user's name or let it be open.
    // For general demonstration, let's show all profiles but allow filtering.
    
    const matchesBranch = branchFilter === 'All' || rm.branch === branchFilter;
    
    const matchesSleep = sleepFilter === 'All' || 
      (sleepFilter === 'Early' && rm.sleepHabits.includes('Early')) ||
      (sleepFilter === 'Late' && rm.sleepHabits.includes('Night'));

    const matchesSearch = searchQuery === '' || 
      rm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rm.origin.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesBranch && matchesSleep && matchesSearch;
  });

  return (
    <div className="space-y-12 font-sans animate-fade-in text-left py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surfaceVariant pb-6">
        <span className="text-xs text-onSurfaceVariant font-medium">
          Residential Life
        </span>
        <h1 className="text-3xl font-extrabold text-primary mt-1 flex items-center">
          <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mr-2">group</span>
          Hostel Roommate Finder
        </h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          Find peers with compatible sleeping schedules, study habits, and interests. Mutual consent is required before contact info is shared.
        </p>
      </div>

      {/* Day Scholar Fallback / Opt-In Panel */}
      {!isHosteller ? (
        <div className="max-w-2xl mx-auto bg-surface border border-outline/25 rounded-2xl p-8 text-center space-y-5 shadow-elevation1">
          <span className="material-symbols-outlined text-[52px] text-primary select-none mx-auto block">home</span>
          <h2 className="text-xl font-bold text-onSurface">
            You are registered as a Day Scholar
          </h2>
          <p className="text-sm text-onSurfaceVariant leading-relaxed max-w-lg mx-auto">
            Our roommate matchmaker is reserved for hostel residents. If you have recently changed your accommodation preference or want to test the mutual-consent connection system, click below to opt-in.
          </p>
          <button
            type="button"
            onClick={handleOptIn}
            className="inline-flex items-center gap-2 bg-primary hover:bg-[#123669] text-onPrimary text-sm font-semibold py-3 px-6 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] align-middle select-none">check</span>
            <span>Opt-In as Hostel Resident</span>
          </button>
        </div>
      ) : (
        /* Roommate search dashboard */
        <div className="space-y-6">
          {/* Privacy header callout */}
          <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
            <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">shield</span>
            <div>
              <strong className="font-semibold block text-onSurface">SCE Hostel Privacy Protocol:</strong>
              Your profile is visible only to other verified freshman hostel residents. When you click "Request to Connect", a secure invitation is sent. Your email will remain hidden until they request you back, establishing a mutual match.
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="bg-surface border border-surfaceVariant rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-sans text-xs shadow-elevation1">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-onSurfaceVariant absolute left-3 top-3.5 text-[18px] select-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roommate by name or hometown (e.g. Madurai, Salem)..."
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg font-sans text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-onSurface"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <div className="w-full sm:w-auto">
                <label htmlFor="filter-branch" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">
                  Filter department
                </label>
                <select
                  id="filter-branch"
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full sm:w-36 px-3 py-2 border border-outline rounded-lg font-sans text-xs focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-onSurface font-semibold outline-none"
                >
                  <option value="All">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="CSBS">CSBS</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <label htmlFor="filter-sleep" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">
                  Sleep schedule
                </label>
                <select
                  id="filter-sleep"
                  value={sleepFilter}
                  onChange={(e) => setSleepFilter(e.target.value)}
                  className="w-full sm:w-36 px-3 py-2 border border-outline rounded-lg font-sans text-xs focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-onSurface font-semibold outline-none"
                >
                  <option value="All">All Schedules</option>
                  <option value="Early">Early Risers</option>
                  <option value="Late">Night Owls</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roommates Grid */}
          {filteredRoommates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoommates.map((rm, idx) => (
                <RoommateCard key={rm.id} roommate={rm} index={idx} />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-surfaceVariant rounded-xl p-12 text-center max-w-md mx-auto shadow-elevation1">
              <span className="material-symbols-outlined text-[40px] text-onSurfaceVariant select-none mx-auto mb-3">group</span>
              <h3 className="text-base font-bold text-primary mb-2">
                No potential roommates match your criteria
              </h3>
              <p className="text-xs font-sans text-onSurfaceVariant leading-relaxed">
                Try widening your search tags, clearing the search input, or selecting "All Departments".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Hostel;

