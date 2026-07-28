import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../contexts/AppContext.jsx';

const CHECKLIST = [
  {
    id: 'docs',
    icon: 'description',
    title: 'Verify Documents',
    subtitle: 'Registry & Admission',
    color: '#1B4DA6',
    popupTitle: 'Document Verification',
    popupBody: 'Visit the registry desk on the ground floor of the main block. Bring your original admission letter, transfer certificate, community certificate, and 2 passport photos. The process takes 15–30 minutes.',
    where: 'Ground Floor, Main Block',
    tip: 'Bring both originals and photocopies.',
  },
  {
    id: 'mentor',
    icon: 'supervisor_account',
    title: 'Meet Your Mentor',
    subtitle: 'Orientation Day',
    color: '#7C3AED',
    popupTitle: 'Faculty Mentor Meeting',
    popupBody: 'Every fresher is assigned a faculty mentor during orientation. Your mentor will guide you throughout your first year academically and personally. Find them at the department hall on Day 1.',
    where: 'Your Department Block',
    tip: 'Carry a notebook and introduce yourself.',
  },
  {
    id: 'campus',
    icon: 'map',
    title: 'Explore Campus',
    subtitle: 'Interactive Map',
    color: '#16A34A',
    popupTitle: 'Campus Navigation',
    popupBody: 'Use the PathMate Campus Map to find all buildings, labs, hostels, and canteens with live GPS turn-by-turn walking directions across the 40+ acre campus.',
    where: 'Campus Map tab → Satellite View',
    tip: 'Try the "Ask AI Navigation" search bar.',
  },
  {
    id: 'clubs',
    icon: 'celebration',
    title: 'Join a Club',
    subtitle: 'Student Activities',
    color: '#D97706',
    popupTitle: 'Student Clubs & Societies',
    popupBody: 'SCE has 20+ clubs in technical, cultural, sports, and social domains. Club registrations open during the first orientation week. Check the Events tab in PathMate for the Club Expo date.',
    where: 'Clubs & Events tab',
    tip: 'Joining a club boosts your placement profile.',
  },
  {
    id: 'library',
    icon: 'local_library',
    title: 'Get Library Card',
    subtitle: 'Central Library',
    color: '#0891B2',
    popupTitle: 'Central Library',
    popupBody: 'Visit the Central Library on the 1st floor of the KS Block to get your library card. Bring your college ID. The library has 50,000+ books, digital journals, and DELNET database access.',
    where: 'KS Block, 1st Floor',
    tip: 'Quiet study zones available 8:30 AM – 6 PM.',
  },
  {
    id: 'class',
    icon: 'school',
    title: 'Find Classroom',
    subtitle: 'Academic Blocks',
    color: '#DC2626',
    popupTitle: 'Classroom Finder',
    popupBody: 'Your classroom is assigned based on your department and section. Check the timetable on Day 1. Use the Campus Map to locate your block — KS, RV, JS, and BD blocks are labeled in the 2D map.',
    where: 'Timetable → Campus Map',
    tip: 'Arrive 10 mins early on the first day.',
  },
];

const FresherChecklist = () => {
  const { dbFresherChecklist, toggleFresherChecklistDb } = useApp();
  const checked = dbFresherChecklist || {};
  const [active, setActive] = useState(null);

  const toggle = (id) => {
    toggleFresherChecklistDb(id, !checked[id]);
  };

  const done = CHECKLIST.filter(i => checked[i.id]).length;
  const pct = Math.round((done / CHECKLIST.length) * 100);

  return (
    <div className="bg-white border border-outline/30 rounded-[24px] p-6 shadow-sm"
         style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primaryContainer flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>checklist</span>
          </div>
          <div>
            <h3 className="text-[14px] font-extrabold text-onSurface leading-tight">Fresher's Journey</h3>
            <p className="text-[11px] text-onSurfaceVariant">{done} of {CHECKLIST.length} steps completed</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[26px] font-black text-primary leading-none">{pct}%</span>
          <p className="text-[10px] text-onSurfaceVariant font-bold">done</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-surfaceVariant/40 rounded-full my-4 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
             style={{ width: `${pct}%` }} />
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CHECKLIST.map(item => {
          const isDone = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => setActive(item)}
              className="text-left rounded-2xl border p-3 transition-all duration-150 relative overflow-hidden cursor-pointer"
              style={{
                borderColor: isDone ? `${item.color}40` : 'var(--outline-variant)',
                background: isDone ? `${item.color}06` : 'var(--surface-container-lowest)',
              }}
            >
              {isDone && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: `radial-gradient(ellipse at 100% 0%, ${item.color}08, transparent 60%)` }} />
              )}
              <div className="flex items-start justify-between gap-1 mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ backgroundColor: `${item.color}15` }}>
                   <span className="material-symbols-outlined text-[15px]"
                         style={{ color: item.color, fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggle(item.id); }}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5"
                  style={{ borderColor: isDone ? item.color : 'var(--outline)', background: isDone ? item.color : 'transparent' }}
                >
                  {isDone && <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>}
                </button>
              </div>
              <p className="text-[11px] font-extrabold text-onSurface leading-tight"
                 style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                {item.title}
              </p>
              <p className="text-[10px] text-onSurfaceVariant mt-0.5">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {done === CHECKLIST.length && (
        <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-[12px] text-emerald-700 font-bold">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
          You're all set! Welcome to Saranathan family. 🎉
        </div>
      )}

      {/* Popup via Portal */}
      {active && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
             onClick={() => setActive(null)}>
          <style>{`@keyframes checkIn{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl"
               style={{ animation: 'checkIn 0.22s ease-out' }}
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: `${active.color}15` }}>
                <span className="material-symbols-outlined text-[22px]"
                      style={{ color: active.color, fontVariationSettings: "'FILL' 1" }}>{active.icon}</span>
              </div>
              <h3 className="text-[15px] font-extrabold text-onSurface flex-1 leading-tight">{active.popupTitle}</h3>
              <button onClick={() => setActive(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-onSurfaceVariant/60 flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-onSurfaceVariant leading-relaxed mb-3">{active.popupBody}</p>

            <div className="flex items-center gap-2 bg-primaryContainer/30 p-2.5 rounded-xl text-[11px] mb-2 border border-primaryContainer/50">
              <span className="material-symbols-outlined text-primary text-[14px]">location_on</span>
              <span className="font-bold text-primary">{active.where}</span>
            </div>

            {active.tip && (
              <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl text-[11px] mb-4 border border-amber-200">
                <span className="material-symbols-outlined text-amber-500 text-[14px]">lightbulb</span>
                <span className="text-amber-700 font-medium">{active.tip}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { toggle(active.id); setActive(null); }}
                className="flex-1 py-2.5 rounded-full text-[12px] font-bold transition-all cursor-pointer"
                style={{
                  background: checked[active.id] ? 'var(--surface-container-high)' : active.color,
                  color: checked[active.id] ? 'var(--on-surface-variant)' : 'white',
                }}
              >
                {checked[active.id] ? '↩ Mark Incomplete' : '✓ Mark as Done'}
              </button>
              <button onClick={() => setActive(null)}
                      className="px-4 py-2.5 rounded-full border border-outline/30 text-[12px] font-bold text-onSurfaceVariant hover:bg-slate-50 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FresherChecklist;
