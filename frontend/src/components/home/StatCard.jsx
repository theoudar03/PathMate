import React, { useState, useEffect, useRef } from 'react';

const STAT_DETAILS = {
  'Established': {
    fullTitle: 'Founded in 1998',
    body: "Saranathan College of Engineering was established in 1998 with a vision to deliver quality technical education in the Trichy district of Tamil Nadu. Over 25+ years, SCE has grown into one of the region's most respected autonomous engineering institutions.",
    facts: ['Located in Panjappur, Trichy, Tamil Nadu', '25+ years of academic heritage', 'Autonomous institution recognized by UGC & Anna University'],
    icon: 'history_edu',
  },
  'NBA Accreditation': {
    fullTitle: '7 NBA-Accredited Departments',
    body: 'The National Board of Accreditation (NBA) has recognized 7 departments at SCE for meeting high standards of technical education aligned with global industry benchmarks.',
    facts: ['CSE, IT, ECE, EEE, ICE, Civil & more accredited', 'Curriculum meets NBA industry standards', 'Regular re-accreditation cycles maintained'],
    icon: 'military_tech',
  },
  'Accreditation': {
    fullTitle: 'NAAC A+ Grade',
    body: 'SCE holds the prestigious NAAC A+ accreditation — the highest grade awarded by the National Assessment and Accreditation Council — recognizing excellence in academics, infrastructure, and outcomes.',
    facts: ['Highest possible NAAC accreditation grade', 'Assessed across 7 quality criteria', 'Annual quality improvement cycles active'],
    icon: 'verified',
  },
  'Affiliation': {
    fullTitle: 'Anna University, Chennai',
    body: "SCE is affiliated with Anna University, Chennai — Tamil Nadu's premier technical university. This ensures a rigorous, industry-aligned curriculum, standardized examinations, and official degree certification.",
    facts: ["Tamil Nadu's top-ranked technical university", 'Curriculum aligned with current industry needs', 'Official degrees issued by Anna University'],
    icon: 'workspace_premium',
  },
  'Campus Size': {
    fullTitle: '40+ Acres Green Campus',
    body: 'Spread across 40+ acres in Panjappur, Trichy, the SCE campus is a lush, green, purpose-built environment for learning and holistic growth with modern blocks, hostels, and sports facilities.',
    facts: ['Separate boys and girls hostels on campus', 'Multiple sports courts and cricket ground', 'Central library, labs, canteen, and student center'],
    icon: 'filter_hdr',
  },
  'Specialities': {
    fullTitle: '9 UG Engineering Programs',
    body: 'SCE offers 9 specialized undergraduate programs spanning computing, electronics, electrical, civil, and AI-driven disciplines — giving every engineering aspirant a clear and supported academic pathway.',
    facts: ['CSE, IT, AI&DS, AI&ML, CSBS, ECE, EEE, ICE, Civil', 'Industry mentors for each department', 'Dedicated placement support from Year 1'],
    icon: 'layers',
  },
};

const COLORS = ['#1B4DA6', '#7C3AED', '#0284C7', '#D97706', '#16A34A', '#0891B2'];

function useCountUp(end, active) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!active) return;
    const num = parseInt(end);
    if (isNaN(num)) return;
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(Math.floor(eased * num));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else setVal(num);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [active, end]);
  return val;
}

const StatCard = ({ stat, idx }) => {
  const [inView, setInView] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ref = useRef(null);
  const color = COLORS[idx % COLORS.length];
  const details = STAT_DETAILS[stat.label];

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.35 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const numericPart = parseInt(stat.value);
  const hasNumber = !isNaN(numericPart);
  const counted = useCountUp(numericPart, inView && hasNumber);
  const display = () => {
    if (!hasNumber || !inView) return stat.value;
    const suffix = stat.value.replace(/[0-9]/g, '').trim();
    return `${counted}${suffix}`;
  };

  return (
    <>
      <div
        ref={ref}
        onClick={() => details && setShowModal(true)}
        className="group relative cursor-pointer bg-white border border-outline/30 rounded-[20px] p-5 transition-all duration-200 hover:-translate-y-1 select-none overflow-hidden"
        style={{ borderLeft: `3px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(15,23,42,0.05)' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.08), 0 0 0 1px ${color}30`; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(15,23,42,0.05)'; }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
             style={{ background: `radial-gradient(ellipse at 10% 10%, ${color}08, transparent 60%)` }} />
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
               style={{ backgroundColor: `${color}18` }}>
            <span className="material-symbols-outlined text-[18px] select-none"
                  style={{ color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-onSurfaceVariant">{stat.label}</span>
        </div>
        <p className="text-[24px] font-black tracking-tight leading-none mb-2" style={{ color }}>{display()}</p>
        {details && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-onSurfaceVariant/45 group-hover:text-primary transition-colors duration-150">
            <span className="material-symbols-outlined text-[11px]">info</span>
            <span>Tap to learn more</span>
          </div>
        )}
      </div>

      {showModal && details && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
             onClick={() => setShowModal(false)}>
          <style>{`@keyframes statIn{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full shadow-2xl"
               style={{ animation: 'statIn 0.22s ease-out' }}
               onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: `${color}15` }}>
                <span className="material-symbols-outlined text-[24px]"
                      style={{ color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-onSurfaceVariant mb-0.5">{stat.label}</p>
                <h3 className="text-[21px] font-black tracking-tight" style={{ color }}>{stat.value}</h3>
              </div>
              <button onClick={() => setShowModal(false)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-onSurfaceVariant/50 flex-shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h4 className="text-[13px] font-extrabold text-onSurface mb-2">{details.fullTitle}</h4>
            <p className="text-[12px] text-onSurfaceVariant leading-relaxed mb-4">{details.body}</p>
            <div className="space-y-2 bg-slate-50 rounded-2xl p-3.5">
              {details.facts.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-onSurfaceVariant">
                  <span className="material-symbols-outlined text-[13px] flex-shrink-0 mt-0.5" style={{ color }}>check_circle</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatCard;
