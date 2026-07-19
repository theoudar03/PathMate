import React from 'react';

// Department codes verified against https://saranathan.ac.in/dept.php?dept={CODE}&tgt=faculty
// IMPORTANT: Civil and CSE(AI&ML) codes are NOT confirmed. Use '#' and mark as pending until verified
// against the live college website before the final demo.
const DEPARTMENTS = [
  { name: 'Computer Science & Engineering', shortName: 'CSE', code: 'CSE', confirmed: true, icon: 'terminal' },
  { name: 'Electronics & Communication Engineering', shortName: 'ECE', code: 'ECE', confirmed: true, icon: 'wifi' },
  { name: 'Electrical & Electronics Engineering', shortName: 'EEE', code: 'EEE', confirmed: true, icon: 'bolt' },
  { name: 'Information Technology', shortName: 'IT', code: 'IT', confirmed: true, icon: 'cloud' },
  { name: 'Artificial Intelligence & Data Science', shortName: 'AI&DS', code: 'AIDS', confirmed: true, icon: 'psychology' },
  { name: 'Instrumentation & Control Engineering', shortName: 'ICE', code: 'ICE', confirmed: true, icon: 'settings_input_component' },
  { name: 'Computer Science & Business Systems', shortName: 'CSBS', code: 'CSBS', confirmed: true, icon: 'business_center' },
  // --- All department links are now confirmed ---
  { name: 'Civil Engineering', shortName: 'Civil', code: 'CE', confirmed: true, icon: 'architecture' },
  { name: 'CSE (Artificial Intelligence & Machine Learning)', shortName: 'CSE(AI&ML)', code: 'AIML', confirmed: true, icon: 'smart_toy' },
];

const BASE_URL = 'https://saranathan.ac.in/dept.php?tgt=faculty&dept=';

const FacultyDirectory = () => {
  return (
    <div className="space-y-8 font-sans animate-fade-in py-6 max-w-4xl mx-auto text-left">
      {/* Header */}
      <div className="border-b border-outline/30 pb-6">
        <span className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">Campus Resources</span>
        <h1 className="text-3xl font-black text-onSurface mt-1 tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[28px] select-none" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          Faculty Directory
        </h1>
        <p className="text-sm text-onSurfaceVariant mt-2 leading-relaxed">
          Select your department to view the full faculty list on the official SCE college website. The page will open in a new tab.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-[16px] p-4 flex gap-3 text-xs text-blue-700 leading-relaxed">
        <span className="material-symbols-outlined text-blue-500 select-none text-[20px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>open_in_new</span>
        <p>
          Faculty profiles are maintained by the college directly at <strong className="text-blue-800">saranathan.ac.in</strong>. PathMate redirects you to the official page per department — no data is fetched or replicated inside this app.
        </p>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEPARTMENTS.map((dept) => {
          const href = dept.confirmed ? `${BASE_URL}${dept.code}` : '#';
          const isDisabled = !dept.confirmed;

          return (
            <a
              key={dept.shortName}
              href={href}
              target={dept.confirmed ? '_blank' : undefined}
              rel={dept.confirmed ? 'noopener noreferrer' : undefined}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
              className={`group flex flex-col gap-3 bg-white border rounded-[18px] p-5 transition-all duration-180 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                isDisabled
                  ? 'border-dashed border-outline/40 cursor-not-allowed opacity-60'
                  : 'border-outline/40 hover:-translate-y-1 cursor-pointer'
              }`}
              style={isDisabled ? {} : { boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(15,23,42,0.06)' }}
              onMouseEnter={isDisabled ? undefined : e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 12px 28px rgba(15,23,42,0.10), 0 0 20px rgba(27,77,166,0.10)'; }}
              onMouseLeave={isDisabled ? undefined : e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(15,23,42,0.06)'; }}
              aria-disabled={isDisabled}
              tabIndex={isDisabled ? -1 : 0}
            >
              {/* Icon + short name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[22px] select-none">{dept.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-wide">{dept.shortName}</span>
                </div>
                {isDisabled ? (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Link pending
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-onSurfaceVariant text-[18px] select-none group-hover:text-primary transition-colors">open_in_new</span>
                )}
              </div>

              {/* Full name */}
              <h3 className={`text-sm font-semibold leading-snug ${isDisabled ? 'text-onSurfaceVariant' : 'text-onSurface'}`}>
                {dept.name}
              </h3>

              {isDisabled && (
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Department URL code not yet verified. Check the live site and update before the final demo.
                </p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default FacultyDirectory;
