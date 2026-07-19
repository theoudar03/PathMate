import React, { useState } from 'react';
import { AlertOctagon, Phone, X, ShieldAlert, HeartPulse, UserCheck } from 'lucide-react';

const EmergencyButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const contacts = [
    {
      role: 'Chief Hostel Warden (Boys)',
      name: 'Prof. Hostel Welfare Warden',
      number: '+91-9876543210',
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">person_check</span>
    },
    {
      role: 'Chief Hostel Warden (Girls)',
      name: 'Dr. Hostel Welfare Warden',
      number: '+91-9876543211',
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">person_check</span>
    },
    {
      role: 'SCE Campus Medical Room',
      name: 'Resident Medical Officer / Ambulance',
      number: '+91-8765432109',
      icon: <span className="material-symbols-outlined text-error text-[24px] flex-shrink-0 select-none">medical_services</span>
    },
    {
      role: 'SCE Anti-Ragging Committee',
      name: 'Nodal Officer & Incident Desk',
      number: '+91-9988776655',
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
            <div className="space-y-3 font-sans">
              {contacts.map((contact, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3.5 bg-surfaceVariant/40 p-3.5 rounded-xl border border-outline/15"
                >
                  {contact.icon}
                  <div className="flex-1 text-left">
                    <span className="block text-xs font-bold text-onSurface leading-none">
                      {contact.role}
                    </span>
                    <span className="block text-[11px] text-onSurfaceVariant mt-1 leading-none">
                      {contact.name}
                    </span>
                    
                    {/* Dial button */}
                    <a
                      href={`tel:${contact.number}`}
                      className="inline-flex items-center gap-1.5 text-xs text-error hover:text-[#991515] font-semibold mt-2.5 transition-all hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px] align-middle select-none">phone</span>
                      <span>{contact.number}</span>
                    </a>
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
