import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { STUDY_HUB_CONFIG } from '../config/studyHubConfig';

const StudyHub = () => {
  const { t } = useApp();
  
  // State for Curriculum & Syllabus accordions
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptSearch, setDeptSearch] = useState('');

  // State for Learning Resources active category list dialog/accordion
  const [activeCategory, setActiveCategory] = useState(null);

  // Toggle department accordion
  const toggleDept = (deptId) => {
    setExpandedDept(expandedDept === deptId ? null : deptId);
  };

  // Filter departments based on search query
  const filteredDepts = STUDY_HUB_CONFIG.departments.filter(dept =>
    dept.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  // Connection guide steps for Campus Wi-Fi
  const wifiSteps = [
    { nr: "1", text: "Connect to SCE Student Wi-Fi" },
    { nr: "2", text: "Open Wi-Fi Portal" },
    { nr: "3", text: "Login using credentials" },
    { nr: "4", text: "Accept policy" },
    { nr: "5", text: "Internet Connected" }
  ];
  
  const [wifiExpanded, setWifiExpanded] = useState(false);

  return (
    <div className="space-y-10 font-sans animate-fade-in text-left py-6 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <div 
        className="relative overflow-hidden rounded-[32px] bg-primaryContainer/30 border border-primaryContainer/50 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ minHeight: '220px' }}
      >
        <div className="space-y-4 max-w-2xl text-left z-10">
          <span className="text-xs text-primary font-black uppercase tracking-widest">{t('studyHub') || 'Study Hub'}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-onPrimaryContainer tracking-tight font-display">
            {t('studyHubTitle') || 'Study Hub'}
          </h1>
          <p className="text-sm sm:text-base text-onSurfaceVariant/90 leading-relaxed font-medium whitespace-pre-line">
            {t('studyHubSubtitle') || 'Everything a Saranathan student needs for studying,\npreparing for exams,\nbuying resources,\nand staying connected —\nall in one place.'}
          </p>
        </div>

        {/* Clean Educational SVG Illustration */}
        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center bg-white/70 rounded-full border border-primaryContainer/30 shadow-sm p-4">
          <svg viewBox="0 0 200 200" className="w-full h-full text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Books stack */}
            <path d="M40 140h120v20H40z" fill="#D8E2FF" stroke="#1B4DA6" strokeWidth="2" />
            <path d="M50 100h100v40H50z" fill="#FFFFFF" stroke="#1B4DA6" strokeWidth="2" />
            <path d="M60 70h80v30H60z" fill="#E8EAF6" stroke="#1B4DA6" strokeWidth="2" />
            {/* Graduation Cap */}
            <path d="M100 25l60 20-60 20-60-20z" fill="#1B4DA6" />
            <path d="M60 45v20c0 10 18 15 40 15s40-5 40-15V45" stroke="#1B4DA6" strokeWidth="2" />
            <path d="M145 50v25" stroke="#1B4DA6" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="145" cy="78" r="3" fill="#1B4DA6" />
          </svg>
        </div>
      </div>

      {/* ── SECTION 1: ACADEMIC RESOURCES ────────────────────────── */}
      <section className="space-y-6">
        <div className="border-b border-surfaceVariant pb-2">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined select-none text-[22px]">auto_stories</span>
            {t('academicResources') || 'Academic Resources'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Previous Year Question Papers */}
          <div className="bg-surface border border-surfaceVariant/60 rounded-[24px] p-6 shadow-elevation1 flex flex-col justify-between hover:shadow-elevation2 hover:border-primary/20 transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] select-none">description</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-onSurface">{t('prevQuestionPapers') || 'Previous Year Question Papers'}</h3>
                  <span className="text-[10px] bg-primaryContainer/30 text-primary font-bold px-2 py-0.5 rounded-full">Drive Hub</span>
                </div>
              </div>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">
                {t('prevPapersDesc') || 'Access department-wise previous year question papers and college-prepared question banks for Internal Assessments and Anna University examinations.'}
              </p>
            </div>
            
            <div className="pt-6">
              <a
                href={STUDY_HUB_CONFIG.questionPapersDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold py-3 px-6 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm"
                style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
              >
                <span className="material-symbols-outlined text-[16px] select-none">open_in_new</span>
                {t('openQuestionPaperDrive') || 'Open Question Paper Drive'}
              </a>
            </div>
          </div>

          {/* Curriculum & Syllabus Accordion Card */}
          <div className="bg-surface border border-surfaceVariant/60 rounded-[24px] p-6 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/20 transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] select-none">menu_book</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-onSurface">{t('curriculumSyllabus') || 'Curriculum & Syllabus'}</h3>
                    <span className="text-[10px] bg-primaryContainer/30 text-primary font-bold px-2 py-0.5 rounded-full">Regulations 2024</span>
                  </div>
                </div>
              </div>

              {/* Search filter for departments */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-onSurfaceVariant/60 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Filter departments (e.g. CSE, ECE)..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-outline/35 rounded-xl text-xs bg-surfaceContainerLowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-onSurface"
                />
              </div>

              {/* Department Accordion List */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {filteredDepts.length > 0 ? (
                  filteredDepts.map((dept) => {
                    const isExpanded = expandedDept === dept.id;
                    return (
                      <div key={dept.id} className="border border-outline/20 rounded-xl overflow-hidden bg-surfaceContainerLow/40 transition-colors">
                        <button
                          type="button"
                          onClick={() => toggleDept(dept.id)}
                          className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-onSurface hover:bg-surfaceContainerHigh transition-colors outline-none"
                        >
                          <span>{dept.name}</span>
                          <span className={`material-symbols-outlined text-[16px] text-onSurfaceVariant transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1.5 bg-surfaceContainerLowest border-t border-outline/10 flex flex-wrap gap-2 animate-slide-down">
                            <a
                              href={dept.curriculumUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 border border-outline/30 hover:bg-primary/5 text-primary text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors outline-none"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              {t('viewCurriculum') || 'View Curriculum'}
                            </a>
                            <a
                              href={dept.syllabusUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 border border-outline/30 hover:bg-primary/5 text-primary text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors outline-none"
                            >
                              <span className="material-symbols-outlined text-[14px]">menu_book</span>
                              {t('viewSyllabus') || 'View Syllabus'}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-onSurfaceVariant/60 py-4">No matching departments</p>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── SECTION 2: CAMPUS RESOURCES ─────────────────────────── */}
      <section className="space-y-6">
        <div className="border-b border-surfaceVariant pb-2">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined select-none text-[22px]">dns</span>
            {t('campusResources') || 'Campus Resources'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campus Wi-Fi */}
          <div className="bg-surface border border-surfaceVariant/60 rounded-[24px] p-6 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/20 transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px] select-none">wifi</span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-onSurface">{t('campusWifi') || 'Campus Wi-Fi'}</h3>
                    <span className="text-[10px] bg-primaryContainer/30 text-primary font-bold px-2 py-0.5 rounded-full">SCE_Fortinet</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">
                {t('wifiDescription') || 'Connect to high-speed campus internet. View credentials or open the login portal.'}
              </p>

              {/* Expandable Connection Guide Accordion */}
              <div className="border border-outline/20 rounded-xl overflow-hidden bg-surfaceContainerLow/30">
                <button
                  type="button"
                  onClick={() => setWifiExpanded(!wifiExpanded)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-onSurface hover:bg-surfaceContainerHigh transition-colors outline-none"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">help_outline</span>
                    {t('wifiConnectionGuide') || 'Wi-Fi Connection Guide'}
                  </span>
                  <span className={`material-symbols-outlined text-[16px] text-onSurfaceVariant transition-transform duration-200 ${wifiExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                
                {wifiExpanded && (
                  <div className="p-4 bg-surfaceContainerLowest border-t border-outline/10 space-y-2 animate-slide-down">
                    {wifiSteps.map((step) => (
                      <div key={step.nr} className="flex items-start gap-3 text-xs leading-normal">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {step.nr}
                        </div>
                        <span className="text-onSurfaceVariant font-medium">{step.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <a
                  href={STUDY_HUB_CONFIG.wifiPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primaryHover text-white text-xs font-bold py-3 px-6 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary shadow-sm"
                  style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
                >
                  <span className="material-symbols-outlined text-[16px] select-none">login</span>
                  {t('wifiPortalBtn') || 'Open Wi-Fi Portal'}
                </a>
              </div>
            </div>
          </div>

          {/* Official Instagram */}
          <div className="bg-surface border border-surfaceVariant/60 rounded-[24px] p-6 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/20 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] select-none">photo_camera</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-onSurface">{t('officialInstagram') || 'Official Instagram'}</h3>
                  <span className="text-[10px] bg-rose-500/10 text-rose-600 font-bold px-2 py-0.5 rounded-full">@saranathancollege</span>
                </div>
              </div>
              <p className="text-xs text-onSurfaceVariant leading-relaxed">
                {t('instagramDescription') || 'Stay updated with official announcements, events, achievements, placements, cultural activities, and campus news.'}
              </p>
            </div>

            <div className="pt-6">
              <a
                href={STUDY_HUB_CONFIG.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 border border-rose-500 hover:bg-rose-50 text-rose-600 text-xs font-bold py-3 px-6 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] select-none">open_in_new</span>
                {t('visitInstagram') || 'Visit Instagram'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: LEARNING RESOURCES ───────────────────────── */}
      <section className="space-y-6">
        <div className="border-b border-surfaceVariant pb-2">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined select-none text-[22px]">smart_display</span>
            {t('learningResources') || 'Learning Resources'}
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { id: 'programming', label: t('programming') || 'Programming', icon: 'code' },
            { id: 'electronics', label: t('electronics') || 'Electronics', icon: 'memory' },
            { id: 'mathematics', label: t('mathematics') || 'Mathematics', icon: 'calculate' },
            { id: 'aptitude', label: t('aptitude') || 'Aptitude', icon: 'psychology' },
            { id: 'placement', label: t('placement') || 'Placement', icon: 'work' },
            { id: 'gate', label: t('gate') || 'GATE', icon: 'school' }
          ].map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(isActive ? null : cat.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primaryContainer border-primary text-primary shadow-sm'
                    : 'bg-surface border-surfaceVariant/60 text-onSurface hover:bg-surfaceContainer hover:border-primary/10'
                }`}
              >
                <span className="material-symbols-outlined text-[26px] select-none mb-2">{cat.icon}</span>
                <span className="text-[11px] font-black tracking-wide uppercase">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Channels Recommendations Area */}
        {activeCategory && STUDY_HUB_CONFIG.learningResources[activeCategory] && (
          <div className="bg-surfaceContainerLow border border-outline/15 rounded-[24px] p-5 sm:p-6 animate-slide-down text-left">
            <h3 className="text-sm font-extrabold text-primary mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">subscriptions</span>
              {t('recommendedChannels') || 'Recommended YouTube Channels'} ({activeCategory.toUpperCase()})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {STUDY_HUB_CONFIG.learningResources[activeCategory].map((ch) => (
                <div key={ch.name} className="bg-surface border border-outline/20 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-elevation1 transition-shadow">
                  <div>
                    <h4 className="text-xs font-black text-onSurface">{ch.name}</h4>
                    <p className="text-[11px] text-onSurfaceVariant mt-1 leading-snug">{ch.desc}</p>
                  </div>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primaryHover outline-none"
                  >
                    <span>Go to Channel</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 4: STUDENT SERVICES ─────────────────────────── */}
      <section className="space-y-6">
        <div className="border-b border-surfaceVariant pb-2">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined select-none text-[22px]">storefront</span>
            {t('studentServices') || 'Student Services'}
          </h2>
        </div>

        <div className="max-w-3xl">
          {/* SaraSell Premium Banner */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[28px] p-8 shadow-elevation2 hover:shadow-elevation3 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            
            {/* Decorative background circle */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

            <div className="space-y-4 flex-1 text-left relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <span className="material-symbols-outlined text-[28px] select-none">storefront</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{t('saraSell') || 'SaraSell'}</h3>
                  <span className="text-[11px] bg-emerald-900/40 text-emerald-50 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Campus Marketplace</span>
                </div>
              </div>
              <p className="text-sm text-emerald-50 leading-relaxed font-medium max-w-xl">
                {t('saraSellDescription') || 'Buy and sell books, calculators, stationery, records, lab kits, and other student essentials within the Saranathan College community.'}
              </p>
            </div>

            <div className="w-full md:w-auto relative z-10 flex-shrink-0">
              <a
                href={STUDY_HUB_CONFIG.saraSellUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-black py-4 px-8 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white shadow-md hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-[20px] select-none">shopping_cart_checkout</span>
                {t('openSaraSell') || 'Open SaraSell'}
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default StudyHub;

