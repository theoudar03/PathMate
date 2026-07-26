import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const LANG_OPTIONS = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ta', label: 'தமிழ்',   short: 'TA', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी',  short: 'HI', flag: '🇮🇳' },
];

const LangToggle = () => {
  const { language, setLanguage } = useApp();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const active = LANG_OPTIONS.find(l => l.code === language) || LANG_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.label}`}
        title={`Language: ${active.label}`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-bold font-sans transition-all duration-150 active:scale-[0.96] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 select-none ${
          open
            ? 'bg-primaryContainer border-primary/40 text-primary shadow-sm'
            : 'bg-surfaceContainerLow border-outline/30 text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface hover:border-outline/50'
        }`}
      >
        <span
          className="material-symbols-outlined text-[15px] align-middle leading-none"
          style={{ fontVariationSettings: "'FILL' 0" }}
          aria-hidden="true"
        >
          translate
        </span>
        <span className="tracking-wider">{active.short}</span>
        <span
          className="material-symbols-outlined text-[13px] align-middle leading-none transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        >
          keyboard_arrow_down
        </span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-2 w-36 bg-white border border-outline/50 rounded-2xl p-1.5 z-50 animate-slide-down"
          style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.12), 0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {LANG_OPTIONS.map(lang => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={(e) => {
                  e.stopPropagation();
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] outline-none text-left cursor-pointer ${
                  isActive
                    ? 'bg-primaryContainer text-primary font-bold'
                    : 'text-onSurfaceVariant hover:bg-surfaceContainer hover:text-onSurface'
                }`}
              >
                <span className="text-base leading-none select-none" aria-hidden="true">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && (
                  <span
                    className="material-symbols-outlined text-[15px] ml-auto text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LangToggle;
