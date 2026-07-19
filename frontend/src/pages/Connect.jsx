import React, { useState } from 'react';
import { useApp, POTENTIAL_ROOMMATES, SENIOR_MENTORS } from '../contexts/AppContext';
import RoommateCard from '../components/hostel/RoommateCard';
import SeniorConnectCard from '../components/senior/SeniorConnectCard';

const Connect = () => {
  const { studentData, completeOnboarding, t } = useApp();
  const [activeTab, setActiveTab] = useState('roommate'); // 'roommate' | 'senior'

  // --- Roommate Finder state ---
  const [branchFilter, setBranchFilter] = useState('All');
  const [sleepFilter, setSleepFilter] = useState('All');
  const [roommateSearch, setRoommateSearch] = useState('');
  const isHosteller = studentData.isHosteller;

  const handleOptIn = () => {
    if (confirm(t('confirmOptInHostel'))) {
      const updatedData = { ...studentData, isHosteller: true };
      completeOnboarding(updatedData);
    }
  };

  const filteredRoommates = POTENTIAL_ROOMMATES.filter(rm => {
    const matchesBranch = branchFilter === 'All' || rm.branch === branchFilter;
    const matchesSleep = sleepFilter === 'All' ||
      (sleepFilter === 'Early' && rm.sleepHabits.includes('Early')) ||
      (sleepFilter === 'Late' && rm.sleepHabits.includes('Night'));
    const matchesSearch = roommateSearch === '' ||
      rm.name.toLowerCase().includes(roommateSearch.toLowerCase()) ||
      rm.origin.toLowerCase().includes(roommateSearch.toLowerCase());
    return matchesBranch && matchesSleep && matchesSearch;
  });

  // --- Senior Connect state ---
  const [branchSrFilter, setBranchSrFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [seniorSearch, setSeniorSearch] = useState('');

  const allAreas = Array.from(new Set(SENIOR_MENTORS.flatMap(sr => sr.areas)));

  const filteredSeniors = SENIOR_MENTORS.filter(sr => {
    const matchesBranch = branchSrFilter === 'All' || sr.branch === branchSrFilter;
    const matchesArea = areaFilter === 'All' || sr.areas.includes(areaFilter);
    const matchesSearch = seniorSearch === '' ||
      sr.name.toLowerCase().includes(seniorSearch.toLowerCase()) ||
      sr.areas.some(a => a.toLowerCase().includes(seniorSearch.toLowerCase()));
    return matchesBranch && matchesArea && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans animate-fade-in text-left py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surfaceVariant pb-6">
        <span className="text-xs text-onSurfaceVariant font-medium">{t('mentorLabel')}</span>
        <h1 className="text-3xl font-extrabold text-primary mt-1 flex items-center">
          <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mr-2">groups</span>
          {t('connect')}
        </h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          {t('connectSubtitle')}
        </p>
      </div>

      {/* M3 Segmented Tab Switcher */}
      <div className="inline-flex border border-outline rounded-full p-0.5 bg-surface" role="tablist" aria-label="Connect sections">
        {[
          { id: 'roommate', label: t('roommateMatchTitle'), icon: 'group' },
          { id: 'senior', label: t('mentorLabel'), icon: 'school' },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                isActive
                  ? 'bg-primaryContainer text-onPrimaryContainer shadow-sm'
                  : 'text-onSurfaceVariant hover:bg-surfaceVariant/50'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] select-none">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* === ROOMMATE FINDER TAB === */}
      {activeTab === 'roommate' && (
        <div className="space-y-6 animate-fade-in">
          {!isHosteller ? (
            <div className="max-w-2xl mx-auto bg-surface border border-outline/25 rounded-2xl p-8 text-center space-y-5 shadow-elevation1">
              <span className="material-symbols-outlined text-[52px] text-primary select-none mx-auto block">home</span>
              <h2 className="text-xl font-bold text-onSurface">{t('dayScholarOptInTitle')}</h2>
              <p className="text-sm text-onSurfaceVariant leading-relaxed max-w-lg mx-auto">
                {t('dayScholarOptInDesc')}
              </p>
              <button
                type="button"
                onClick={handleOptIn}
                className="inline-flex items-center gap-2 bg-primary hover:bg-[#123669] text-onPrimary text-sm font-semibold py-3 px-6 rounded-full transition-all shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-[18px] select-none">check</span>
                {t('optInHostelBtn')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Privacy note */}
              <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
                <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">shield</span>
                <div>
                  <strong className="font-semibold block text-onSurface">{t('hostelPrivacyTitle')}</strong>
                  {t('hostelPrivacyDesc')}
                </div>
              </div>

              {/* Filter Bar */}
              <div className="bg-surface border border-surfaceVariant rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs shadow-elevation1">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined text-onSurfaceVariant absolute left-3 top-3.5 text-[18px] select-none">search</span>
                  <input
                    type="text"
                    value={roommateSearch}
                    onChange={(e) => setRoommateSearch(e.target.value)}
                    placeholder={t('rmSearchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-onSurface"
                  />
                </div>
                <div className="flex gap-3">
                  <div>
                    <label htmlFor="rm-filter-branch" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">{t('enggDept')}</label>
                    <select id="rm-filter-branch" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                      className="px-3 py-2 border border-outline rounded-lg text-xs focus:border-primary bg-surface text-onSurface font-semibold outline-none">
                      <option value="All">{t('filterAll')} {t('deptsHighlight')}</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="AI&DS">AI&DS</option>
                      <option value="CSBS">CSBS</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rm-filter-sleep" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">{t('filterSleepLabel')}</label>
                    <select id="rm-filter-sleep" value={sleepFilter} onChange={(e) => setSleepFilter(e.target.value)}
                      className="px-3 py-2 border border-outline rounded-lg text-xs focus:border-primary bg-surface text-onSurface font-semibold outline-none">
                      <option value="All">{t('filterSchedules')}</option>
                      <option value="Early">{t('filterSleepEarly')}</option>
                      <option value="Late">{t('filterSleepLate')}</option>
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
                  <h3 className="text-base font-bold text-primary mb-2">{t('rmNoResultsTitle')}</h3>
                  <p className="text-xs text-onSurfaceVariant leading-relaxed">{t('rmNoResultsDesc')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* === SENIOR CONNECT TAB === */}
      {activeTab === 'senior' && (
        <div className="space-y-6 animate-fade-in">
          {/* Intro note */}
          <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
            <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">shield</span>
            <div>
              <strong className="text-onSurface font-semibold block">{t('peerMentoringTitle')}</strong>
              {t('peerMentoringDesc')}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface border border-surfaceVariant rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs shadow-elevation1">
            <div className="relative flex-1">
              <span className="material-symbols-outlined text-onSurfaceVariant absolute left-3 top-3.5 text-[18px] select-none">search</span>
              <input
                type="text"
                value={seniorSearch}
                onChange={(e) => setSeniorSearch(e.target.value)}
                placeholder={t('srSearchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-surface text-onSurface"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <label htmlFor="sr-filter-branch" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">{t('enggDept')}</label>
                <select id="sr-filter-branch" value={branchSrFilter} onChange={(e) => setBranchSrFilter(e.target.value)}
                  className="px-3 py-2 border border-outline rounded-lg text-xs focus:border-primary bg-surface text-onSurface font-semibold outline-none">
                  <option value="All">{t('filterAll')} {t('deptsHighlight')}</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="IT">IT</option>
                </select>
              </div>
              <div>
                <label htmlFor="sr-filter-area" className="block text-xs font-semibold text-onSurfaceVariant mb-1.5">{t('filterSpecialitiesLabel')}</label>
                <select id="sr-filter-area" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-3 py-2 border border-outline rounded-lg text-xs focus:border-primary bg-surface text-onSurface font-semibold outline-none">
                  <option value="All">{t('filterSpecialities')}</option>
                  {allAreas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seniors Grid */}
          {filteredSeniors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeniors.map((senior, idx) => (
                <SeniorConnectCard key={senior.id} senior={senior} index={idx} />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-surfaceVariant rounded-xl p-12 text-center max-w-md mx-auto shadow-elevation1">
              <span className="material-symbols-outlined text-[40px] text-onSurfaceVariant select-none mx-auto mb-3">help</span>
              <h3 className="text-base font-bold text-primary mb-2">{t('srNoResultsTitle')}</h3>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">{t('srNoResultsDesc')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Connect;

