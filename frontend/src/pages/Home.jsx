import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import TranslateText from '../components/common/TranslateText';
import FloatingNotice from '../components/notices/FloatingNotice';
import { Bell, AlertCircle, Clock, X, CheckSquare, Bus } from 'lucide-react';
import ToDoWidget from '../components/todo/ToDoWidget';
import ActivityManagerModal from '../components/todo/ActivityManagerModal';
import BusRouteWidget from '../components/dashboard/BusRouteWidget';
import StatCard from '../components/home/StatCard';
import DiscoverBook from '../components/home/DiscoverBook';
import CampusGallery from '../components/home/CampusGallery';
import FresherChecklist from '../components/home/FresherChecklist';

// Campus SVG Illustration
const CampusIllustration = () => (
  <svg
    viewBox="0 0 320 240"
    className="w-full h-auto max-w-[280px] sm:max-w-[320px] mx-auto select-none opacity-95 transition-all duration-300 hover:scale-[1.03]"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Soft radial highlight behind building */}
    <circle cx="160" cy="120" r="100" fill="url(#grad-enterprise)" />

    {/* Winding Pathway */}
    <path d="M160 160 C 130 180, 110 200, 90 230" stroke="#1B4DA6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 4" opacity="0.35" />
    <path d="M160 160 C 180 185, 205 210, 230 230" stroke="#1B4DA6" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 4" opacity="0.35" />

    {/* Left Tree */}
    <path d="M70 180 V205" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M70 180 C55 180, 45 170, 50 155 C50 145, 60 135, 70 140 C80 135, 90 145, 90 155 C95 170, 85 180, 70 180 Z" fill="#DBEAFE" stroke="#1B4DA6" strokeWidth="1.5" />

    {/* Right Tree */}
    <path d="M250 180 V205" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M250 180 C235 180, 225 170, 230 155 C230 145, 240 135, 250 140 C260 135, 270 145, 270 155 C275 170, 265 180, 250 180 Z" fill="#E0E7FF" stroke="#4A5568" strokeWidth="1.5" />

    {/* Building base */}
    <rect x="95" y="115" width="130" height="50" rx="4" fill="#FFFFFF" stroke="#1B4DA6" strokeWidth="2" />
    {/* Central Pillar */}
    <rect x="145" y="100" width="30" height="65" rx="3" fill="#F0F4FF" stroke="#1B4DA6" strokeWidth="2" />
    {/* Door arch */}
    <path d="M152 165 V150 C152 145, 168 145, 168 150 V165" fill="#1B4DA6" opacity="0.08" stroke="#1B4DA6" strokeWidth="1.5" />
    {/* Columns */}
    <line x1="108" y1="125" x2="108" y2="155" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="122" y1="125" x2="122" y2="155" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="198" y1="125" x2="198" y2="155" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="212" y1="125" x2="212" y2="155" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />

    {/* Windows */}
    <rect x="104" y="122" width="8" height="10" rx="1" fill="#EFF6FF" stroke="#1B4DA6" strokeWidth="1" />
    <rect x="118" y="122" width="8" height="10" rx="1" fill="#EFF6FF" stroke="#1B4DA6" strokeWidth="1" />
    <rect x="194" y="122" width="8" height="10" rx="1" fill="#EFF6FF" stroke="#1B4DA6" strokeWidth="1" />
    <rect x="208" y="122" width="8" height="10" rx="1" fill="#EFF6FF" stroke="#1B4DA6" strokeWidth="1" />

    {/* Dome */}
    <path d="M145 100 C145 80, 175 80, 175 100 Z" fill="#DBEAFE" stroke="#1B4DA6" strokeWidth="2" />
    <line x1="160" y1="80" x2="160" y2="60" stroke="#1B4DA6" strokeWidth="1.5" />
    <path d="M160 63 L172 68 L160 73 Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" />

    {/* AI Sparkles */}
    <g transform="translate(240, 50)" opacity="0.8">
      <path d="M0 8 C0 8, 3 5, 8 5 C3 5, 0 2, 0 2 C0 2, -3 5, -8 5 C-3 5, 0 8, 0 8 Z" fill="#F59E0B" />
    </g>
    <g transform="translate(60, 95)" opacity="0.6">
      <path d="M0 6 C0 6, 2 4, 6 4 C2 4, 0 1, 0 1 C0 1, -2 4, -6 4 C-2 4, 0 6, 0 6 Z" fill="#F59E0B" />
    </g>
    <g transform="translate(265, 110)" opacity="0.7">
      <circle cx="0" cy="0" r="2.5" fill="#F59E0B" />
    </g>

    <defs>
      <radialGradient id="grad-enterprise" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1B4DA6" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#1B4DA6" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

// Per-action accent colors
const ACTION_ACCENTS = [
  { bg: 'bg-blue-50',   iconBg: 'bg-blue-100',   icon: 'text-blue-600',   glow: '0 0 20px rgba(37,99,235,0.14)',   border: 'border-blue-100' },
  { bg: 'bg-purple-50', iconBg: 'bg-purple-100',  icon: 'text-purple-600', glow: '0 0 20px rgba(124,58,237,0.14)', border: 'border-purple-100' },
  { bg: 'bg-emerald-50',iconBg: 'bg-emerald-100', icon: 'text-emerald-600',glow: '0 0 20px rgba(5,150,105,0.14)',  border: 'border-emerald-100' },
  { bg: 'bg-amber-50',  iconBg: 'bg-amber-100',   icon: 'text-amber-600',  glow: '0 0 20px rgba(217,119,6,0.14)',  border: 'border-amber-100' },
];

const Home = () => {
  const { studentData, t, dbReadNotices, markNoticeReadDb } = useApp();
  const navigate = useNavigate();
  const name = studentData.name || 'Freshman';

  const [notices, setNotices] = useState([]);
  const [showNoticeBoard, setShowNoticeBoard] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Read-tracking via DB-backed context (falls back to localStorage if unauthenticated)
  const readNoticeIds = new Set(dbReadNotices);
  const unreadNotices = notices.filter(n => !readNoticeIds.has(n.id));

  const markNoticeRead = (noticeId) => {
    markNoticeReadDb(noticeId);
  };

  const markAllNoticesRead = () => {
    notices.forEach(n => markNoticeReadDb(n.id));
  };

  // Activity Manager Modal state
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [todoDefaultTab, setTodoDefaultTab] = useState('all');
  const [todoRefreshTrigger, setTodoRefreshTrigger] = useState(0);
  const [showBusRoutes, setShowBusRoutes] = useState(false);

  const openTodoModal = (tab = 'all') => {
    setTodoDefaultTab(tab);
    setShowTodoModal(true);
  };

  // Fetch notices for the side drawer
  useEffect(() => {
    fetch('/api/notices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotices(data);
      })
      .catch(err => console.error('Failed to fetch notices:', err));
  }, []);

  const stats = [
    { label: 'Established',      value: '1998',          icon: 'history_edu' },
    { label: 'NBA Accreditation',value: '7 Departments',  icon: 'military_tech' },
    { label: 'Accreditation',    value: 'NAAC A+',        icon: 'verified' },
    { label: 'Affiliation',      value: 'Anna University',icon: 'workspace_premium' },
    { label: 'Campus Size',      value: '40+ Acres',      icon: 'filter_hdr' },
    { label: 'Specialities',     value: '9 Departments',  icon: 'layers' },
  ];

  const quickActions = [
    { titleKey: 'actionFindClubs',  subtitleKey: 'actionFindClubsSub',  icon: 'explore',   path: '/clubs' },
    { titleKey: 'actionAssistant',  subtitleKey: 'actionAssistantSub',  icon: 'chat',      path: '/chatbot' },
    { titleKey: 'actionCampusMap',  subtitleKey: 'actionCampusMapSub',  icon: 'map',       path: '/map' },
    { titleKey: 'actionStudyHub',   subtitleKey: 'actionStudyHubSub',   icon: 'school',    path: '/study-hub' },
  ];

  // Current day/date
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-5xl mx-auto text-left">

      {/* ── 1. HERO SECTION ──────────────────────────────────────── */}
      <div
        className="bg-white border border-outline/50 rounded-[24px] p-7 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 stagger-item stagger-delay-1"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)', borderLeft: '3px solid #1B4DA6' }}
      >
        <div className="flex-1 space-y-4 text-left">
          {/* Date + Notice Count Pill */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-primary uppercase tracking-widest bg-primaryContainer px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[13px] select-none">school</span>
              <TranslateText text="studentDeskLabel" />
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-onSurfaceVariant bg-surfaceVariant/50 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {dayName}, {dateStr}
            </span>
            {unreadNotices.length > 0 && (
              <button
                onClick={() => setShowNoticeBoard(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Bell size={11} />
                {unreadNotices.length} new {unreadNotices.length === 1 ? 'notice' : 'notices'}
              </button>
            )}
          </div>

          <h1 className="text-3xl md:text-[2.6rem] font-black text-onSurface leading-tight tracking-tight">
            <TranslateText text="welcomeTitleUser" />
            {' '}<span className="text-primary">{name}</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-onSurfaceVariant leading-snug">
            <TranslateText text="companionReady" />
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate('/clubs')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primaryHover text-white text-[13px] font-bold py-2.5 px-5 rounded-full transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.2), 0 4px 12px rgba(27,77,166,0.16)' }}
            >
              <span>{t('clubs')}</span>
              <span className="material-symbols-outlined text-[15px] select-none">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/chatbot')}
              className="inline-flex items-center gap-2 bg-white border border-outline/70 text-primary text-[13px] font-bold py-2.5 px-5 rounded-full hover:bg-surfaceContainer hover:border-primary/40 transition-all duration-150 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[15px] select-none">chat</span>
              <span>{t('assistant')}</span>
            </button>
          </div>
        </div>
        <div className="w-full md:w-2/5 flex-shrink-0 flex items-center justify-center">
          <CampusIllustration />
        </div>
      </div>

      {/* ── 2. QUICK ACTIONS ─────────────────────────────────────── */}
      <div className="space-y-4 stagger-item stagger-delay-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
            <TranslateText text="quickActions" />
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, idx) => {
            const accent = ACTION_ACCENTS[idx % ACTION_ACCENTS.length];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => navigate(action.path)}
                className={`bg-white border rounded-[20px] p-4 sm:p-5 flex flex-col justify-between cursor-pointer transition-all duration-180 group active:scale-[0.98] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${accent.border} relative overflow-hidden`}
                style={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)',
                  transition: 'box-shadow 180ms ease-out, transform 180ms ease-out',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.06), 0 12px 28px rgba(15,23,42,0.10), ${accent.glow}`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Ripple glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                     style={{ background: `radial-gradient(ellipse at 30% 30%, ${accent.glow.split('rgba')[1]?.replace(',0.14)', ',0.06)') || 'transparent'}, transparent 70%)` }} />
                <div>
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${accent.iconBg} flex items-center justify-center mb-3 sm:mb-4 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3`}>
                    <span className={`material-symbols-outlined text-[20px] sm:text-[22px] select-none ${accent.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {action.icon}
                    </span>
                  </div>
                  <h3 className="text-[13px] sm:text-[14px] font-extrabold text-onSurface mb-0.5 group-hover:text-primary transition-colors duration-150">
                    {t(action.titleKey)}
                  </h3>
                  <p className="text-[11px] sm:text-[12px] text-onSurfaceVariant leading-normal">
                    {t(action.subtitleKey)}
                  </p>
                </div>
                <div className="flex justify-end mt-3 sm:mt-4 w-full">
                  <span className="material-symbols-outlined text-onSurfaceVariant/50 text-[18px] group-hover:text-primary group-hover:translate-x-1 transition-all duration-150 select-none">
                    arrow_forward
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. PERSONAL TO-DO & ACTIVITY MANAGER WIDGET ───────────── */}
      <div className="stagger-item stagger-delay-3">
        <ToDoWidget
          onOpenModal={openTodoModal}
          refreshTrigger={todoRefreshTrigger}
        />
      </div>

      {/* ── 4. CAMPUS SNAPSHOT (Animated Count-Up Cards) ────────── */}
      <div className="space-y-4 stagger-item stagger-delay-4">
        <h2 className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">
          <TranslateText text="snapshotTitle" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} idx={idx} />
          ))}
        </div>
      </div>

      {/* ── 5. DISCOVER SARANATHAN (Interactive Book) ───────────── */}
      <div className="stagger-item stagger-delay-5">
        <DiscoverBook />
      </div>

      {/* ── 6. CAMPUS GALLERY ────────────────────────────────────── */}
      <div className="stagger-item">
        <CampusGallery />
      </div>

      {/* ── 7. FRESHER ONBOARDING CHECKLIST ──────────────────────── */}
      <div className="stagger-item">
        <FresherChecklist />
      </div>

      {/* ── 8. CTA SECTION ───────────────────────────────────────── */}
      <div
        className="bg-white border border-outline/40 rounded-[24px] p-7 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 stagger-item relative overflow-hidden"
        style={{ borderLeft: '3px solid #1B4DA6', boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(15,23,42,0.06)' }}
      >
        {/* Subtle background accent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(27,77,166,0.04), transparent 70%)' }}
        />
        <div className="flex gap-4 items-start text-left relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primaryContainer flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[24px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>
              explore
            </span>
          </div>
          <div>
            <h2 className="text-[17px] font-black text-onSurface leading-snug tracking-tight">
              <TranslateText text="Explore your college confidently" />
            </h2>
            <p className="text-[12px] text-onSurfaceVariant mt-1.5 max-w-xl leading-relaxed">
              <TranslateText text="Discover student clubs, navigate campus, connect with seniors, and ask PathMate anything." />
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button
            type="button"
            onClick={() => navigate('/clubs')}
            className="inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-primaryHover text-white text-[13px] font-bold py-2.5 px-6 rounded-full transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ boxShadow: '0 1px 3px rgba(27,77,166,0.22), 0 4px 12px rgba(27,77,166,0.18)' }}
          >
            <span>{t('clubs')}</span>
            <span className="material-symbols-outlined text-[15px] align-middle select-none">arrow_forward</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/chatbot')}
            className="inline-flex items-center justify-center gap-1.5 bg-white border border-outline/60 text-primary text-[13px] font-bold py-2.5 px-6 rounded-full hover:bg-surfaceContainer hover:border-primary/40 transition-all duration-150 active:scale-[0.98]"
          >
            <span>{t('assistant')}</span>
          </button>
        </div>
      </div>

      {/* ── 9. FLOATING SIDEBAR BUTTONS ────────────────────────── */}
      
      {/* Floating Notice Toggle Button */}
      {notices.length > 0 && (
        <button
          onClick={() => setShowNoticeBoard(true)}
          className="fixed top-32 right-0 z-40 bg-primary text-white shadow-lg hover:pr-5 hover:bg-primaryHover transition-all flex items-center gap-2 py-3 px-4 rounded-l-2xl border border-r-0 border-white/20"
        >
          <Bell size={20} className="animate-pulse" />
          <span className="font-bold text-sm hidden sm:block">Notices</span>
          {unreadNotices.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full absolute -top-1 -left-1 border border-white">
              {unreadNotices.length}
            </span>
          )}
        </button>
      )}

      {/* Floating Activity Manager Toggle Button */}
      <button
        onClick={() => openTodoModal('all')}
        className="fixed top-48 right-0 z-40 bg-indigo-700 text-white shadow-lg hover:pr-5 hover:bg-indigo-800 transition-all flex items-center gap-2 py-3 px-4 rounded-l-2xl border border-r-0 border-white/20"
        title="Open Activity Manager & To-Do companion"
      >
        <CheckSquare size={20} />
        <span className="font-bold text-sm hidden sm:block">My To-Do</span>
      </button>
 
      {/* Floating Bus Routes Toggle Button */}
      {(studentData?.travel_mode === 'college_bus' || (studentData?.gender === 'Female' && studentData?.isHosteller === true)) && (
        <button
          onClick={() => setShowBusRoutes(true)}
          className="fixed top-64 right-0 z-40 bg-emerald-600 text-white shadow-lg hover:pr-5 hover:bg-emerald-700 transition-all flex items-center gap-2 py-3 px-4 rounded-l-2xl border border-r-0 border-white/20"
          title="Open Today's Bus Routes"
        >
          <Bus size={20} />
          <span className="font-bold text-sm hidden sm:block">Bus Routes</span>
        </button>
      )}

      {/* ── 10. PORTAL DRAWERS & MODALS ────────────────────────── */}
      {createPortal(
        <>
          {/* Overlay for Notice Drawer */}
          {showNoticeBoard && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity"
              onClick={() => setShowNoticeBoard(false)}
            />
          )}

          {/* Side Drawer Panel */}
          <div 
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col ${showNoticeBoard ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="px-6 py-5 border-b border-outline/20 bg-primary text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Bell size={22} />
                <h2 className="text-xl font-black tracking-tight">Notice Board</h2>
              </div>
              <div className="flex items-center gap-2">
                {unreadNotices.length > 0 && (
                  <button 
                    onClick={markAllNoticesRead}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold py-1.5 px-3 rounded-full transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={() => setShowNoticeBoard(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="divide-y divide-outline/10">
                {notices.map(notice => {
                  const isRead = readNoticeIds.has(notice.id);
                  return (
                    <div 
                      key={notice.id}
                      onClick={() => {
                        setSelectedNotice(notice);
                        setShowNoticeBoard(false);
                      }}
                      className={`px-6 py-5 bg-white hover:bg-surfaceContainer cursor-pointer transition-colors group flex items-start gap-4 ${isRead ? 'opacity-60' : ''}`}
                    >
                      <div className="mt-1 flex-shrink-0 flex items-center justify-center w-5 h-5">
                        {isRead ? (
                          <span className="material-symbols-outlined text-[18px] text-slate-400 select-none">mark_email_read</span>
                        ) : notice.priority === 'urgent' ? (
                          <AlertCircle size={20} className="text-red-500" />
                        ) : notice.priority === 'high' ? (
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-sm leading-tight mb-2 group-hover:text-primary transition-colors ${isRead ? 'font-medium text-slate-500' : 'font-extrabold text-onSurface'}`}>
                          {notice.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-onSurfaceVariant font-semibold">
                          <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                            <Clock size={12} />
                            {new Date(notice.created_at || notice.publishedAt).toLocaleDateString()}
                          </span>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-md capitalize">
                            {notice.priority}
                          </span>

                          {(() => {
                            const atts = notice.attachments || [];
                            const imgCount = atts.filter(a => a.file_type === 'image').length;
                            const pdfCount = atts.filter(a => a.file_type === 'pdf').length;
                            if (imgCount > 0 && pdfCount > 0) {
                              return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-extrabold">🖼 + 📄 Mixed</span>;
                            } else if (imgCount > 0) {
                              return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-extrabold">🖼 {imgCount} {imgCount > 1 ? 'Images' : 'Image'}</span>;
                            } else if (pdfCount > 0) {
                              return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-extrabold">📄 PDF</span>;
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Overlay for Bus Routes Drawer */}
          {showBusRoutes && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity"
              onClick={() => setShowBusRoutes(false)}
            />
          )}

          {/* Side Drawer Panel for Bus Routes */}
          <div 
            className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col ${showBusRoutes ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="px-6 py-5 border-b border-outline/20 bg-emerald-600 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Bus size={22} />
                <h2 className="text-xl font-black tracking-tight">Today's Bus Routes</h2>
              </div>
              <button 
                onClick={() => setShowBusRoutes(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              <BusRouteWidget isSidebar={true} />
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Floating Notice Reader */}
      {selectedNotice && (
        <FloatingNotice 
          notice={selectedNotice} 
          onClose={() => setSelectedNotice(null)} 
          onMarkRead={markNoticeRead}
        />
      )}

      {/* Personal Activity Manager Companion Popup */}
      <ActivityManagerModal
        isOpen={showTodoModal}
        onClose={() => setShowTodoModal(false)}
        defaultTab={todoDefaultTab}
        onTaskChanged={() => setTodoRefreshTrigger(prev => prev + 1)}
      />

    </div>
  );
};

export default Home;
