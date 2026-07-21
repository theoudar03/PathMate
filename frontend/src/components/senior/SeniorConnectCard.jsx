import React from 'react';

const SeniorConnectCard = ({ senior, index }) => {
  const department = senior.department || senior.branch || 'Engineering';
  const year = senior.year || 'Final Year';
  const skills = Array.isArray(senior.skills) ? senior.skills : (senior.skills ? JSON.parse(senior.skills) : []);
  const domains = Array.isArray(senior.domains) ? senior.domains : (senior.domains ? JSON.parse(senior.domains) : []);
  const areas = senior.areas || [...skills, ...domains];
  const email = senior.email || senior.contact || 'mentor@saranathan.ac.in';
  const linkedin = senior.linkedin_url || senior.linkedin;
  const availability = senior.availability || 'Available for Freshers';

  return (
    <div
      className={`bg-surfaceContainerLowest border border-surfaceVariant rounded-2xl p-5 shadow-elevation1 hover:shadow-elevation2 hover:border-primary/30 transition-all duration-200 ease-out flex flex-col justify-between stagger-item stagger-delay-${(index % 8) + 1}`}
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <span className="inline-flex items-center gap-1 bg-secondaryContainer text-onSecondaryContainer px-2.5 py-0.5 rounded-full text-[10px] font-bold truncate max-w-[200px]">
            {department}
          </span>
          <span className="text-[10px] font-sans font-semibold text-onSurfaceVariant flex items-center gap-0.5 flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[14px] align-middle select-none">school</span>
            {year}
          </span>
        </div>

        {/* Profile Photo & Details */}
        <div className="flex items-center gap-3 mb-3 text-left">
          {senior.profile_photo ? (
            <img src={senior.profile_photo} alt={senior.name} className="w-11 h-11 rounded-full object-cover border border-outline/30 flex-shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0 border border-primary/20">
              {senior.name ? senior.name.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase() : 'SR'}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-bold text-onSurface truncate">
              {senior.name}
            </h3>
            <p className="text-[11px] text-onSurfaceVariant flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-green-600">schedule</span>
              {availability}
            </p>
          </div>
        </div>

        {/* Mentorship Topics / Skills */}
        {areas.length > 0 && (
          <div className="my-3 font-sans text-xs text-left">
            <span className="text-onSurfaceVariant block mb-1.5 font-medium">Domain Expertise & Skills:</span>
            <div className="flex flex-wrap gap-1">
              {areas.map(topic => (
                <span
                  key={topic}
                  className="px-2 py-0.5 bg-secondaryContainer text-onSecondaryContainer rounded-full text-[10px] font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Senior Peer Tip */}
        <div className="bg-surfaceContainerLow/85 rounded-xl p-3.5 border-l-4 border-primary my-3 font-sans text-xs text-left">
          <span className="block text-[10px] font-bold text-onSurfaceVariant/85 uppercase tracking-wider mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-primary text-[15px] align-middle select-none">military_tech</span>
            Senior Guidance & Support
          </span>
          <p className="text-onSurfaceVariant italic leading-relaxed text-[11px]">
            "{senior.tip || 'Reach out anytime for lab guidance, exam prep strategy, and placement advice.'}"
          </p>
        </div>
      </div>

      {/* Action Shortcut */}
      <div className="flex gap-2 mt-2">
        <a
          href={`mailto:${email}?subject=PathMate Freshman Inquiry`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-[#123669] text-onPrimary text-xs font-bold py-2.5 px-3 rounded-full transition-all active:scale-[0.98] outline-none shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">mail</span>
          <span>Email Mentor</span>
        </a>

        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full border border-outline/40 hover:bg-slate-100 text-primary transition-colors flex items-center justify-center"
            title="LinkedIn Profile"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default SeniorConnectCard;
