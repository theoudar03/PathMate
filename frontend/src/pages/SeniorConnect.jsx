import React, { useState } from 'react';
import { useApp, SENIOR_MENTORS } from '../contexts/AppContext';
import SeniorConnectCard from '../components/senior/SeniorConnectCard';
import { GraduationCap, Search, Shield, HelpCircle } from 'lucide-react';

const SeniorConnect = () => {
  const [branchFilter, setBranchFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all unique areas for filtering
  const allAreas = Array.from(
    new Set(SENIOR_MENTORS.flatMap(sr => sr.areas))
  );

  // Filter seniors list
  const filteredSeniors = SENIOR_MENTORS.filter(sr => {
    const matchesBranch = branchFilter === 'All' || sr.branch === branchFilter;
    
    const matchesArea = areaFilter === 'All' || sr.areas.includes(areaFilter);

    const matchesSearch = searchQuery === '' || 
      sr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sr.areas.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesBranch && matchesArea && matchesSearch;
  });

  return (
    <div className="space-y-12 font-sans animate-fade-in text-left py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surfaceVariant pb-6">
        <span className="text-xs text-onSurfaceVariant font-medium">
          Student Network
        </span>
        <h1 className="text-3xl font-extrabold text-primary mt-1 flex items-center">
          <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mr-2">school</span>
          Senior Connect Network
        </h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          Get advice from upperclassmen about labs, campus hacks, exam preparation, and placements. Connect securely via their academic email.
        </p>
      </div>

      {/* Intro Note */}
      <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
        <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">shield</span>
        <div>
          <strong className="text-onSurface font-semibold block">SCE Peer Mentoring Policy:</strong>
          These seniors are verified members of the student council or NSS coordinators. They have voluntarily opted-in to receive academic queries. Please maintain absolute professionalism in your emails.
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-surfaceVariant rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 font-sans text-xs shadow-elevation1">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-onSurfaceVariant absolute left-3 top-3.5 text-[18px] select-none">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search senior by name or advisory skill (e.g. Placement, Gate, NSS)..."
            className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg font-sans text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-onSurface"
          />
        </div>

        {/* Filter select tags */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="w-full sm:w-auto">
            <label htmlFor="sr-filter-branch" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Mentor department
            </label>
            <select
              id="sr-filter-branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 border border-outline rounded-lg font-sans text-xs focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-onSurface font-semibold outline-none"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="IT">IT</option>
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label htmlFor="sr-filter-area" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">
              Advisory area
            </label>
            <select
              id="sr-filter-area"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 border border-outline rounded-lg font-sans text-xs focus:border-primary focus:ring-1 focus:ring-primary bg-surface text-onSurface font-semibold outline-none"
            >
              <option value="All">All Specialities</option>
              {allAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mentors Grid */}
      {filteredSeniors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSeniors.map((senior, idx) => (
            <SeniorConnectCard key={senior.id} senior={senior} index={idx} />
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-surfaceVariant rounded-xl p-12 text-center max-w-md mx-auto shadow-elevation1">
          <span className="material-symbols-outlined text-[40px] text-onSurfaceVariant select-none mx-auto mb-3">help</span>
          <h3 className="text-base font-bold text-primary mb-2">
            No seniors match your query
          </h3>
          <p className="text-xs font-sans text-onSurfaceVariant leading-relaxed">
            Try adjusting your search terms or selecting "All Departments" to see other peer mentors.
          </p>
        </div>
      )}
    </div>
  );
};

export default SeniorConnect;

