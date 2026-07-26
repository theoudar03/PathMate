import React, { useState } from 'react';
import { AlertOctagon, Phone, X, ShieldAlert, HeartPulse, UserCheck } from 'lucide-react';

const EmergencyButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      role: 'Boys Hostel Contacts',
      people: [
        { name: 'Mr. Senthil Balaji', number: '97866 02444' },
        { name: 'Mr. Ganapathy', number: '80563 78804' }
      ],
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">person_check</span>
    },
    {
      role: 'Girls Hostel Contacts',
      people: [
        { name: 'Dr. M.Santhi', number: '9443247249' },
        { name: 'Ms.Kalpana', number: '8667861938' },
        { name: 'Ms. Sarojini', number: '7708032282' }
      ],
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">person_check</span>
    },
    {
      role: 'SCE Campus Medical Room',
      people: [
        { name: 'Resident Medical Officer / Ambulance', number: '+91-8765432109' }
      ],
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">medical_services</span>
    },
    {
      role: 'Anti-Ragging Committee',
      people: [
        { name: 'Dr.D.Valavan', number: '8489915201' },
        { name: 'Dr.L.Muruganandam', number: '9486606545' },
        { name: 'Dr.M.Padmaa', number: '9894055910' },
        { name: 'Mr.P.Nixon (Inspector of Police)', number: '9498164033' }
      ],
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">gpp_maybe</span>
    }
  ];

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Persistent Floating Emergency Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5 animate-fade-in">
        <span className="text-[10px] font-black text-error bg-white px-2 py-0.5 rounded-md shadow-sm border border-error/20 tracking-wider uppercase">
          Emergency
        </span>
        <button
          type="button"
          onClick={handleToggle}
          className="w-14 h-14 bg-error text-onError rounded-2xl shadow-elevation3 hover:bg-[#991515] transition-all flex items-center justify-center border-none hover:scale-105 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Open emergency contacts panel"
          aria-expanded={isOpen}
        >
          <span className="material-symbols-outlined text-[24px] select-none align-middle">emergency</span>
        </button>
      </div>

      {/* Emergency Modal Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-dialog-title"
        >
          {/* Modal Card */}
          <div className="bg-surfaceContainerHigh border border-outline/35 rounded-2xl shadow-elevation3 w-full max-w-md p-6 relative overflow-hidden">
            {/* Warning top stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />

            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error select-none text-[24px] align-middle">warning</span>
                <h2 id="emergency-dialog-title" className="text-lg font-bold text-onSurface font-sans flex items-center gap-1.5">
                  SCE Emergency Contacts
                </h2>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="text-onSurfaceVariant hover:text-onSurface p-1.5 rounded-full hover:bg-surfaceVariant transition-colors flex items-center justify-center"
                aria-label="Close emergency contacts panel"
              >
                <span className="material-symbols-outlined text-[20px] select-none align-middle">close</span>
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-4 font-sans text-left">
              If you feel unsafe, require immediate medical attention, or want to report a welfare incident, please dial the numbers below.
            </p>

            {/* Contacts Roster */}
            <div className="space-y-3 font-sans max-h-[50vh] overflow-y-auto pr-1">
              {contacts.map((contact, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3.5 bg-surfaceVariant/40 p-3.5 rounded-xl border border-outline/15"
                >
                  {contact.icon}
                  <div className="flex-1 text-left space-y-2">
                    <span className="block text-xs font-black text-onSurface leading-none uppercase tracking-wider">
                      {contact.role}
                    </span>
                    <div className="space-y-2 pt-1">
                      {contact.people.map((person, pIdx) => (
                        <div key={pIdx} className="flex justify-between items-center gap-2 border-t border-outline/5 pt-1.5 first:border-0 first:pt-0">
                          <span className="block text-[11px] font-bold text-onSurfaceVariant leading-none">
                            {person.name}
                          </span>
                          <a
                            href={`tel:${person.number.replace(/\s+/g, '')}`}
                            className="inline-flex items-center gap-1 text-[10.5px] text-error hover:text-[#991515] font-black transition-all hover:underline"
                          >
                            <span className="material-symbols-outlined text-[12px] align-middle select-none">phone</span>
                            <span>{person.number}</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer advice */}
            <div className="mt-5 text-center font-sans">
              <button
                type="button"
                onClick={handleToggle}
                className="w-full bg-primary hover:bg-[#123669] text-onPrimary text-xs font-semibold py-2.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Return to Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyButton;
