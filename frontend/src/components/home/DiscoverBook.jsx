import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const PAGES = [
  {
    chapter: '🏛️ Our Story',
    heading: 'Welcome to Saranathan',
    body: 'Established in 1998, Saranathan College of Engineering is a NAAC A+ autonomous institution affiliated to Anna University, nestled on a lush 40-acre campus in Panjappur, Trichy.',
    highlight: '"Education is the passport to the future."',
    color: '#1B4DA6',
    icon: 'account_balance',
  },
  {
    chapter: '📜 Heritage',
    heading: 'College History',
    body: 'Founded by the Saranathan Educational Trust with a vision to nurture world-class engineers. Over 25 years, SCE has produced 15,000+ graduates placed across the globe.',
    highlight: '25+ years of engineering excellence in Tamil Nadu.',
    color: '#7C3AED',
    icon: 'history_edu',
  },
  {
    chapter: '🎓 Academics',
    heading: 'Departments',
    body: '9 undergraduate departments — CSE, IT, ECE, EEE, ICE, Civil, AI&DS, AI&ML, and CSBS — each with NBA accreditation, dedicated labs, and industry-mentored curricula.',
    highlight: '7 of 9 departments are NBA Accredited.',
    color: '#0284C7',
    icon: 'school',
  },
  {
    chapter: '🏢 Infrastructure',
    heading: 'Campus Facilities',
    body: 'Smart classrooms, seminar halls, an auditorium, Wi-Fi coverage, and separate hostels for boys and girls — built for immersive, distraction-free learning on 40+ acres.',
    highlight: 'Every block is connected by shaded walkways.',
    color: '#059669',
    icon: 'domain',
  },
  {
    chapter: '📚 Knowledge',
    heading: 'Central Library',
    body: '50,000+ books, 2,000+ journals, DELNET membership, and a fully digital catalog. Open from 8:30 AM to 6:00 PM with quiet study zones and a research corner.',
    highlight: '"A library is the delivery room for the birth of ideas." — Norman Cousins',
    color: '#D97706',
    icon: 'local_library',
  },
  {
    chapter: '🧪 Innovation',
    heading: 'Laboratories',
    body: 'State-of-the-art labs for every discipline — from IoT & Cloud Computing labs to Digital Signal Processing and CNC workshops. 50+ labs with industry-grade equipment.',
    highlight: '50+ labs across all engineering departments.',
    color: '#DC2626',
    icon: 'biotech',
  },
  {
    chapter: '🏆 Athletics',
    heading: 'Sports',
    body: 'Two full-size cricket grounds, basketball and volleyball courts, a 200m athletic track, and indoor facilities for table tennis, chess, and carrom. Annual sports day celebrated campus-wide.',
    highlight: 'Inter-college champions in cricket and athletics.',
    color: '#16A34A',
    icon: 'sports_cricket',
  },
  {
    chapter: '🤝 Community',
    heading: 'Student Clubs',
    body: '20+ active clubs — coding, robotics, debate, fine arts, NCC, NSS, and cultural societies. Club fests, hackathons, and workshops run throughout the academic year.',
    highlight: 'Join a club during orientation week!',
    color: '#7C3AED',
    icon: 'groups',
  },
  {
    chapter: '💼 Careers',
    heading: 'Placements',
    body: 'Dedicated Placement & Training cell. 100+ companies visit every year — TCS, Infosys, Wipro, Cognizant, HCL, Zoho, and many more. Pre-placement training starts from Year 2.',
    highlight: '85%+ placement rate for eligible students.',
    color: '#0891B2',
    icon: 'work',
  },
  {
    chapter: '🌳 Life',
    heading: 'Campus Life',
    body: 'From morning chai at the canteen to evening cricket — SCE campus life is vibrant. Festivals like Pongal Day, Culturals, and Tech Fest bring the entire college together.',
    highlight: '"The best memories are made outside the classroom."',
    color: '#1B4DA6',
    icon: 'park',
  },
];

const DiscoverBook = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const prevPage = () => setCurrentPage(p => Math.max(0, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(PAGES.length - 1, p + 1));
  const page = PAGES[currentPage];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primaryContainer flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          </div>
          <div>
            <h2 className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">Discover Saranathan</h2>
            <p className="text-[11px] text-onSurfaceVariant/60">10 chapters to explore</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primaryHover text-white text-[12px] font-bold rounded-full transition-all active:scale-[0.98] cursor-pointer"
          style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
        >
          <span className="material-symbols-outlined text-[15px]">menu_book</span>
          Open Book
        </button>
      </div>

      {/* Chapter Cards — always visible (scroll preview) */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {PAGES.map((pg, i) => (
          <button
            key={i}
            onClick={() => { setCurrentPage(i); setIsOpen(true); }}
            className="flex-shrink-0 w-[140px] bg-white border border-outline/20 rounded-2xl p-3.5 text-left transition-all duration-150 hover:-translate-y-0.5 cursor-pointer group"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(15,23,42,0.04)' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5"
                 style={{ backgroundColor: `${pg.color}15` }}>
              <span className="material-symbols-outlined text-[16px]"
                    style={{ color: pg.color, fontVariationSettings: "'FILL' 1" }}>{pg.icon}</span>
            </div>
            <p className="text-[10px] font-bold text-onSurfaceVariant/50 mb-0.5">{pg.chapter}</p>
            <p className="text-[11px] font-extrabold text-onSurface leading-tight group-hover:text-primary transition-colors">{pg.heading}</p>
          </button>
        ))}
      </div>

      {/* Fullscreen Book Reader (Portal) */}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6"
             onClick={() => setIsOpen(false)}>
          <style>{`
            @keyframes bookOpen{from{opacity:0;transform:scale(0.9) rotateY(-8deg)}to{opacity:1;transform:scale(1) rotateY(0)}}
            @keyframes pageFade{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
            .book-reader{animation:bookOpen 0.35s ease-out}
            .page-content{animation:pageFade 0.25s ease-out}
            .scrollbar-hide::-webkit-scrollbar{display:none}
          `}</style>
          <div
            className="book-reader bg-white rounded-[28px] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
            style={{ perspective: '1200px' }}
          >
            {/* Book Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-outline/10 flex-shrink-0"
                 style={{ background: `linear-gradient(135deg, ${page.color}08, transparent)` }}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]"
                      style={{ color: page.color, fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                <span className="text-[11px] font-black uppercase tracking-widest text-onSurfaceVariant">
                  Discover Saranathan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-onSurfaceVariant/50">
                  {currentPage + 1} / {PAGES.length}
                </span>
                <button onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-onSurfaceVariant/50 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Page Progress */}
            <div className="h-0.5 bg-surfaceVariant/30 flex-shrink-0">
              <div className="h-full transition-all duration-500 ease-out rounded-full"
                   style={{ width: `${((currentPage + 1) / PAGES.length) * 100}%`, backgroundColor: page.color }} />
            </div>

            {/* Page Content */}
            <div key={currentPage} className="page-content flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-hide">
              {/* Large icon area */}
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-5"
                   style={{ backgroundColor: `${page.color}12` }}>
                <span className="material-symbols-outlined text-[32px]"
                      style={{ color: page.color, fontVariationSettings: "'FILL' 1" }}>{page.icon}</span>
              </div>

              <p className="text-center text-[10px] font-black uppercase tracking-widest mb-1"
                 style={{ color: page.color }}>{page.chapter}</p>
              <h2 className="text-center text-[22px] sm:text-[26px] font-black text-onSurface leading-tight tracking-tight mb-4">
                {page.heading}
              </h2>

              <p className="text-[13px] text-onSurfaceVariant leading-relaxed text-center max-w-sm mx-auto mb-5">
                {page.body}
              </p>

              {/* Highlight quote */}
              <div className="rounded-2xl p-4 text-center mx-auto max-w-xs"
                   style={{ backgroundColor: `${page.color}08`, borderLeft: `3px solid ${page.color}` }}>
                <p className="text-[12px] font-bold italic leading-relaxed" style={{ color: page.color }}>
                  {page.highlight}
                </p>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-outline/10 flex-shrink-0 bg-slate-50/50">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer text-onSurfaceVariant"
              >
                <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                Previous
              </button>

              {/* Page dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {PAGES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className="w-2 h-2 rounded-full transition-all cursor-pointer"
                    style={{
                      backgroundColor: i === currentPage ? page.color : 'var(--outline-variant)',
                      transform: i === currentPage ? 'scale(1.4)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={nextPage}
                disabled={currentPage === PAGES.length - 1}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[12px] font-bold transition-all disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-white"
                style={{ backgroundColor: currentPage === PAGES.length - 1 ? '#94a3b8' : page.color }}
              >
                Next
                <span className="material-symbols-outlined text-[15px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DiscoverBook;
