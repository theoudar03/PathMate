import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { safeFetchJson } from '../utils/api';
import RoommateCard from '../components/hostel/RoommateCard';
import SeniorConnectCard from '../components/senior/SeniorConnectCard';

const Connect = () => {
  const { studentData, completeOnboarding, t } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    return studentData?.isHosteller ? 'roommate' : 'senior';
  });

  // Dynamic DB Datasets
  const [roommates, setRoommates] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [loadingRoommates, setLoadingRoommates] = useState(true);
  const [loadingSeniors, setLoadingSeniors] = useState(true);

  // Roommate form (kept for any future use but hidden from student UI)
  const [rmHostel, setRmHostel] = useState('Boys Hostel');
  const [rmSleep, setRmSleep] = useState('10 PM - 6 AM');
  const [rmInterests, setRmInterests] = useState('Coding, Gaming, Badminton');
  const [rmEmail, setRmEmail] = useState('');
  const [submittingRm, setSubmittingRm] = useState(false);

  // Filters
  const [branchFilter, setBranchFilter] = useState('All');
  const [roommateSearch, setRoommateSearch] = useState('');
  const [branchSrFilter, setBranchSrFilter] = useState('All');
  const [seniorSearch, setSeniorSearch] = useState('');

  const fetchRoommates = async () => {
    setLoadingRoommates(true);
    try {
      const res = await safeFetchJson('/api/roommates');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setRoommates(list);
    } catch (e) {
      console.error("Failed to fetch roommates:", e);
      setRoommates([]);
    } finally {
      setLoadingRoommates(false);
    }
  };

  const fetchSeniors = async () => {
    setLoadingSeniors(true);
    try {
      const res = await safeFetchJson('/api/seniors');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setSeniors(list);
    } catch (e) {
      console.error("Failed to fetch seniors:", e);
      setSeniors([]);
    } finally {
      setLoadingSeniors(false);
    }
  };

  useEffect(() => {
    if (studentData?.isHosteller) {
      fetchRoommates();
    }
    fetchSeniors();
  }, [activeTab]);

  const handleRegisterSenior = async (e) => {
    e.preventDefault();
    if (!srName || !srDepartment) return;
    setSubmittingSr(true);

    const payload = {
      name: srName,
      department: srDepartment,
      year: srYear,
      skills: srSkills.split(',').map(s=>s.trim()).filter(Boolean),
      domains: srDomains.split(',').map(d=>d.trim()).filter(Boolean),
      email: srEmail,
      linkedin_url: srLinkedin,
      availability: srAvailability,
      mentor_status: 'active'
    };

    try {
      const res = await fetch('/api/seniors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchSeniors();
        setShowSeniorModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSr(false);
    }
  };

  const handleSaveRoommateProfile = async (e) => {
    e.preventDefault();
    if (!rmName || !rmDepartment || !rmHostel) return;
    setSubmittingRm(true);

    const payload = {
      name: rmName,
      gender: rmGender,
      department: rmDepartment,
      hostel_block: rmHostel,
      sleep_schedule: rmSleep,
      study_habits: rmHabits,
      cleanliness: rmCleanliness,
      food_preference: rmFood,
      interests: rmInterests.split(',').map(i=>i.trim()).filter(Boolean),
      contact_email: rmEmail,
      is_visible: true
    };

    try {
      const res = await fetch('/api/roommates/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchRoommates();
        setShowRoommateModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRm(false);
    }
  };

  const filteredRoommates = roommates.filter(rm => {
    const matchesBranch = branchFilter === 'All' || (rm.department && rm.department.includes(branchFilter));
    const matchesSearch = roommateSearch === '' ||
      rm.name.toLowerCase().includes(roommateSearch.toLowerCase()) ||
      rm.hostel_block.toLowerCase().includes(roommateSearch.toLowerCase()) ||
      rm.department.toLowerCase().includes(roommateSearch.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const filteredSeniors = seniors.filter(sr => {
    const srDept = sr.department || sr.branch || 'Engineering';
    const srName = sr.name || '';
    const matchesBranch = branchSrFilter === 'All' || srDept.toLowerCase().includes(branchSrFilter.toLowerCase());
    const matchesSearch = seniorSearch === '' ||
      srName.toLowerCase().includes(seniorSearch.toLowerCase()) ||
      srDept.toLowerCase().includes(seniorSearch.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans animate-fade-in text-left py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-surfaceVariant pb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-onSurfaceVariant font-medium">Saranathan College Peer Portal</span>
          <h1 className="text-3xl font-extrabold text-primary mt-1 flex items-center">
            <span className="material-symbols-outlined text-primary text-[32px] select-none align-middle mr-2">groups</span>
            Student Connect & Peer Mentorship
          </h1>
          <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
            Connect with verified senior student mentors or find compatible hostel roommates directly from live college records.
          </p>
        </div>

        <div />
      </div>

      {/* M3 Segmented Tab Switcher */}
      <div className="inline-flex border border-outline rounded-full p-0.5 bg-surface" role="tablist">
        {[
          { id: 'roommate', label: `Safe Roommate Finder (${roommates.length})`, icon: 'group', show: studentData?.isHosteller },
          { id: 'senior', label: `Senior Connect & Mentors (${seniors.length})`, icon: 'school', show: true },
        ].filter(tab => tab.show).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition-all ${
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
          {/* Privacy note */}
          <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
            <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">shield</span>
            <div>
              <strong className="font-semibold block text-onSurface">Hostel Verification & Privacy:</strong>
              All roommate profiles are dynamically loaded from PostgreSQL. Contact emails remain locked until a connection request is accepted.
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
                placeholder="Search roommates by name, department, or hostel block..."
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg text-sm focus:border-primary outline-none bg-surface text-onSurface"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}
                  className="px-3 py-2.5 border border-outline rounded-lg text-xs font-semibold bg-surface text-onSurface outline-none">
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics & Comm</option>
                  <option value="Information Technology">Information Tech</option>
                  <option value="AI">AI & Data Science</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roommates Grid */}
          {loadingRoommates ? (
            <div className="p-12 text-center text-gray-500 font-semibold">Loading roommate profiles from PostgreSQL...</div>
          ) : filteredRoommates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoommates.map((rm, idx) => (
                <RoommateCard key={rm.id} roommate={rm} index={idx} />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-surfaceVariant rounded-xl p-12 text-center max-w-md mx-auto shadow-elevation1">
              <span className="material-symbols-outlined text-[40px] text-onSurfaceVariant select-none mx-auto mb-3">group</span>
              <h3 className="text-base font-bold text-primary mb-2">No Roommates Found</h3>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">Try adjusting your department filter or search term.</p>
            </div>
          )}
        </div>
      )}

      {/* === SENIOR CONNECT TAB === */}
      {activeTab === 'senior' && (
        <div className="space-y-6 animate-fade-in">
          {/* Intro note */}
          <div className="bg-surfaceVariant/40 border border-outline/15 rounded-2xl p-4 flex gap-3 text-xs text-onSurfaceVariant leading-relaxed">
            <span className="material-symbols-outlined text-primary select-none text-[22px] flex-shrink-0 mt-0.5">school</span>
            <div>
              <strong className="text-onSurface font-semibold block">Verified SCE Senior Mentors:</strong>
              Senior students available for academic guidance, lab projects, hackathons, and placement advice.
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
                placeholder="Search mentors by name, department, or skill domain..."
                className="w-full pl-10 pr-4 py-2.5 border border-outline rounded-lg text-sm focus:border-primary outline-none bg-surface text-onSurface"
              />
            </div>
            <div className="flex gap-3">
              <div>
                <select value={branchSrFilter} onChange={(e) => setBranchSrFilter(e.target.value)}
                  className="px-3 py-2.5 border border-outline rounded-lg text-xs font-semibold bg-surface text-onSurface outline-none">
                  <option value="All">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics & Comm</option>
                  <option value="Information Technology">Information Tech</option>
                  <option value="Electrical">Electrical & Electronics</option>
                  <option value="AI">AI & Data Science</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seniors Grid */}
          {loadingSeniors ? (
            <div className="p-12 text-center text-gray-500 font-semibold">Loading senior mentors from PostgreSQL...</div>
          ) : filteredSeniors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeniors.map((senior, idx) => (
                <SeniorConnectCard key={senior.id} senior={senior} index={idx} />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-surfaceVariant rounded-xl p-12 text-center max-w-md mx-auto shadow-elevation1">
              <span className="material-symbols-outlined text-[40px] text-onSurfaceVariant select-none mx-auto mb-3">help</span>
              <h3 className="text-base font-bold text-primary mb-2">No Mentors Available Yet</h3>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">Senior mentors are added by college administration. Check back soon!</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Connect;
