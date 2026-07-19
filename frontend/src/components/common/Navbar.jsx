import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import LangToggle from '../onboarding/LangToggle';
import { useApp } from '../../contexts/AppContext';

// Main navigation items
const MAIN_NAV_LINKS = [
  { path: '/', label: 'Home', icon: 'home', exact: true },
  { path: '/dashboard', label: 'Dashboard', icon: 'person' },
  { path: '/clubs', label: 'Clubs & Events', icon: 'explore' },
  { path: '/connect', label: 'Connect', icon: 'groups' },
];

// Campus info sub-items (grouped under 'Campus Info' dropdown on desktop)
const CAMPUS_INFO_LINKS = [
  { path: '/faculty', label: 'Faculty Directory', icon: 'badge' },
  { path: '/map', label: 'Campus Map', icon: 'map' },
];

const STUDY_HUB_LINK = { path: '/study-hub', label: 'Study Hub', icon: 'school' };
const CHATBOT_LINK = { path: '/chatbot', label: 'AI Assistant', icon: 'chat' };

// Flattened list for mobile drawer
const MOBILE_NAV_LINKS = [
  ...MAIN_NAV_LINKS,
  ...CAMPUS_INFO_LINKS,
  STUDY_HUB_LINK,
  CHATBOT_LINK,
];

const Navbar = () => {
  const { onboarded, resetAllData, t, studentData, language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();
  const closeTimeoutRef = useRef(null);
  const moreTimeoutRef = useRef(null);

  const initials = studentData?.name
    ? studentData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PM';

  const handleLogout = () => {
    if (window.confirm(t('confirmLogout'))) {
      resetAllData();
      navigate('/welcome');
    }
  };

  // Resize listener to adapt nav elements
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isConstrained = windowWidth < 1100 || language !== 'en';

  const visibleLinks = isConstrained
    ? MAIN_NAV_LINKS.slice(0, 2) // Home, Dashboard
    : MAIN_NAV_LINKS;

  const overflowLinks = isConstrained
    ? MAIN_NAV_LINKS.slice(2) // Clubs, Connect
    : [];

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsDropdownOpen(prev => !prev);
  };

  const handleMoreMouseEnter = () => {
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    setIsMoreOpen(true);
  };

  const handleMoreMouseLeave = () => {
    moreTimeoutRef.current = setTimeout(() => {
      setIsMoreOpen(false);
    }, 200);
  };

  const handleMoreClick = (e) => {
    e.stopPropagation();
    if (moreTimeoutRef.current) clearTimeout(moreTimeoutRef.current);
    setIsMoreOpen(prev => !prev);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleDocumentClick = () => {
      setIsDropdownOpen(false);
      setIsMoreOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Close dropdowns on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if any overflow route is active to highlight "More" dropdown
  const isOverflowActive = () => {
    return overflowLinks.some(link => window.location.pathname === link.path);
  };

  return (
    <nav
      className="bg-white text-onSurface sticky top-0 z-40 font-sans"
      style={{ boxShadow: '0 1px 0 #E2E8F0, 0 2px 8px rgba(15,23,42,0.05)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* ── Brand ─────────────────────────────────────────── */}
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer flex-shrink-0 focus-visible:outline-none group"
            onClick={() => navigate(onboarded ? '/' : '/welcome')}
          >
            <div
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:shadow-glow-primary"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[18px] select-none text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                account_balance
              </span>
            </div>
            <div className="text-left flex flex-col justify-center">
              <span className="block font-display text-sm font-black tracking-tight leading-none text-onSurface">
                SCE PathMate
              </span>
              <span className="block text-[9px] text-onSurfaceVariant tracking-widest uppercase font-bold mt-0.5">
                {t('freshersPortal')}
              </span>
            </div>
          </button>

          {/* ── Desktop Navigation ────────────────────────────── */}
          {onboarded && (
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center mx-4">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary whitespace-nowrap active:scale-[0.98] ${
                      isActive
                        ? 'bg-primaryContainer text-primary font-bold shadow-sm'
                        : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                    }`
                  }
                >
                  <span
                    className="material-symbols-outlined text-[16px] align-middle select-none flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 0" }}
                  >
                    {link.icon}
                  </span>
                  <span>{t(link.path === '/' ? 'home' : link.path.replace('/', ''))}</span>
                </NavLink>
              ))}

              {/* More Dropdown (if overflow is active) */}
              {overflowLinks.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={handleMoreMouseEnter}
                  onMouseLeave={handleMoreMouseLeave}
                >
                  <button
                    type="button"
                    onClick={handleMoreClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none whitespace-nowrap ${
                      isMoreOpen || isOverflowActive()
                        ? 'bg-primaryContainer text-primary font-bold shadow-sm'
                        : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                    }`}
                    aria-expanded={isMoreOpen}
                    aria-haspopup="true"
                  >
                    <span className="material-symbols-outlined text-[16px] align-middle select-none flex-shrink-0">more_horiz</span>
                    <span>{t('moreLabel')}</span>
                    <span
                      className="material-symbols-outlined text-[14px] align-middle select-none transition-transform duration-200"
                      style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none' }}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>

                  {isMoreOpen && (
                    <div
                      className="absolute top-full left-0 mt-2 w-56 bg-white border border-outline/60 rounded-[16px] p-1.5 z-50 animate-slide-down text-left"
                      style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.12), 0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                      {overflowLinks.map((link) => (
                        <NavLink
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsMoreOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] outline-none ${
                              isActive
                                ? 'bg-primaryContainer text-primary font-bold'
                                : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                            }`
                          }
                        >
                          <span
                            className="material-symbols-outlined text-[17px] select-none"
                            style={{ fontVariationSettings: "'FILL' 0" }}
                          >
                            {link.icon}
                          </span>
                          <span>{t(link.path.replace('/', ''))}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Campus Info Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={handleDropdownClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none whitespace-nowrap ${
                    isDropdownOpen || window.location.pathname === '/faculty' || window.location.pathname === '/map'
                      ? 'bg-primaryContainer text-primary font-bold shadow-sm'
                      : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                  }`}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle select-none flex-shrink-0">info</span>
                  <span>{t('campusInfo')}</span>
                  <span
                    className="material-symbols-outlined text-[14px] align-middle select-none transition-transform duration-200"
                    style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    keyboard_arrow_down
                  </span>
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-outline/60 rounded-[16px] p-1.5 z-50 animate-slide-down text-left"
                    style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.12), 0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    {CAMPUS_INFO_LINKS.map((subLink) => (
                      <NavLink
                        key={subLink.path}
                        to={subLink.path}
                        onClick={() => setIsDropdownOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] outline-none ${
                            isActive
                              ? 'bg-primaryContainer text-primary font-bold'
                              : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                          }`
                        }
                      >
                        <span
                          className="material-symbols-outlined text-[17px] select-none"
                          style={{ fontVariationSettings: "'FILL' 0" }}
                        >
                          {subLink.icon}
                        </span>
                        <span>{t(subLink.path.replace('/', ''))}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Study Hub Link */}
              <NavLink
                to={STUDY_HUB_LINK.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary whitespace-nowrap ${
                    isActive
                      ? 'bg-primaryContainer text-primary font-bold shadow-sm'
                      : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[16px] align-middle select-none flex-shrink-0">
                  {STUDY_HUB_LINK.icon}
                </span>
                <span>{t('studyHub')}</span>
              </NavLink>

              {/* Assistant Link */}
              <NavLink
                to={CHATBOT_LINK.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary whitespace-nowrap ${
                    isActive
                      ? 'bg-primaryContainer text-primary font-bold shadow-sm'
                      : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[16px] align-middle select-none flex-shrink-0">
                  {CHATBOT_LINK.icon}
                </span>
                <span>{t('assistant')}</span>
              </NavLink>
            </div>
          )}

          {/* ── Right Controls ────────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <LangToggle />
            {onboarded && (
              <div className="flex items-center gap-1.5 ml-0.5">
                {/* Avatar chip */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title={t('logout')}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-surfaceContainer hover:bg-surfaceContainerHigh border border-outline/40 transition-all duration-150 active:scale-[0.97] group"
                >
                  <div className="w-7 h-7 rounded-full bg-primaryContainer flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-primary select-none">{initials}</span>
                  </div>
                  <span
                    className="material-symbols-outlined text-[15px] select-none text-onSurfaceVariant group-hover:text-onSurface transition-colors"
                    title="Logout"
                  >
                    logout
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile Toggle ─────────────────────────────────── */}
          <div className="flex lg:hidden items-center gap-2">
            <LangToggle />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl hover:bg-surfaceContainer text-onSurfaceVariant transition-colors flex items-center justify-center active:scale-[0.95]"
              aria-expanded={isOpen}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[22px] select-none">
                {isOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      {isOpen && (
        <div className="lg:hidden border-t border-outline/30 bg-white px-3 pt-2 pb-5 space-y-0.5 animate-slide-down text-left">
          {onboarded && MOBILE_NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-primaryContainer text-primary font-bold'
                    : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px] select-none">{link.icon}</span>
              <span>{t(link.path === '/' ? 'home' : (link.path === '/chatbot' ? 'assistant' : link.path.replace('/', '')))}</span>
            </NavLink>
          ))}
          {onboarded && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); handleLogout(); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface font-semibold flex items-center gap-3 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[20px] select-none">logout</span>
              {t('logout')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

