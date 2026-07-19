import React from 'react';
import { Languages } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' }
];

const LangToggle = () => {
  const { language, setLanguage } = useApp();

  return (
    <div className="flex items-center gap-2" role="region" aria-label="Language Selector">
      <span className="material-symbols-outlined text-[18px] text-onSurfaceVariant select-none align-middle">translate</span>
      <div className="inline-flex rounded-full border border-outline/35 bg-surfaceContainerLow p-0.5 overflow-hidden shadow-sm">
        {LANG_OPTIONS.map((lang, index) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={isActive}
              className={`px-3 py-1.5 text-xs font-bold font-sans transition-all duration-150 relative cursor-pointer active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 outline-none ${
                index > 0 ? 'border-l border-outline/10' : ''
              } ${
                isActive
                  ? 'bg-primary text-white rounded-full font-extrabold shadow-sm z-10'
                  : 'text-onSurfaceVariant hover:bg-primaryContainer/20 hover:text-primary rounded-full'
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LangToggle;

