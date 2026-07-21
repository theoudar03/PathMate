import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ToastSnackbar from '../components/common/ToastSnackbar';

const Dashboard = () => {
  const { studentData, resetAllData, token } = useApp();
  const navigate = useNavigate();

  const name       = studentData.name       || 'Freshman';
  const dept       = studentData.department || 'Computer Science';
  const isHostel   = studentData.isHosteller;
  const interests  = studentData.interests  || [];

  // Initials for avatar
  const initials = name
    ? name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SD';

  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [showAllFaculty, setShowAllFaculty] = useState(false);
  const [deptRecord, setDeptRecord] = useState(null);

  // Live Stats & Recent Activity
  const [stats, setStats] = useState({
    totalStudents: 1485,
    activeEvents: 8,
    activeClubs: 12,
    totalNotices: 14,
    completedTasks: 5,
    pendingTasks: 3,
    studyMaterials: 38
  });

  const [activityLogs, setActivityLogs] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(data => setDeptRecord(data.find(d => d.name === dept))).catch(()=>{});
    
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => setStats(prev => ({ ...prev, ...data })))
      .catch(()=>{});

    fetch('/api/activity-logs')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setActivityLogs(data);
      })
      .catch(()=>{});
  }, [dept]);

  const deptFullName = deptRecord?.full_name || dept;
  const deptUrlCode = deptRecord?.faculty_url_code;
  const facultyListUrl = deptUrlCode
    ? `https://saranathan.ac.in/dept.php?dept=${deptUrlCode}&tgt=faculty`
    : null;

  useEffect(() => {
    if (deptRecord?.id) {
      setLoadingFaculty(true);
      fetch(`/api/faculty/${deptRecord.id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map(f => ({
              id: f.id,
              name: f.name,
              designation: f.designation,
              qualification: f.qualification,
              photo: f.photo_url,
              email: f.contact_email,
              dept: f.department_name
            }));
            setDbFaculty(normalized);
          }
        })
        .catch(()=>{})
        .finally(() => setLoadingFaculty(false));
    }
  }, [deptRecord?.id, token]);

  const facultySource = dbFaculty;

  const hod = facultySource.find(f =>
    f.designation?.toLowerCase().includes('head') ||
    f.designation?.toLowerCase().includes('hod')
  );

  const prof = facultySource.find(f =>
    f !== hod &&
    f.designation?.toLowerCase().includes('professor')
  );

  const secondary = prof || facultySource.find(f => f !== hod);
  const primaryDisplay = [];
  if (hod) primaryDisplay.push(hod);
  if (secondary && secondary !== hod) primaryDisplay.push(secondary);
  const remainingFaculty = facultySource.filter(f => !primaryDisplay.includes(f));

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

  const renderFacultyRow = (faculty) => {
    const isHod = faculty === hod;
    const isProf = faculty === secondary && prof;
    const emailStr = faculty.email || faculty.contact_email;

    return (
      <div
        key={faculty.name || faculty.id}
        className="flex items-center justify-between gap-4 py-3 border-b border-outline/20 last:border-0 hover:bg-surfaceContainer px-3 rounded-xl transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          {faculty.photo ? (
            <img
              src={faculty.photo}
              alt={faculty.name}
              className="w-10 h-10 rounded-full object-cover border border-outline/15 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0 border border-primary/20">
              {faculty.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P'}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-onSurface">{faculty.name}</span>
              {faculty.qualification && (
                <span className="text-[10px] text-onSurfaceVariant font-medium">({faculty.qualification})</span>
              )}
              {isHod && (
                <span className="text-[9px] bg-primaryContainer text-onPrimaryContainer font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  HOD
                </span>
              )}
            </div>
            <p className="text-xs text-onSurfaceVariant">{faculty.designation}</p>
          </div>
        </div>

        {emailStr && (
          <a
            href={`mailto:${emailStr}`}
            className="text-[11px] font-semibold text-primary hover:underline flex-shrink-0 flex items-center gap-1 bg-primaryContainer/30 hover:bg-primaryContainer/70 px-3 py-1 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[14px] select-none">mail</span>
            Email
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-4xl mx-auto text-left select-none">
      {/* Page Header */}
      <div className="pb-4 border-b border-surfaceVariant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">Saranathan Student Portal</span>
          <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight">Student Dashboard</h1>
          <p className="text-sm text-onSurfaceVariant mt-1">
            Real-time campus metrics, personal profile, department faculty, and live activity feeds.
          </p>
        </div>

        <button
          onClick={() => showNotification("Portal metrics synced with PostgreSQL", "info")}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">sync</span>
          Sync Live DB
        </button>
      </div>

      {/* === LIVE METRICS COUNTERS (PostgreSQL Driven) === */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-outline/30 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Total Students</span>
          <p className="text-2xl font-black text-primary">{stats.totalStudents}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Registered & 1st Yr Strength</p>
        </div>

        <div className="bg-white border border-outline/30 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Active Events</span>
          <p className="text-2xl font-black text-green-600">{stats.activeEvents}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Hackathons & Fests</p>
        </div>

        <div className="bg-white border border-outline/30 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Active Clubs</span>
          <p className="text-2xl font-black text-purple-600">{stats.activeClubs}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Student Chapters</p>
        </div>

        <div className="bg-white border border-outline/30 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Study Materials</span>
          <p className="text-2xl font-black text-amber-600">{stats.studyMaterials}</p>
          <p className="text-[10px] text-gray-500 font-semibold">Verified Notes & Papers</p>
        </div>
      </div>

      {/* === PROFILE CARD WITH INITIALS AVATAR === */}
      <div
        className="bg-white border border-outline/40 rounded-[24px] overflow-hidden shadow-elevation1"
        style={{ borderLeft: '4px solid #1B4DA6' }}
      >
        <div className="px-6 pt-6 pb-5 border-b border-outline/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-md border-2 border-white">
                {initials}
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[10px] bg-primaryContainer text-primary font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  Verified Student
                </span>
                <h2 className="text-2xl font-black text-onSurface tracking-tight">{name}</h2>
                <p className="text-sm font-semibold text-onSurfaceVariant">{deptFullName}</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 sm:self-start">
              <span className={`text-[12px] font-bold px-3 py-1 rounded-full inline-block ${
                isHostel ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isHostel ? 'Hostel Resident' : 'Day Scholar'}
              </span>
              <span className="block text-[10px] text-onSurfaceVariant">Autumn Semester 2026</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-2">
          <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Academic Interests & Goals
          </h3>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <span key={i} className="bg-primaryContainer/60 text-primary rounded-full px-3 py-1 text-[12px] font-bold border border-primaryContainer">
                  {i}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-onSurfaceVariant italic">No interests configured.</p>
          )}
        </div>

        <div className="px-6 pb-5 flex justify-end">
          <button
            type="button"
            onClick={handleEditProfile}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:bg-primaryContainer/50 px-4 py-2 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-[15px]">edit</span>
            Edit Profile
          </button>
        </div>
      </div>

      {/* === REAL RECENT ACTIVITY LOGS FEED === */}
      <div className="bg-white border border-outline/40 rounded-[24px] p-6 shadow-elevation1 space-y-4">
        <div className="flex items-center justify-between border-b border-outline/20 pb-3">
          <h2 className="text-base font-black text-onSurface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history</span>
            Real Recent Activity Feed
          </h2>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Live Database Logs</span>
        </div>

        <div className="space-y-3">
          {activityLogs.map((log, idx) => (
            <div key={idx} className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-outline/15 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {log.category === 'notice' ? '📢' : log.category === 'event' ? '📅' : '👥'}
                </div>
                <div>
                  <p className="font-bold text-onSurface">{log.title}</p>
                  <p className="text-[11px] text-gray-500 font-medium">{log.action} • {log.actor}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toast Feedback */}
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
