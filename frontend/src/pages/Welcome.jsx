import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import Onboarding from './Onboarding';
import TranslateText from '../components/common/TranslateText';

// Count-Up animation component for Live Statistics
const CountUp = ({ end, duration = 1200, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endVal = parseInt(end, 10);
    if (isNaN(endVal)) {
      setCount(end); // Not a number, set directly (e.g. "24/7")
      return;
    }
    
    if (start === endVal) return;

    let totalMiliseconds = duration;
    let incrementTime = Math.abs(Math.floor(totalMiliseconds / endVal));
    incrementTime = Math.max(incrementTime, 16); // cap at ~60fps target

    const timer = setInterval(() => {
      start += Math.ceil(endVal / (totalMiliseconds / incrementTime));
      if (start >= endVal) {
        clearInterval(timer);
        setCount(endVal);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

// Animated Stat Card with Intersection Observer
const AnimatedStatCard = ({ icon, endValue, suffix, label }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={elementRef} 
      className="card p-6 flex flex-col items-center justify-center text-center backdrop-blur-md bg-white/80 border border-slate-200/50 hover:scale-[1.02] transition-all duration-300"
    >
      <span className="material-symbols-outlined text-[36px] text-primary mb-2 select-none">{icon}</span>
      <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
        {isVisible ? <CountUp end={endValue} suffix={suffix} /> : "0"}
      </h3>
      <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
};

// Interactive Checklist Mock Component
const InteractiveChecklistMock = () => {
  const { t } = useApp();
  const [checkedIds, setCheckedIds] = useState([1, 2]);

  const checklist = [
    { id: 1, text: t('simChecklistItem1') || "Submit original certificates" },
    { id: 2, text: t('simChecklistItem2') || "Verify hostel block allotment" },
    { id: 3, text: t('simChecklistItem3') || "Connect with Senior Advisor mentor" },
    { id: 4, text: t('simChecklistItem4') || "Complete opt-in registration for student clubs" },
    { id: 5, text: t('simChecklistItem5') || "Configure campus Wi-Fi credentials" },
  ].map(item => ({ ...item, checked: checkedIds.includes(item.id) }));

  const toggleCheck = (id) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const completedCount = checkedIds.length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="p-4 text-left space-y-3">
      <div className="flex items-center justify-between border-b pb-2 border-slate-100">
        <div>
          <h4 className="text-xs font-bold text-slate-800">{t('simChecklistTitle') || 'Freshman Setup Checklist'}</h4>
          <p className="text-[9px] text-slate-500">{t('simChecklistSubtitle') || 'Tapping items simulates real dashboard updates'}</p>
        </div>
        <span className="text-[10px] bg-primaryContainer text-onPrimaryContainer px-2 py-0.5 rounded-full font-bold">
          {completedCount} / {checklist.length}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold text-slate-500">
          <span>{t('simChecklistOverall') || 'COMPLETION RATE'}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* List items */}
      <div className="space-y-1.5 pt-1">
        {checklist.map(item => (
          <label 
            key={item.id} 
            className="flex items-center gap-2.5 p-2 border border-slate-100 hover:border-primary/20 rounded-lg cursor-pointer bg-slate-50/30 hover:bg-slate-50/80 transition-all select-none"
          >
            <input 
              type="checkbox" 
              checked={item.checked} 
              onChange={() => toggleCheck(item.id)} 
              className="w-4 h-4 accent-primary rounded cursor-pointer border-slate-300"
            />
            <span className={`text-[10.5px] font-medium leading-none ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {item.text}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

const ReviewCarousel = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleCount = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  useEffect(() => {
    if (isPaused || reviews.length <= visibleCount) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, reviews.length, visibleCount]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? Math.max(0, reviews.length - visibleCount) : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => {
      const maxIdx = Math.max(0, reviews.length - visibleCount);
      return prev >= maxIdx ? 0 : prev + 1;
    });
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (touchStart.current - touchEnd.current > threshold) {
      handleNext();
    } else if (touchStart.current - touchEnd.current < -threshold) {
      handlePrev();
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-100/50 border border-dashed border-slate-200 rounded-3xl max-w-lg mx-auto">
        <span className="material-symbols-outlined text-slate-350 text-4xl block mb-2 select-none">rate_review</span>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No Student Reviews Yet</p>
        <p className="text-[11px] text-slate-400 mt-1">Be the first student to submit a review from your Dashboard!</p>
      </div>
    );
  }

  // Active index bounds check
  const activeIndex = Math.min(currentIndex, Math.max(0, reviews.length - visibleCount));

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto px-4 md:px-12 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="overflow-hidden w-full py-4">
        <div 
          ref={scrollContainerRef}
          className="flex transition-transform duration-500 ease-out gap-6"
          style={{ transform: `translateX(-${activeIndex * (100 / visibleCount)}%)` }}
        >
          {reviews.map((item, idx) => {
            const initials = (item.student_name || 'Verified Student')
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div 
                key={idx}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0 bg-white/70 backdrop-blur-md border border-slate-200/40 p-6 rounded-[24px] shadow-xs flex flex-col justify-between hover:shadow-md transition-all hover:scale-[1.01] duration-300 relative overflow-hidden group"
              >
                {item.featured && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 text-[8.5px] font-black text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-3xs select-none">
                    <span className="material-symbols-outlined text-[10px] fill-current">star</span>
                    Featured
                  </span>
                )}
                <div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span 
                        key={i} 
                        className={`material-symbols-outlined text-base ${i < item.rating ? 'text-amber-500 fill-current' : 'text-slate-350'}`}
                        style={{ fontVariationSettings: i < item.rating ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 tracking-tight leading-tight line-clamp-1">{item.title}</h4>
                  <p className="text-[12px] leading-relaxed text-slate-500 font-semibold mt-2.5 line-clamp-4">
                    "{item.description}"
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-primaryContainer text-primary font-black text-xs flex items-center justify-center shadow-3xs uppercase">
                      {initials}
                    </div>
                    <div className="text-left leading-none">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-800">{item.student_name}</p>
                        {item.visibility !== 'anonymous' && (
                          <span className="material-symbols-outlined text-[11px] text-primary fill-current select-none" title="Verified Student">verified</span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-bold mt-1 block">{item.department} • Year {item.year}</span>
                    </div>
                  </div>
                  <div className="text-[9.5px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-lg">
                    {new Date(item.created_at || item.created_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Left/Right Controls */}
      {reviews.length > visibleCount && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-9.5 h-9.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer active:scale-90 transition-all z-10"
            aria-label="Previous Review"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-9.5 h-9.5 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 flex items-center justify-center cursor-pointer active:scale-90 transition-all z-10"
            aria-label="Next Review"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </>
      )}
    </div>
  );
};

const Welcome = () => {
  const navigate = useNavigate();
  const { completeOnboarding, resetAllData, t, language, setLanguage } = useApp();
  
  // Dialog State: null | 'login' | 'register'
  const [activeDialog, setActiveDialog] = useState(null);

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Landing Page Interactive States
  const [activePreviewTab, setActivePreviewTab] = useState('dashboard');
  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    activeLocations: 0,
    activeServices: 0,
    aiChatsToday: 0
  });

  // Fetch statistics from backend
  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStatsData({
          totalStudents: data.totalStudents || 0,
          activeLocations: data.activeLocations || 0,
          activeServices: data.activeServices || 0,
          aiChatsToday: data.aiChatsToday || 0
        });
      })
      .catch(err => {
        console.warn("Could not retrieve real-time stats, applying offline configurations:", err);
      });
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg(t('pleaseEnterBoth'));
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success && data.token) {
        completeOnboarding(data.user, data.token);
        setActiveDialog(null);
        navigate('/');
      } else {
        throw new Error('Unexpected authentication response');
      }
    } catch (err) {
      setErrorMsg(err.message === 'Authentication failed' || err.message === 'Incorrect username or password.' ? t('incorrectCreds') : err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [reviews, setReviews] = useState([]);
  const [reviewsStats, setReviewsStats] = useState({ averageRating: 0, totalReviews: 0, categories: [] });
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetch('/api/reviews/public')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReviews(data.reviews || []);
          setReviewsStats(data.stats || { averageRating: 0, totalReviews: 0, categories: [] });
        }
      })
      .catch(err => console.error("Failed to load public reviews:", err))
      .finally(() => setLoadingReviews(false));
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-800 font-sans flex flex-col overflow-x-hidden selection:bg-primaryContainer selection:text-onPrimaryContainer">
      
      {/* Dynamic Background Grid Pattern & Ambient Gradients */}
      <div className="absolute inset-0 z-0 opacity-[0.4] bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primaryContainer/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-200/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* ─────────────────────────────────────────────────
         STICKY HEADER NAVIGATION (Linear/Vercel Aesthetic)
         ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 py-4 transition-all shadow-sm">
        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[20px] font-bold">account_balance</span>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-800 leading-none">SCE PathMate</h1>
            <span className="text-[9px] text-primary font-bold uppercase tracking-widest">{t('freshersPortal')}</span>
          </div>
        </div>

        {/* Navigation links - hidden on small viewports */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          <button onClick={() => scrollToSection('why-pathmate')} className="hover:text-primary transition-colors cursor-pointer">{t('whyPathMate')}</button>
          <button onClick={() => scrollToSection('features')} className="hover:text-primary transition-colors cursor-pointer">{t('exploreFeaturesBtn')}</button>
          <button onClick={() => scrollToSection('preview')} className="hover:text-primary transition-colors cursor-pointer">{t('previewTitle')}</button>
          <button onClick={() => scrollToSection('roadmap')} className="hover:text-primary transition-colors cursor-pointer">{t('roadmapTitle')}</button>
          <button onClick={() => scrollToSection('stats')} className="hover:text-primary transition-colors cursor-pointer">{t('statsTitle')}</button>
          <button onClick={() => scrollToSection('testimonials')} className="hover:text-primary transition-colors cursor-pointer">{t('testimonialsTitle')}</button>
        </nav>

        {/* Header Action Items */}
        <div className="flex items-center gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-full border border-slate-200 transition-all text-xs font-bold select-none cursor-pointer">
            <span className="material-symbols-outlined text-[15px] text-slate-500">language</span>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-slate-700 outline-none cursor-pointer border-none font-bold text-[11px] pr-1"
              aria-label="Select Language"
            >
              <option value="en">English (EN)</option>
              <option value="ta">தமிழ் (TA)</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={() => setActiveDialog('login')}
            className="hidden sm:inline-flex text-xs font-bold text-slate-700 hover:text-primary transition-colors px-3 py-1.5"
          >
            {t('login')}
          </button>

          <button
            type="button"
            onClick={() => { resetAllData(); setActiveDialog('register'); }}
            className="btn-primary py-2 px-5 text-xs rounded-full shadow-md flex items-center gap-1.5 transition-md3 active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[15px] font-bold">rocket_launch</span>
            <span>{t('getStarted')}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────
         1. HERO SECTION (High impact, clean visual design)
         ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center space-y-6">
        
        {/* Animated badge alert - Built for Every Saranathan Fresher */}
        <div className="glow-spin inline-block p-[1.5px] rounded-full shadow-sm animate-fade-in">
          <div className="relative z-10 bg-white hover:bg-slate-50 border border-slate-200/40 rounded-full px-4 py-1 flex items-center gap-2 transition-colors cursor-pointer select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-extrabold tracking-wide text-primary uppercase">
              {t('builtForFreshers')}
            </span>
            <span className="material-symbols-outlined text-[12px] text-primary">arrow_forward</span>
          </div>
        </div>

        {/* Big Premium Header Title */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800 max-w-3xl leading-[1.1] pt-2 animate-slide-up">
          {t('welcomeTitle')}
        </h2>

        {/* Clean Subheading (max 2 lines) */}
        <p className="text-sm sm:text-base text-slate-550 font-medium leading-relaxed max-w-2xl mx-auto pt-1 animate-slide-up stagger-delay-1">
          {t('welcomeSubtitle')}
        </p>

        {/* Feature Badges Grid layout */}
        <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto pt-4 animate-slide-up stagger-delay-2">
          {[
            { label: "🤖 AI Assistant", key: "ai" },
            { label: "🗺 Campus Navigation", key: "nav" },
            { label: "🎓 Study Hub", key: "study" },
            { label: "👥 Senior Connect", key: "senior" },
            { label: "📢 Smart Notice Board", key: "notice" },
            { label: "📅 Clubs & Events", key: "events" }
          ].map((badge) => (
            <span
              key={badge.key}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-primary/30 rounded-full px-4 py-2 text-[11.5px] font-bold text-slate-700 shadow-sm hover:shadow hover:scale-[1.02] cursor-default transition-all"
            >
              {badge.label}
            </span>
          ))}
        </div>

        {/* Main CTA Actions button row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 w-full max-w-sm sm:max-w-md mx-auto animate-slide-up stagger-delay-3">
          <button
            type="button"
            onClick={() => { resetAllData(); setActiveDialog('register'); }}
            className="w-full sm:w-auto bg-primary hover:bg-primaryHover text-white font-extrabold text-sm py-3.5 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            style={{ boxShadow: '0 4px 14px rgba(27,77,166,0.25)' }}
          >
            <span className="material-symbols-outlined text-[16px] font-bold">rocket_launch</span>
            <span>{t('getStarted')}</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveDialog('login')}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-sm py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>{t('alreadyAccount') ? t('alreadyAccount').replace('Already have an account? ', '') : 'Log In'}</span>
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         2. VALUE PROPOSITION SECTION ("Why PathMate?")
         ───────────────────────────────────────────────── */}
      <section id="why-pathmate" className="relative z-10 max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('whyPathMate')}</h2>
          <div className="w-12 h-1 bg-primary rounded-full mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "dashboard",
              title: t('everythingInOnePlace'),
              desc: t('noNeedSearchWebsites')
            },
            {
              icon: "smart_toy",
              title: t('aiPoweredGuidance'),
              desc: t('getInstantAnswers')
            },
            {
              icon: "school",
              title: t('designedForFreshers'),
              desc: t('navigateFirstYear')
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="card p-6 flex flex-col items-start text-left bg-white border border-slate-200/40 hover:scale-[1.02] hover:shadow-md transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[20px] font-bold">{item.icon}</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-800">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         7. PRODUCT PREVIEW (Tabbed Mock Browser Container)
         ───────────────────────────────────────────────── */}
      <section id="preview" className="relative z-10 max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('previewTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('previewSubtitle')}</p>
        </div>

        <div className="mockup-window flex flex-col border border-slate-200/80 bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* Mockup Header Bar (Aesthetic macOS dots & Tab Row) */}
          <div className="bg-slate-100 border-b border-slate-200/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
              <span className="text-[10px] text-slate-400 font-bold ml-2">{t('simulatorTitle') || 'PathMate Freshman Workspace Simulator'}</span>
            </div>

            {/* Simulated Address Bar */}
            <div className="bg-white border border-slate-200/60 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-medium flex items-center gap-1.5 min-w-[200px] max-w-[320px] select-none mx-auto sm:mx-0">
              <span className="material-symbols-outlined text-[11px] text-success">lock</span>
              <span className="truncate">https://pathmate-sce.web.app/dashboard</span>
            </div>
          </div>

          {/* Module Tab Grid layout selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-slate-200/60 bg-slate-50/50 select-none">
            {[
              { id: 'dashboard', label: t('tabDashboard') || 'Dashboard', icon: 'dashboard' },
              { id: 'ai', label: t('tabAi') || 'AI Assistant', icon: 'smart_toy' },
              { id: 'map', label: t('tabMap') || 'Campus Map', icon: 'explore' },
              { id: 'study', label: t('tabStudy') || 'Study Hub', icon: 'library_books' },
              { id: 'notice', label: t('tabNotice') || 'Notice Board', icon: 'notifications' },
              { id: 'checklist', label: t('tabChecklist') || 'Task Checklist', icon: 'task_alt' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id)}
                className={`py-2.5 px-1.5 text-[10.5px] font-bold text-slate-500 border-r border-slate-200/50 flex items-center justify-center gap-1 hover:bg-slate-105 hover:text-slate-700 transition-all ${activePreviewTab === tab.id ? 'mockup-tab-active border-b-2 border-b-primary bg-white' : ''}`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active simulated preview view container */}
          <div className="bg-white min-h-[300px] flex flex-col justify-center">
            
            {activePreviewTab === 'dashboard' && (
              <div className="space-y-4 p-4 text-left">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t('simWelcomeName') || 'Welcome, Sanjay Kumar'}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{t('simDept') || '1st Year • Computer Science & Engineering'}</p>
                  </div>
                  <span className="text-[9px] bg-primaryContainer text-onPrimaryContainer px-2 py-0.5 rounded-full font-bold">{t('simHostel') || 'Hosteller • Boys Hostel'}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{t('simOnboardingProg') || 'Freshman Onboarding Progress'}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: '80%' }}></div>
                      </div>
                      <span className="text-xs font-bold text-primary">80%</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 mt-1">{t('simOnboardingSub') || '4 of 5 core setup checklists completed'}</p>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{t('simLatestNotice') || 'Latest Official Notice'}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1 truncate">{t('simNoticeText') || 'Verification of original certificate documents starts from Monday...'}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{t('simNoticeAuthor') || 'Published 2 hours ago by Student Dean Desk'}</p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/20">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">{t('simShortcutTitle') || 'Grounded AI Campus Assistant Shortcut'}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { resetAllData(); setActiveDialog('register'); }} type="button" className="flex-1 py-2 px-3 bg-primary hover:bg-primaryHover text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer">
                      <span className="material-symbols-outlined text-xs">explore</span> {t('simBtnNavigate') || 'Navigate Campus Buildings'}
                    </button>
                    <button onClick={() => { resetAllData(); setActiveDialog('register'); }} type="button" className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all cursor-pointer">
                      <span className="material-symbols-outlined text-xs">smart_toy</span> {t('simBtnChatbot') || 'Ask Grounded Chatbot'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'ai' && (
              <div className="flex flex-col h-[300px] text-left">
                <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/30">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[13px] font-bold">smart_toy</span>
                    </div>
                    <div className="bg-slate-100 text-slate-800 p-2.5 rounded-2xl rounded-tl-none text-[11px] leading-relaxed border border-slate-200/50">
                      {t('simAiGreeting') || 'Hello Sanjay! I am your PathMate AI assistant. Ask me anything about classrooms, hostel wardens, or library codes.'}
                    </div>
                  </div>
                  <div className="flex gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[13px]">person</span>
                    </div>
                    <div className="bg-primary text-white p-2.5 rounded-2xl rounded-tr-none text-[11px] leading-relaxed shadow-sm">
                      {t('simUserQ1') || 'Where is the HOD Office for Civil Engineering department?'}
                    </div>
                  </div>
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                      <span className="material-symbols-outlined text-[13px] font-bold">smart_toy</span>
                    </div>
                    <div className="bg-slate-100 text-slate-800 p-2.5 rounded-2xl rounded-tl-none text-[11px] leading-relaxed shadow-sm border border-slate-100">
                      {t('simAiA1') || 'The Civil Engineering HOD Office is located on the First Floor of the C-Block (Technology Block), right next to the department computer labs.'}
                    </div>
                  </div>
                </div>
                <div className="p-2 border-t border-slate-100 flex gap-2 bg-white">
                  <input type="text" readOnly placeholder={t('simInputPlaceholder') || 'Where is the Boys Hostel warden desk?'} className="flex-1 bg-slate-100 rounded-full px-3 py-1.5 text-xs outline-none text-slate-400 border border-slate-200" />
                  <button type="button" className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-default"><span className="material-symbols-outlined text-sm font-bold">send</span></button>
                </div>
              </div>
            )}

            {activePreviewTab === 'map' && (
              <div className="p-4 flex flex-col h-[300px] text-left relative overflow-hidden">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{t('simMapTitle') || 'Live Campus Location Guide'}</h4>
                    <p className="text-[9px] text-slate-500">{t('simMapSubtitle') || 'Directions from Main Auditorium to Mechanical Labs'}</p>
                  </div>
                  <span className="text-[9px] font-bold text-success flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span> {t('simMapGps') || 'Indoor GPS Active'}</span>
                </div>
                
                <div className="flex-1 bg-slate-50 rounded-xl relative border border-slate-200/50 overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                  
                  <div className="absolute top-4 left-6 bg-white border border-slate-200 p-1 px-2 rounded text-[8px] font-bold text-slate-700 shadow-sm">{t('simMapAuditorium') || 'Main Auditorium'}</div>
                  <div className="absolute bottom-6 right-6 bg-white border border-slate-200 p-1 px-2 rounded text-[8px] font-bold text-slate-700 shadow-sm">{t('simMapMech') || 'Mechanical Workshops'}</div>
                  <div className="absolute bottom-8 left-12 bg-white border border-slate-200 p-1 px-2 rounded text-[8px] font-bold text-slate-700 shadow-sm">{t('simMapLibrary') || 'Library Complex'}</div>
                  
                  <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <path d="M 50,45 L 85,90 L 140,160" fill="none" stroke="#D8E2FF" strokeWidth="5" strokeLinecap="round" />
                    <path d="M 50,45 L 85,90 L 140,160" fill="none" stroke="#1B4DA6" strokeWidth="3" strokeLinecap="round" className="animate-route-dash" />
                    
                    <circle cx="50" cy="45" r="5" fill="#1B4DA6" />
                    <circle cx="50" cy="45" r="8" fill="#1B4DA6" fillOpacity="0.2" />
                    <circle cx="140" cy="160" r="5" fill="#F59E0B" />
                  </svg>

                  <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[9px] font-semibold px-2 py-1 rounded shadow backdrop-blur flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[10px] text-accent">navigation</span>
                    <span>{t('simMapDirection') || 'Walk straight 100m, turn left (3 mins)'}</span>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'study' && (
              <div className="p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">{t('simStudyTitle') || 'Freshman Resource Repository'}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold">{t('simStudyUpdated') || 'Updated 2 mins ago'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex items-start gap-2 hover:border-primary/30 transition-all cursor-default">
                    <span className="material-symbols-outlined text-primary text-base">picture_as_pdf</span>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{t('simStudyPhysics') || 'Engineering Physics IA-1'}</p>
                      <p className="text-[8px] text-slate-400">PDF • 1.2 MB</p>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex items-start gap-2 hover:border-primary/30 transition-all cursor-default">
                    <span className="material-symbols-outlined text-accent text-base">article</span>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{t('simStudyMaths') || 'Mathematics Syllabus'}</p>
                      <p className="text-[8px] text-slate-400">DOCX • 340 KB</p>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex items-start gap-2 hover:border-primary/30 transition-all cursor-default">
                    <span className="material-symbols-outlined text-success text-base">description</span>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{t('simStudyTamil') || 'NME Tamil Record Template'}</p>
                      <p className="text-[8px] text-slate-400">PDF • 4.8 MB</p>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-2 bg-slate-50/50 flex items-start gap-2 hover:border-primary/30 transition-all cursor-default">
                    <span className="material-symbols-outlined text-amber-600 text-base">calendar_today</span>
                    <div className="truncate">
                      <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">{t('simStudyGuide') || 'Induction Assembly Guide'}</p>
                      <p className="text-[8px] text-slate-400">PDF • 820 KB</p>
                    </div>
                  </div>
                </div>
                <button type="button" className="w-full py-1.5 border border-dashed border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:border-primary/50 hover:text-primary transition-all cursor-default bg-transparent">
                  {t('simStudyViewAll') || '+ View All 45 Resource Files'}
                </button>
              </div>
            )}

            {activePreviewTab === 'notice' && (
              <div className="p-4 text-left space-y-3">
                <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">{t('simNoticeTitle') || 'SCE Bulletin Notice Board'}</h4>
                  <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">{t('simNoticeCount') || '2 New Updates'}</span>
                </div>
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  <div className="border-l-2 border-red-500 bg-red-50/30 p-2 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded uppercase leading-none">{t('simNoticeUrgent') || 'Urgent'}</span>
                      <span className="text-[8px] text-slate-400">{t('simNoticeTime') || '10 mins ago'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 mt-1 leading-tight">{t('simNoticeText1') || 'Original Certificate Verification Schedule details released'}</p>
                  </div>
                  <div className="border-l-2 border-primary bg-primary/5 p-2 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-primary text-white font-bold px-1.5 py-0.5 rounded uppercase leading-none">{t('simNoticeAcad') || 'Academic'}</span>
                      <span className="text-[8px] text-slate-400">{t('simNoticeYesterday') || 'Yesterday'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 mt-1 leading-tight">{t('simNoticeText2') || 'Odd Semester Academic Calendar commencement dates verified'}</p>
                  </div>
                  <div className="border-l-2 border-slate-400 bg-slate-50 p-2 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-500 text-white font-bold px-1.5 py-0.5 rounded uppercase leading-none">{t('simNoticeHostel') || 'Hostel'}</span>
                      <span className="text-[8px] text-slate-400">{t('simNotice2days') || '2 days ago'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 mt-1 leading-tight">{t('simNoticeText3') || 'Warden Allotment lists and Roommate Specifications updated'}</p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'checklist' && (
              <InteractiveChecklistMock />
            )}

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         4. FEATURE SHOWCASE (Grid of 6 interactive cards)
         ───────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('featureShowcaseTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-2xl mx-auto">{t('featureShowcaseSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            {
              icon: "explore",
              title: t('map') || "Campus Navigation",
              desc: t('navNeverLost') || "Never get lost again.",
              color: "text-blue-500 bg-blue-50"
            },
            {
              icon: "smart_toy",
              title: t('assistant') || "AI Assistant",
              desc: t('aiAskInstant') || "Ask anything instantly.",
              color: "text-purple-500 bg-purple-50"
            },
            {
              icon: "library_books",
              title: t('studyHub') || "Study Hub",
              desc: t('studyAcademicResources') || "All your academic resources.",
              color: "text-green-500 bg-green-50"
            },
            {
              icon: "groups",
              title: t('mentorLabel') || "Senior Connect",
              desc: t('seniorGuidance') || "Guidance from experienced seniors.",
              color: "text-orange-500 bg-orange-50"
            },
            {
              icon: "event",
              title: t('clubs') || "Clubs & Events",
              desc: t('eventsNeverMiss') || "Never miss registrations.",
              color: "text-pink-500 bg-pink-50"
            },
            {
              icon: "notifications",
              title: "Smart Notice Board",
              desc: t('noticeBoardUpdates') || "Important updates in one place.",
              color: "text-amber-500 bg-amber-50"
            }
          ].map((item, index) => (
            <div 
              key={index} 
              onClick={() => { resetAllData(); setActiveDialog('register'); }}
              className="card group p-6 bg-white border border-slate-200/40 hover:scale-[1.02] hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col text-left justify-between cursor-pointer"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 duration-300`}>
                  <span className="material-symbols-outlined text-[20px] font-bold">{item.icon}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 leading-tight">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-5 flex items-center gap-1 text-[11px] font-black text-primary transition-all group-hover:translate-x-1.5">
                <span>Access Feature</span>
                <span className="material-symbols-outlined text-[13px] font-black">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         6. VISUAL ROADMAP (Responsive Chronological timeline)
         ───────────────────────────────────────────────── */}
      <section id="roadmap" className="relative z-10 max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('roadmapTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('roadmapSubtitle')}</p>
        </div>

        {/* ROADMAP TIMELINE: Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative">
          
          {/* Desktop connecting line */}
          <div className="hidden md:block absolute top-[25px] left-[8%] right-[8%] h-[3px] bg-slate-200/60 z-0 overflow-hidden">
            <div className="h-full bg-primary w-full animate-[drawLine_2.5s_ease-out_forwards]" />
          </div>

          {/* Mobile connecting line */}
          <div className="block md:hidden absolute left-[25px] top-6 bottom-6 w-[3px] bg-slate-200/60 z-0 overflow-hidden">
            <div className="w-full bg-primary h-full animate-[drawLineVertical_2.5s_ease-out_forwards]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 md:gap-4 relative z-10">
            {[
              { icon: "how_to_reg", stepNum: "1", title: t('stepRegister'), desc: t('stepRegisterDesc') },
              { icon: "map", stepNum: "2", title: t('stepExplore'), desc: t('stepExploreDesc') },
              { icon: "contact_support", stepNum: "3", title: t('stepSeniors'), desc: t('stepSeniorsDesc') },
              { icon: "diversity_3", stepNum: "4", title: t('stepClubs'), desc: t('stepClubsDesc') },
              { icon: "menu_book", stepNum: "5", title: t('stepLearn'), desc: t('stepLearnDesc') },
              { icon: "school", stepNum: "6", title: t('stepGraduate'), desc: t('stepGraduateDesc') }
            ].map((step, idx) => (
              <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3">
                
                {/* Timeline Node marker */}
                <div className="w-[50px] h-[50px] rounded-full bg-white border-2 border-primary text-primary flex items-center justify-center shadow-md flex-shrink-0 z-10 transition-transform hover:scale-110 duration-200">
                  <span className="material-symbols-outlined text-[20px] font-bold">{step.icon}</span>
                </div>

                <div>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider">Step 0{step.stepNum}</span>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 leading-tight">{step.title}</h3>
                  <p className="text-[10.5px] sm:text-xs text-slate-400 font-semibold mt-1 leading-relaxed max-w-[200px] md:mx-auto">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         8. LIVE STATISTICS (Scrolled-in trigger metrics)
         ───────────────────────────────────────────────── */}
      <section id="stats" className="relative z-10 max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/50">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('statsTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('statsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <AnimatedStatCard icon="school" endValue={statsData.totalStudents} suffix="+" label={t('studentsCountLabel')} />
          <AnimatedStatCard icon="pin_drop" endValue={statsData.activeLocations} suffix="+" label={t('locationsLabel')} />
          <AnimatedStatCard icon="settings_suggest" endValue={statsData.activeServices} suffix="+" label={t('servicesLabel')} />
          <AnimatedStatCard icon="support_agent" endValue="24" suffix="/7" label={t('aiAssistant247')} />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         9. STUDENT TESTIMONIALS (Dynamic Reviews & Carousel)
         ───────────────────────────────────────────────── */}
      <section id="testimonials" className="relative z-10 w-full py-12 border-t border-slate-200/50 overflow-hidden bg-slate-100/50">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t('testimonialsHeading') || 'What Students Say About PathMate'}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">{t('testimonialsSubtitle') || 'Real, unedited reviews directly from verified Saranathan freshman students.'}</p>
        </div>

        {/* Overall Rating & Feature Breakdown */}
        {reviewsStats && reviewsStats.totalReviews > 0 && (
          <div className="max-w-4xl mx-auto px-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white/40 border border-slate-200/50 p-6 rounded-3xl backdrop-blur-md text-slate-800 shadow-xs">
            <div className="text-center md:border-r border-slate-200/60 py-2">
              <span className="text-5xl font-black text-slate-800 tracking-tight">{reviewsStats.averageRating}</span>
              <span className="text-sm font-bold text-slate-400">/5</span>
              <div className="flex justify-center gap-0.5 my-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`material-symbols-outlined text-xl ${i < Math.round(reviewsStats.averageRating) ? 'text-amber-500 fill-current' : 'text-slate-350'}`}
                    style={{ fontVariationSettings: i < Math.round(reviewsStats.averageRating) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('overallRating') || 'Overall Campus Rating'}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {t('basedOnReviews')
                  ? t('basedOnReviews').replace('{count}', reviewsStats.totalReviews)
                  : `Based on ${reviewsStats.totalReviews} verified reviews`}
              </p>
            </div>
            
            <div className="md:col-span-2 text-left space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{t('featureRatings') || 'Feature Average Ratings'}</h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {reviewsStats.categories.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200/40 px-3 py-1.5 rounded-full text-[11px] font-extrabold text-slate-700 shadow-3xs hover:border-primary/20 transition-all select-none">
                    <span><TranslateText text={c.category} /></span>
                    <span className="flex items-center text-amber-600 gap-0.5">
                      <span className="material-symbols-outlined text-[12px] fill-current">star</span>
                      {c.avg_rating}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <ReviewCarousel reviews={reviews} />
      </section>

      {/* ─────────────────────────────────────────────────
         10. CALL TO ACTION (CTA grand end banner)
         ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-primary to-indigo-900 text-white rounded-[28px] p-8 sm:p-12 shadow-xl space-y-6 relative overflow-hidden">
          {/* Accent decoration rings */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-12 translate-y-12 blur-xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">{t('readyToBegin')}</h2>
          <p className="text-sm sm:text-base text-slate-200 font-semibold leading-relaxed max-w-lg mx-auto">
            {t('readyToBeginSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <button
              type="button"
              onClick={() => { resetAllData(); setActiveDialog('register'); }}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-primary font-extrabold text-xs py-3.5 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">rocket_launch</span>
              <span>{t('getStarted')}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveDialog('login')}
              className="w-full sm:w-auto bg-transparent hover:bg-white/10 border border-white/20 text-white font-extrabold text-xs py-3.5 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">login</span>
              <span>{t('alreadyAccount') ? t('alreadyAccount').replace('Already have an account? ', '') : 'Log In'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────
         FOOTER
         ───────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-auto text-[10px] text-slate-400 text-center select-none py-6 border-t border-slate-200 bg-white w-full">
        {t('footerText') || "Saranathan College of Engineering • Panjappur, Trichy"}
      </footer>

      {/* ─────────────────────────────────────────────────
         AUTHENTICATION DIALOG MODALS
         ───────────────────────────────────────────────── */}

      {/* LOGIN DIALOG MODAL */}
      {activeDialog === 'login' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <div 
            className="bg-white border border-slate-200 text-slate-800 rounded-[24px] w-full max-w-[440px] p-7 sm:p-8 text-left relative animate-scale-up"
            style={{ boxShadow: '0 20px 50px rgba(15,23,42,0.22)' }}
          >
            {/* Close Button */}
            <button
              onClick={() => { setActiveDialog(null); setErrorMsg(''); }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-[20px] select-none">close</span>
            </button>

            {/* Logo and Heading */}
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px] font-bold">account_balance</span>
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide text-primary uppercase">SCE PathMate</h4>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">
                  {t('authGate')}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-extrabold tracking-tight text-slate-800">{t('welcomeBack')}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">{t('loginSubtitle')}</p>

            {/* Error Message alert block */}
            {errorMsg && (
              <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl p-3.5 mt-4 text-xs font-semibold flex items-start gap-2 animate-slide-up">
                <span className="material-symbols-outlined text-[16px] text-red-600 flex-shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 pt-4">
              
              {/* Username Input */}
              <div className="space-y-1 text-left">
                <label htmlFor="modal-username" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('username')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px] select-none">person</span>
                  <input
                    id="modal-username"
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorMsg(''); }}
                    placeholder={t('username')}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150 text-slate-800 placeholder:text-slate-400/80"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="modal-password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('password')}
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(t('passwordRecoveryAlert'))}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400 text-[18px] select-none">lock</span>
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all duration-150 text-slate-800 placeholder:text-slate-400/80"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[18px] select-none">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 select-none pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded border-slate-350 cursor-pointer"
                  disabled={loading}
                />
                <span>{t('rememberMe')}</span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primaryHover text-white font-extrabold text-sm py-3 px-4 rounded-full disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-2 mt-2 min-h-[48px] active:scale-[0.98]"
                style={{ boxShadow: '0 4px 12px rgba(27,77,166,0.2)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px] font-bold">login</span>
                    <span>{t('login')}</span>
                  </>
                )}
              </button>
            </form>

            {/* Create Account Selector link */}
            <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs">
              <span className="text-slate-450 font-semibold">{t('firstTime')}</span>
              <button
                type="button"
                onClick={() => { setActiveDialog('register'); setErrorMsg(''); }}
                className="ml-1.5 font-bold text-primary hover:underline cursor-pointer"
                disabled={loading}
              >
                {t('createAccount')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN ONBOARDING STEPPER (REGISTER MODE) */}
      {activeDialog === 'register' && (
        <Onboarding 
          isOpen={true} 
          onClose={() => setActiveDialog(null)} 
          onOpenLogin={() => setActiveDialog('login')}
        />
      )}

    </div>
  );
};

export default Welcome;
