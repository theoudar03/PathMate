import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Users, Trash2, Edit, X, CheckCircle, Sparkles, Building, Layers } from 'lucide-react';

const AdminEvents = () => {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'clubs'
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', location: '', status: 'upcoming', registration_steps: '' });
  const [clubForm, setClubForm] = useState({ name: '', description: '', location: '', eligibility: '', status: 'active', registration_steps: '' });
  const [posterUrl, setPosterUrl] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [eventsRes, clubsRes] = await Promise.all([
        fetch('/api/admin/events', { headers }),
        fetch('/api/admin/clubs', { headers })
      ]);
      
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (clubsRes.ok) setClubs(await clubsRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/events/${selectedItem.id}` : '/api/admin/events';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save event');

      setShowEventModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClubSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/clubs/${selectedItem.id}` : '/api/admin/clubs';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clubForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save club');

      setShowClubModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const endpoint = activeTab === 'events' ? 'events' : 'clubs';
      const res = await fetch(`/api/admin/${endpoint}/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');

      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScanPoster = async () => {
    if (!posterUrl) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch('/api/admin/events/vision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageUrl: posterUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setEventForm({
          title: data.name || '',
          description: data.description || '',
          date: data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : '',
          location: data.location || '',
          status: 'upcoming',
          registration_steps: data.registration_steps || ''
        });
        setShowScannerModal(false);
        setShowEventModal(true);
      }
    } catch (err) {
      alert("Failed to scan poster details");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Events & Clubs Management</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Manage student campus hackathons, activities, and club organizations in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'events' && (
            <button
              onClick={() => { setPosterUrl(''); setShowScannerModal(true); }}
              className="bg-secondaryContainer text-onSecondaryContainer hover:bg-secondaryContainer/80 font-bold text-xs px-4 py-3 rounded-2xl transition-all flex items-center gap-2"
            >
              <Sparkles size={16} />
              <span>AI Poster Scanner</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedItem(null);
              if (activeTab === 'events') {
                setEventForm({ title: '', description: '', date: '', location: '', status: 'upcoming', registration_steps: '' });
                setShowEventModal(true);
              } else {
                setClubForm({ name: '', description: '', location: '', eligibility: '', status: 'active', registration_steps: '' });
                setShowClubModal(true);
              }
              setErrorMsg('');
            }}
            className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Create {activeTab === 'events' ? 'Event' : 'Club'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline/20 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 transition-colors ${activeTab === 'events' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Campus Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`pb-3 transition-colors ${activeTab === 'clubs' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Student Clubs ({clubs.length})
        </button>
      </div>

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Events from PostgreSQL...</div>
          ) : events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No events scheduled. Click "Create Event" to publish one.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-surface border border-surfaceVariant/60 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                      {evt.status || 'upcoming'}
                    </span>
                    <span className="text-xs font-mono text-onSurfaceVariant font-semibold flex items-center gap-1">
                      <Users size={13} /> {evt.attendees || 0} enrolled
                    </span>
                  </div>

                  <h3 className="font-bold text-onSurface text-base leading-snug">{evt.title}</h3>
                  <p className="text-xs text-onSurfaceVariant mt-1.5 line-clamp-2 leading-relaxed">{evt.description || evt.title}</p>
                  
                  <div className="mt-3 space-y-1 text-xs text-onSurfaceVariant font-medium">
                    <p className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-primary" />
                      <span>{evt.date ? new Date(evt.date).toLocaleString() : 'TBD'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-rose-600" />
                      <span>{evt.location || 'SCE Campus'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
                  <button
                    onClick={() => {
                      setSelectedItem(evt);
                      setEventForm({
                        title: evt.title,
                        description: evt.description || '',
                        date: evt.date ? new Date(evt.date).toISOString().slice(0, 16) : '',
                        location: evt.location || '',
                        status: evt.status || 'upcoming',
                        registration_steps: evt.registration_steps || ''
                      });
                      setShowEventModal(true);
                    }}
                    className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceVariant transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedItem(evt); setShowDeleteModal(true); }}
                    className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CLUBS TAB */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Clubs from PostgreSQL...</div>
          ) : clubs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No clubs configured. Click "Create Club" to add one.</div>
          ) : (
            clubs.map((c) => (
              <div key={c.id} className="bg-surface border border-surfaceVariant/60 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                      {c.status || 'active'}
                    </span>
                    <span className="text-xs font-mono text-onSurfaceVariant font-semibold flex items-center gap-1">
                      <Users size={13} /> {c.members || 0} members
                    </span>
                  </div>

                  <h3 className="font-bold text-onSurface text-base leading-snug">{c.name}</h3>
                  <p className="text-xs text-onSurfaceVariant mt-1.5 line-clamp-3 leading-relaxed">{c.description}</p>
                  
                  <div className="mt-3 space-y-1 text-xs text-onSurfaceVariant font-medium">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-rose-600" />
                      <span>{c.location || 'TBD'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
                  <button
                    onClick={() => {
                      setSelectedItem(c);
                      setClubForm({
                        name: c.name,
                        description: c.description || '',
                        location: c.location || '',
                        eligibility: c.eligibility || '',
                        status: c.status || 'active',
                        registration_steps: c.registration_steps || ''
                      });
                      setShowClubModal(true);
                    }}
                    className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceVariant transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => { setSelectedItem(c); setShowDeleteModal(true); }}
                    className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowEventModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Event' : 'Create Event'}</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleEventSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Event Title</label>
                <input type="text" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="e.g. Smart India Hackathon 2026" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Description</label>
                <textarea rows={3} value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} placeholder="Event description & highlights..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Date & Time</label>
                  <input type="datetime-local" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Location</label>
                  <input type="text" required value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} placeholder="RV Block Hall" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Registration Steps for Students</label>
                <textarea rows={2} value={eventForm.registration_steps} onChange={e => setEventForm({...eventForm, registration_steps: e.target.value})} placeholder="Step 1: Fill Google form..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUB MODAL */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowClubModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Club' : 'Create Club'}</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleClubSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Club Name</label>
                <input type="text" required value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} placeholder="e.g. Coding Ninjas SCE" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Description</label>
                <textarea rows={3} value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} placeholder="Club mission & activities..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Location / Meeting Venue</label>
                <input type="text" value={clubForm.location} onChange={e => setClubForm({...clubForm, location: e.target.value})} placeholder="RV Block CS Lab" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Eligibility Criteria</label>
                <textarea rows={2} value={clubForm.eligibility} onChange={e => setClubForm({...clubForm, eligibility: e.target.value})} placeholder="Requirements for freshmen..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowClubModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Save Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI POSTER SCANNER MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowScannerModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} /> AI Event Poster Scanner
            </h3>
            <p className="text-xs text-onSurfaceVariant mb-4">Paste image URL of an event poster to extract title, date, location & process using Gemini AI.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Poster Image URL</label>
                <input type="url" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="https://example.com/poster.jpg" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowScannerModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button onClick={handleScanPoster} disabled={actionLoading || !posterUrl} className="px-5 py-2 bg-secondaryContainer text-onSecondaryContainer font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Scanning with Gemini...' : 'Scan & Auto-Fill Form'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete {activeTab === 'events' ? 'Event' : 'Club'}</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong>{selectedItem.title || selectedItem.name}</strong> from PostgreSQL?
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
              <button onClick={handleDeleteSubmit} disabled={actionLoading} className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md">
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminEvents;
