import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ToastSnackbar from '../components/common/ToastSnackbar';

const ClubEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { studentData, fetchedClubsEvents, token, refetchClubsEvents } = useApp();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const item = (fetchedClubsEvents || []).find(c => c.id === id || String(c.dbId) === String(id));

  // Determine if student is already registered for this event
  useEffect(() => {
    if (item && item.type === 'Event' && token) {
      fetch(`/api/events/${item.dbId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.is_registered) {
          setIsRegistered(true);
        }
      })
      .catch(err => console.warn('Could not check registration status:', err));
    }
  }, [item, token]);

  if (!item) {
    return (
      <div className="text-center py-12 font-sans max-w-xl mx-auto">
        <span className="material-symbols-outlined text-[48px] text-onSurfaceVariant select-none mx-auto mb-4">help</span>
        <h2 className="text-xl font-bold text-primary">Club or Event Unavailable</h2>
        <p className="text-sm text-onSurfaceVariant mt-2">The requested campus event or club could not be found or is no longer active.</p>
        <button
          onClick={() => navigate('/clubs')}
          className="mt-6 text-sm text-primary hover:text-[#123669] font-bold flex items-center gap-1.5 mx-auto border border-outline rounded-full px-4 py-2 bg-surface"
        >
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_back</span>
          <span>Back to Clubs & Events</span>
        </button>
      </div>
    );
  }

  const isEvent = item.type === 'Event';
  const isClub = item.type === 'Club';
  const imageUrl = item.image_url || item.poster || item.logo_url;

  const handleRegisterEvent = async () => {
    if (!token) {
      setToastMsg('Please log in to register for campus events.');
      setShowToast(true);
      return;
    }
    setIsRegistering(true);
    try {
      const endpoint = `/api/events/${item.dbId}/register`;
      const method = isRegistered ? 'DELETE' : 'POST';
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsRegistered(!isRegistered);
        setToastMsg(isRegistered ? 'Unregistered from event successfully.' : 'Successfully registered for this event!');
        setShowToast(true);
        if (refetchClubsEvents) refetchClubsEvents();
      } else {
        setToastMsg(data.error || 'Failed to process registration.');
        setShowToast(true);
      }
    } catch (err) {
      setToastMsg('Network error. Please try again.');
      setShowToast(true);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans animate-fade-in text-left">
      {/* Back Link */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-onSurfaceVariant hover:text-primary transition-all flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary px-1.5 rounded"
        >
          <span className="material-symbols-outlined text-[16px] align-middle select-none">arrow_back</span>
          <span>Back to Clubs & Events</span>
        </button>
      </div>

      {/* Main Details Card */}
      <div className="bg-surface border border-surfaceVariant rounded-2xl shadow-elevation1 overflow-hidden">
        {/* Banner / Poster Header */}
        {imageUrl ? (
          <div className="relative h-64 md:h-80 w-full overflow-hidden bg-surfaceContainerLow">
            <img
              src={imageUrl}
              alt={item.name || item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 md:p-8">
              <div className="text-white space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {item.category} • {item.event_type || item.type}
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white">
                  {item.name || item.title}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary text-onPrimary p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-accent block uppercase tracking-wider">
                {item.category} • {item.event_type || item.type}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                {item.name || item.title}
              </h1>
            </div>
            <div className="bg-primaryContainer text-onPrimaryContainer border border-transparent rounded-full px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary align-middle select-none font-bold">account_balance</span>
              <span>Saranathan Campus</span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Action Bar for Events / Clubs */}
          {isEvent ? (
            <div className="bg-surfaceContainerLow p-5 rounded-2xl border border-outline/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wide block">Event Seat Availability</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-black text-onSurface">{item.registration_count || 0} / {item.capacity || 100}</span>
                  <span className="text-xs text-onSurfaceVariant font-medium">Seats Claimed</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRegisterEvent}
                disabled={isRegistering}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-xs ${
                  isRegistered
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                    : 'bg-primary text-onPrimary hover:bg-[#123669]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isRegistered ? 'cancel' : 'how_to_reg'}
                </span>
                <span>{isRegistering ? 'Processing...' : isRegistered ? 'Cancel Registration' : 'Register for Event'}</span>
              </button>
            </div>
          ) : item.membership_url ? (
            <div className="bg-surfaceContainerLow p-5 rounded-2xl border border-outline/15 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-onSurfaceVariant uppercase tracking-wide block">Club Membership</span>
                <p className="text-xs text-onSurface mt-0.5">Open for all Saranathan Engineering Freshers</p>
              </div>
              <a
                href={item.membership_url}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-primary text-onPrimary hover:bg-[#123669] transition-all flex items-center gap-2"
              >
                <span>Join Official Club</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>
          ) : null}

          {/* Description */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-primary">
              About this {item.type}
            </h2>
            <p className="text-sm text-onSurfaceVariant leading-relaxed whitespace-pre-line">
              {item.description || item.short_description || 'No detailed description provided.'}
            </p>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-surfaceVariant py-6 text-sm text-onSurfaceVariant font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">location_on</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Venue / Location</span>
                <span className="text-onSurface font-semibold">{item.venue || item.meeting_location || item.location || 'SCE Campus'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">schedule</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Timing / Schedule</span>
                <span className="text-onSurface font-semibold">{item.timings || item.meeting_schedule || 'TBD'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary align-middle select-none flex-shrink-0">person</span>
              <div>
                <span className="block text-[10px] font-semibold text-onSurfaceVariant">Organizer / Department</span>
                <span className="text-onSurface font-semibold">{item.organizer || item.department || 'SCE'}</span>
              </div>
            </div>
          </div>

          {/* Coordinators Section for Clubs */}
          {isClub && (item.faculty_coordinator || item.student_coordinator) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-onSurface uppercase tracking-wider">Club Coordinators</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.faculty_coordinator && (
                  <div className="bg-surfaceContainerLow p-4 rounded-xl border border-outline/10 text-xs">
                    <span className="text-[10px] font-bold text-primary uppercase block">Faculty Coordinator</span>
                    <span className="text-sm font-bold text-onSurface block mt-1">{item.faculty_coordinator}</span>
                    {item.contact_email && <span className="text-onSurfaceVariant block mt-1">{item.contact_email}</span>}
                  </div>
                )}
                {item.student_coordinator && (
                  <div className="bg-surfaceContainerLow p-4 rounded-xl border border-outline/10 text-xs">
                    <span className="text-[10px] font-bold text-primary uppercase block">Student Coordinator</span>
                    <span className="text-sm font-bold text-onSurface block mt-1">{item.student_coordinator}</span>
                    {item.contact_phone && <span className="text-onSurfaceVariant block mt-1">{item.contact_phone}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Registration / Eligibility Guidelines */}
          {item.registration_steps && (
            <div className="bg-primaryContainer/20 border border-primary/20 rounded-2xl p-5 relative overflow-hidden">
              <div className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-primary text-[22px] flex-shrink-0 mt-0.5 select-none">assignment</span>
                <div>
                  <h3 className="text-xs font-bold text-onSurface">
                    Registration Steps & Guidelines
                  </h3>
                  <p className="text-xs text-onSurfaceVariant mt-1.5 leading-relaxed font-mono">
                    {item.registration_steps}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastSnackbar
        isOpen={showToast}
        message={toastMsg}
        type={isRegistered ? 'success' : 'info'}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ClubEventDetail;

