import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import BusRouteWidget from '../components/dashboard/BusRouteWidget';
import ToastSnackbar from '../components/common/ToastSnackbar';

const Dashboard = () => {
  const { studentData, resetAllData, token } = useApp();
  const navigate = useNavigate();

  const name       = studentData?.name       || 'Freshman';
  const dept       = studentData?.department || 'Computer Science';
  const isHostel   = studentData?.isHosteller;
  const interests  = studentData?.interests  || [];

  // Initials for avatar
  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SD';

  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [showAllFaculty, setShowAllFaculty] = useState(false);
  const [deptRecord, setDeptRecord] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const match = data.find(d => d.name === dept || d.full_name?.toLowerCase().includes(dept.toLowerCase()));
          setDeptRecord(match || data[0]);
        }
      })
      .catch(()=>{});

    fetch('/api/notices')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotices(data.slice(0, 4)); })
      .catch(()=>{});

    fetch('/api/events')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEvents(data.slice(0, 3)); })
      .catch(()=>{});
  }, [dept]);

  const deptFullName = deptRecord?.full_name || dept;

  useEffect(() => {
    if (deptRecord?.id) {
      setLoadingFaculty(true);
      fetch(`/api/faculty/${deptRecord.id}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDbFaculty(data);
        })
        .catch(()=>{})
        .finally(() => setLoadingFaculty(false));
    }
  }, [deptRecord?.id, token]);

  const getDesignationWeight = (desig) => {
    const d = (desig || '').toLowerCase();
    if (d.includes('head') || d.includes('hod')) return 1;
    if (d.includes('professor') && !d.includes('assistant') && !d.includes('associate')) return 2;
    if (d.includes('associate professor') || d.includes('assoc')) return 3;
    if (d.includes('assistant professor') || d.includes('asst')) return 4;
    if (d.includes('lecturer')) return 5;
    return 6;
  };

  const sortedFaculty = [...dbFaculty].sort((a, b) => getDesignationWeight(a.designation) - getDesignationWeight(b.designation));
  const displayedFaculty = showAllFaculty ? sortedFaculty : sortedFaculty.slice(0, 5);

  const handleEditProfile = () => {
    if (window.confirm('This will reset your profile and restart onboarding. Continue?')) {
      resetAllData();
      navigate('/onboarding');
    }
  };

  const showNotification = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left select-none">
      
      {/* === WELCOME HERO BANNER === */}
      <div className="bg-gradient-to-r from-primary to-[#123669] text-white rounded-[28px] p-6 sm:p-8 shadow-elevation2 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Verified SCE Student Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {name.split(' ')[0]}! 👋
          </h1>
          <p className="text-white/80 text-sm leading-relaxed font-medium">
            Your personalized campus hub for academic guidance, student connect, study resources, and official notices.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
          <button
            onClick={() => navigate('/connect')}
            className="bg-white text-primary hover:bg-slate-100 px-5 py-3 rounded-full font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">groups</span>
            Find Peer Mentors
          </button>
          <button
            onClick={() => navigate('/study-hub')}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-3 rounded-full font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Study Hub
          </button>
        </div>
      </div>

      {/* === QUICK SHORTCUT CARDS GRID === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: 'Roommate Finder', desc: 'Hostel Profiles', icon: 'bedroom_parent', color: 'text-purple-600', bg: 'bg-purple-50', path: '/connect' },
          { title: 'Senior Mentors', desc: 'Academic Advice', icon: 'school', color: 'text-blue-600', bg: 'bg-blue-50', path: '/connect' },
          { title: 'Clubs & Events', desc: 'Campus Activities', icon: 'celebration', color: 'text-amber-600', bg: 'bg-amber-50', path: '/clubs-events' },
          { title: 'Campus Map', desc: 'Interactive Nav', icon: 'map', color: 'text-emerald-600', bg: 'bg-emerald-50', path: '/campus-map' },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => navigate(item.path)}
            className="bg-white border border-surfaceVariant hover:border-primary/40 rounded-2xl p-4 shadow-elevation1 hover:shadow-elevation2 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-bold mb-3`}>
              <span className="material-symbols-outlined text-[22px] select-none">{item.icon}</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-onSurface">{item.title}</h3>
              <p className="text-[11px] text-onSurfaceVariant font-medium">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === LEFT COLUMN: STUDENT PROFILE & DEPARTMENT FACULTY (2 COLS) === */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STUDENT PROFILE CARD */}
          <div className="bg-white border border-surfaceVariant rounded-[24px] overflow-hidden shadow-elevation1">
            <div className="p-6 border-b border-surfaceVariant flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-onSurface">{name}</h2>
                    <span className="text-[10px] bg-primaryContainer text-onPrimaryContainer font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      Student
                    </span>
                  </div>
                  <p className="text-xs font-medium text-onSurfaceVariant mt-0.5">{deptFullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                  isHostel ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isHostel ? 'Hostel Resident' : 'Day Scholar'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wider">
                My Academic Interests & Skill Focus
              </h3>
              {interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {interests.map(i => (
                    <span key={i} className="bg-secondaryContainer text-onSecondaryContainer rounded-full px-3.5 py-1 text-xs font-semibold">
                      {i}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-onSurfaceVariant italic">No interests set. Edit profile to configure.</p>
              )}
            </div>

            <div className="px-6 pb-5 flex justify-end border-t border-surfaceVariant/60 pt-4">
              <button
                type="button"
                onClick={handleEditProfile}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:bg-primaryContainer/50 px-4 py-2 rounded-full transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Student Profile
              </button>
            </div>
          </div>

          {/* DEPARTMENT FACULTY & HOD DIRECTORY (SORTED HIERARCHY WITH IMAGE URLS) */}
          <div className="bg-white border border-surfaceVariant rounded-[24px] p-6 shadow-elevation1 space-y-5">
            <div className="flex items-center justify-between border-b border-surfaceVariant pb-4">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Academic Department</span>
                <h2 className="text-lg font-bold text-onSurface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
                  {dept} Department Faculty Desk
                </h2>
              </div>

              {sortedFaculty.length > 5 && (
                <button
                  onClick={() => setShowAllFaculty(!showAllFaculty)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {showAllFaculty ? 'Show Less' : `View All (${sortedFaculty.length})`}
                </button>
              )}
            </div>

            {loadingFaculty ? (
              <p className="text-xs text-onSurfaceVariant italic py-4">Loading department faculty directory...</p>
            ) : sortedFaculty.length > 0 ? (
              <div className="divide-y divide-surfaceVariant/60">
                {displayedFaculty.map((faculty) => {
                  const desig = (faculty.designation || '').toLowerCase();
                  const isHod = desig.includes('head') || desig.includes('hod');
                  const avatarUrl = faculty.photo_url || faculty.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=1B4DA6&color=fff&size=128`;
                  const emailAddr = faculty.contact_email || faculty.email;

                  return (
                    <div key={faculty.id || faculty.name} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt={faculty.name}
                          className="w-11 h-11 rounded-full object-cover border border-outline/20 flex-shrink-0 shadow-sm"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=1B4DA6&color=fff&size=128`;
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-onSurface">{faculty.name}</span>
                            {isHod && (
                              <span className="bg-primaryContainer text-onPrimaryContainer text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                HOD
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-onSurfaceVariant">{faculty.designation}</p>
                        </div>
                      </div>

                      {emailAddr && (
                        <a
                          href={`mailto:${emailAddr}`}
                          className="bg-surfaceContainer text-primary hover:bg-primaryContainer px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">mail</span>
                          Contact
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-onSurfaceVariant">
                No faculty members listed for this department yet.
              </div>
            )}
          </div>

        </div>

        {/* === RIGHT COLUMN: NOTICES & UPCOMING EVENTS (1 COL) === */}
        <div className="space-y-8">
          
          {/* OFFICIAL NOTICES */}
          <div className="bg-white border border-surfaceVariant rounded-[24px] p-6 shadow-elevation1 space-y-4">
            <div className="flex items-center justify-between border-b border-surfaceVariant pb-3">
              <h2 className="text-base font-bold text-onSurface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
                Campus Notices
              </h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Live</span>
            </div>

            <div className="space-y-3">
              {notices.length > 0 ? (
                notices.map((n) => (
                  <div key={n.id} className="p-3 rounded-2xl bg-surfaceContainer/50 border border-outline/10 space-y-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{n.category || 'Notice'}</span>
                    <h4 className="text-xs font-bold text-onSurface leading-snug">{n.title}</h4>
                    <p className="text-[11px] text-onSurfaceVariant line-clamp-2">{n.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-onSurfaceVariant italic py-2">No active notices.</p>
              )}
            </div>
          </div>

          {/* OFFICIAL BUS ROUTES WIDGET */}
          <BusRouteWidget />

          {/* UPCOMING EVENTS */}
          <div className="bg-white border border-surfaceVariant rounded-[24px] p-6 shadow-elevation1 space-y-4">
            <div className="flex items-center justify-between border-b border-surfaceVariant pb-3">
              <h2 className="text-base font-bold text-onSurface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                Upcoming Events
              </h2>
              <button onClick={() => navigate('/clubs-events')} className="text-xs font-bold text-primary hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((e) => (
                  <div key={e.id} className="p-3 rounded-2xl bg-surfaceContainer/50 border border-outline/10 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-onSurface">{e.name || e.title}</h4>
                      <p className="text-[11px] text-onSurfaceVariant">{e.venue || 'Campus Auditorium'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primaryContainer px-2.5 py-1 rounded-full flex-shrink-0">
                      {e.date ? new Date(e.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-onSurfaceVariant italic py-2">No upcoming events scheduled.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      <ToastSnackbar
        isOpen={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default Dashboard;
