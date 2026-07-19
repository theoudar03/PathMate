import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { DEPARTMENTS_DATA, FACULTY_DATA } from '../contexts/AppContext';

const Dashboard = () => {
  const { studentData, resetAllData, token } = useApp();
  const navigate = useNavigate();

  const name       = studentData.name       || 'Freshman';
  const dept       = studentData.department || 'CSE';
  const isHostel   = studentData.isHosteller;
  const interests  = studentData.interests  || [];

  const [dbFaculty, setDbFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [showAllFaculty, setShowAllFaculty] = useState(false);

  // Resolve department details from reference data
  const deptRecord = DEPARTMENTS_DATA.find(d => d.name === dept);
  const deptFullName = deptRecord?.full_name || dept;
  const deptUrlCode  = deptRecord?.faculty_url_code;
  const facultyListUrl = deptUrlCode
    ? `https://saranathan.ac.in/dept.php?dept=${deptUrlCode}&tgt=faculty`
    : null;

  // Filter local fallback faculty for this department
  const deptFaculty = FACULTY_DATA.filter(f => f.dept === dept || f.department === dept);

  // Fetch faculty dynamically from backend database if connection exists
  useEffect(() => {
    if (deptRecord?.id) {
      setLoadingFaculty(true);
      fetch(`/api/faculty/${deptRecord.id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('API failed');
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Normalize to match local properties (photo_url -> photo, contact_email -> email)
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
        .catch(err => {
          console.warn('Fallback to local faculty dataset:', err);
        })
        .finally(() => {
          setLoadingFaculty(false);
        });
    }
  }, [deptRecord?.id]);

  // Determine current faculty source (prefer DB, fallback to client-side constants)
  const facultySource = dbFaculty.length > 0 ? dbFaculty : deptFaculty;

  // Identify HOD
  const hod = facultySource.find(f =>
    f.designation?.toLowerCase().includes('head') ||
    f.designation?.toLowerCase().includes('hod') ||
    f.designation?.toLowerCase().includes('hod i/c')
  );

  // Identify one Professor (excluding HOD itself)
  const prof = facultySource.find(f =>
    f !== hod &&
    f.designation?.toLowerCase().includes('professor') &&
    !f.designation?.toLowerCase().includes('assistant') &&
    !f.designation?.toLowerCase().includes('associate')
  );

  // Fallback secondary if no professor is present (e.g. Civil)
  const secondary = prof || facultySource.find(f => f !== hod);

  // Primary contacts (HOD + 1 professor)
  const primaryDisplay = [];
  if (hod) primaryDisplay.push(hod);
  if (secondary && secondary !== hod) primaryDisplay.push(secondary);

  // Rest of the department faculty
  const remainingFaculty = facultySource.filter(f => !primaryDisplay.includes(f));

  const handleEditProfile = () => {
    if (window.confirm('This will reset your profile and restart onboarding. Continue?')) {
      resetAllData();
      navigate('/onboarding');
    }
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
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = ''; // fall back to letter avatar
              }}
              className="w-10 h-10 rounded-full object-cover border border-outline/15 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primaryContainer text-onPrimaryContainer flex items-center justify-center font-bold text-sm flex-shrink-0">
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
              {isProf && !isHod && (
                <span className="text-[9px] bg-secondaryContainer text-onSecondaryContainer font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Professor
                </span>
              )}
            </div>
            <p className="text-xs text-onSurfaceVariant">{faculty.designation}</p>
          </div>
        </div>

        {emailStr && (
          <a
            href={`mailto:${emailStr}`}
            className="text-[11px] font-semibold text-primary hover:underline flex-shrink-0 flex items-center gap-1 bg-primaryContainer/30 hover:bg-primaryContainer/70 px-3 py-1 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[14px] select-none">mail</span>
            Email
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-2xl mx-auto text-left">
      {/* Page Header */}
      <div className="pb-6">
        <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">Student Desk</span>
        <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight">Personal Profile</h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          Your saved information powers club matches, roommate suggestions, and senior connect pairings.
        </p>
      </div>

      {/* === FEE PAYMENT SIDE POPUP === */}
      <a 
        href="https://feepayment.cub.bank.in/StudentLogin?Instname=SCE"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-0 top-40 z-40 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-elevation3 hover:pr-6 hover:-translate-x-1 transition-all flex flex-col items-start gap-1 py-3 pl-4 pr-3 rounded-l-2xl border border-r-0 border-white/30 group"
        title="Pay semester and hostel fees via CUB Portal"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
          </div>
          <span className="font-black text-sm tracking-wide">Pay Fees</span>
        </div>
        <span className="text-[10px] text-emerald-50 font-bold uppercase tracking-wider ml-10">CUB Portal</span>
      </a>

      {/* === PROFILE CARD === */}
      <div
        className="bg-white border border-outline/40 rounded-[20px] overflow-hidden"
        style={{ borderLeft: '3px solid #1B4DA6', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)' }}
      >
        {/* Card header accent strip */}
        <div className="px-6 pt-6 pb-5 border-b border-outline/20">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] bg-primaryContainer text-primary font-black uppercase px-2.5 py-0.5 rounded-full select-none tracking-wider">
                <span className="material-symbols-outlined text-[11px]">badge</span>
                Academic Registry
              </span>
              <h2 className="text-2xl font-black text-onSurface pt-1 tracking-tight">{name}</h2>
              <p className="text-sm font-semibold text-onSurfaceVariant">{deptFullName}</p>
            </div>
            <div className="text-left sm:text-right space-y-1.5 sm:self-start flex-shrink-0">
              <span className="block text-[10px] font-black text-onSurfaceVariant uppercase tracking-wider">Stay Type</span>
              <span className={`text-[12px] font-bold px-3 py-1 rounded-full inline-block ${
                isHostel
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {isHostel ? 'Hostel Resident' : 'Day Scholar'}
              </span>
              <span className="block text-[10px] text-onSurfaceVariant">Autumn Semester 2026</span>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="px-6 py-5 space-y-3">
          <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest">
            Stated Interests & Goals
          </h3>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map(i => (
                <span key={i} className="bg-primaryContainer/60 text-primary rounded-full px-3 py-1 text-[12px] font-semibold border border-primaryContainer">
                  {i}
                </span>
              ))}
              {studentData.otherInterest && (
                <span className="bg-primaryContainer/60 text-primary rounded-full px-3 py-1 text-[12px] font-semibold border border-primaryContainer">
                  {studentData.otherInterest}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-onSurfaceVariant italic">No interests selected.</p>
          )}

          {studentData.backgroundText && (
            <div className="bg-surfaceContainer rounded-xl p-4 border border-outline/30 text-xs text-onSurfaceVariant leading-relaxed">
              <strong className="text-onSurface">Bio: </strong>
              <span className="italic">"{studentData.backgroundText}"</span>
            </div>
          )}
        </div>

        {/* Edit link */}
        <div className="px-6 pb-5 flex justify-end">
          <button
            type="button"
            onClick={handleEditProfile}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:bg-primaryContainer/50 px-3 py-1.5 rounded-full transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[14px] select-none">edit</span>
            Edit Profile
          </button>
        </div>
      </div>

      {/* === YOUR DEPARTMENT SECTION === */}
      <div
        className="bg-white border border-outline/40 rounded-[20px] overflow-hidden space-y-0"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)' }}
      >
        <div className="px-6 pt-6 pb-4 border-b border-outline/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primaryContainer flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px] select-none text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>domain</span>
            </div>
            <div>
              <h2 className="text-[15px] font-black text-onSurface tracking-tight">Your Department</h2>
              <p className="text-[12px] text-onSurfaceVariant mt-0.5">{deptFullName} &bull; Saranathan College of Engineering</p>
            </div>
          </div>
        </div>

        {/* Faculty list */}
        <div className="px-6 py-5 space-y-3">
          <h3 className="text-[10px] font-black text-onSurfaceVariant uppercase tracking-widest">Faculty Members</h3>
          
          {loadingFaculty ? (
            <div className="space-y-4 pt-1 animate-pulse" aria-label="Loading faculty profiles">
              <div className="flex items-center justify-between py-3 border-b border-surfaceVariant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceVariant/45"></div>
                  <div className="space-y-1.5 text-left">
                    <div className="h-3.5 bg-surfaceVariant/45 rounded-full w-32"></div>
                    <div className="h-2.5 bg-surfaceVariant/35 rounded-full w-24"></div>
                  </div>
                </div>
                <div className="h-7 bg-surfaceVariant/35 rounded-full w-16"></div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-surfaceVariant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surfaceVariant/45"></div>
                  <div className="space-y-1.5 text-left">
                    <div className="h-3.5 bg-surfaceVariant/45 rounded-full w-36"></div>
                    <div className="h-2.5 bg-surfaceVariant/35 rounded-full w-20"></div>
                  </div>
                </div>
                <div className="h-7 bg-surfaceVariant/35 rounded-full w-16"></div>
              </div>
            </div>
          ) : facultySource.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {/* Primary: HOD and 1 Professor */}
              {primaryDisplay.map(renderFacultyRow)}

              {/* Collapsible Remaining Faculty */}
              {showAllFaculty && remainingFaculty.length > 0 && (
                <div className="pt-1 mt-1 border-t border-dashed border-surfaceVariant/60 space-y-1.5 animate-slide-down">
                  {remainingFaculty.map(renderFacultyRow)}
                </div>
              )}

              {/* View More / Show Less Toggle Button */}
              {remainingFaculty.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFaculty(!showAllFaculty)}
                  className="mt-3 w-full py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold text-primary hover:bg-primaryContainer/40 rounded-xl border border-outline/30 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span className="material-symbols-outlined text-[16px] select-none">
                    {showAllFaculty ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                  {showAllFaculty ? 'Show Less' : `View More (${remainingFaculty.length} other members)`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-onSurfaceVariant italic pt-1">
              No faculty data found for {dept}.
            </p>
          )}
        </div>

        {/* View full faculty list link */}
        <div className="px-6 pb-6">
          {facultyListUrl ? (
            <a
              href={facultyListUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary bg-primaryContainer/40 border border-primaryContainer hover:bg-primaryContainer rounded-full px-4 py-2 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[15px] select-none">open_in_new</span>
              View full {dept} faculty list on SCE website
            </a>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-onSurfaceVariant border border-dashed border-outline/50 rounded-full px-4 py-2 opacity-60">
              <span className="material-symbols-outlined text-[15px] select-none">warning</span>
              Faculty URL code not confirmed for {dept} — link pending
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


