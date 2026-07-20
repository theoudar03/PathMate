import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MoreVertical, MapPin, Users, Trash2 } from 'lucide-react';

const AdminEvents = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
  }, []);

  const handleDelete = async (id, type) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/${type}s/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (type === 'event') setEvents(events.filter(e => e.id !== id));
        if (type === 'club') setClubs(clubs.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/${activeTab}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const newItem = await res.json();
        if (activeTab === 'events') {
          setEvents([...events, { ...newItem, title: newItem.name, date: newItem.event_date, location: newItem.location_text }]);
        } else {
          setClubs([...clubs, newItem]);
        }
        setShowModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create');
      }
    } catch (err) {
      console.error(`Error creating ${activeTab}:`, err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Events & Clubs</h1>
          <p className="text-onSurfaceVariant text-sm">Manage campus activities and student organizations</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-onPrimary px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Create {activeTab === 'events' ? 'Event' : 'Club'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-surfaceVariant/50">
        <button 
          onClick={() => setActiveTab('events')}
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative ${activeTab === 'events' ? 'text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Campus Events
          {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('clubs')}
          className={`pb-3 px-1 text-sm font-semibold transition-colors relative ${activeTab === 'clubs' ? 'text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Student Clubs
          {activeTab === 'clubs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"></div>}
        </button>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
              <tr>
                <th className="px-6 py-4 font-medium">{activeTab === 'events' ? 'Event Details' : 'Club Name'}</th>
                <th className="px-6 py-4 font-medium">{activeTab === 'events' ? 'Location' : 'Members'}</th>
                <th className="px-6 py-4 font-medium">{activeTab === 'events' ? 'Attendees' : 'Last Activity'}</th>
                <th className="px-6 py-4 font-medium">Registration Steps</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surfaceVariant/50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-onSurfaceVariant">Loading...</td></tr>
              ) : activeTab === 'events' ? events.map((event) => (
                <tr key={event.id} className="hover:bg-surfaceVariant/20 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-onSurface group-hover:text-primary transition-colors">{event.title}</p>
                    <p className="text-xs text-onSurfaceVariant flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {new Date(event.date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurface flex items-center gap-1"><MapPin size={14} className="text-onSurfaceVariant"/> {event.location}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurface flex items-center gap-1"><Users size={14} className="text-onSurfaceVariant"/> {event.attendees} registered</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <p className="text-xs font-mono text-onSurfaceVariant" title={event.registration_steps}>{event.registration_steps || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider ${event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(event.id, 'event')} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )) : clubs.map((club) => (
                <tr key={club.id} className="hover:bg-surfaceVariant/20 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-onSurface group-hover:text-primary transition-colors">{club.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurface flex items-center gap-1"><Users size={14} className="text-onSurfaceVariant"/> {club.members}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-onSurfaceVariant text-sm">{club.lastActivity}</p>
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    <p className="text-xs font-mono text-onSurfaceVariant" title={club.registration_steps}>{club.registration_steps || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider bg-green-100 text-green-700">
                      {club.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(club.id, 'club')} className="text-error hover:bg-error/10 p-2 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surfaceVariant border border-surfaceVariant/50 rounded-3xl p-6 w-full max-w-md shadow-elevation3">
            <h2 className="text-xl font-bold text-onSurface mb-4">Create {activeTab === 'events' ? 'Event' : 'Club'}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {activeTab === 'events' ? (
                <>
                  {/* Vision API Auto-Fill Banner */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      AI Vision Flyer Auto-Fill
                    </label>
                    <div className="flex gap-2">
                      <input 
                        id="flyerUrlInput"
                        placeholder="Paste Event Poster / Flyer Image URL..." 
                        className="flex-1 bg-surface border border-surfaceVariant rounded-lg py-1.5 px-3 text-xs text-onSurface focus:outline-none" 
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const input = document.getElementById('flyerUrlInput');
                          if (!input || !input.value) return alert('Please enter a poster URL');
                          try {
                            const token = localStorage.getItem('pm_admin_token');
                            const res = await fetch('/api/admin/events/vision', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ imageUrl: input.value })
                            });
                            const data = await res.json();
                            if (data.eventName) {
                              const form = input.closest('form');
                              if (form.title) form.title.value = data.eventName;
                              if (form.location) form.location.value = data.venue || '';
                              alert(`AI Extracted: ${data.eventName} @ ${data.venue}`);
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Vision OCR extraction failed');
                          }
                        }}
                        className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
                      >
                        Extract
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Event Title</label>
                    <input name="title" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Date & Time</label>
                    <input name="date" type="datetime-local" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Location</label>
                    <input name="location" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>

                  {/* Campus Map Pin Picker */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-onSurfaceVariant mb-1">Pin X Coord</label>
                      <input name="pin_x" type="number" defaultValue="400" className="w-full bg-surface border border-surfaceVariant rounded-xl py-1.5 px-3 text-xs text-onSurface" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-onSurfaceVariant mb-1">Pin Y Coord</label>
                      <input name="pin_y" type="number" defaultValue="350" className="w-full bg-surface border border-surfaceVariant rounded-xl py-1.5 px-3 text-xs text-onSurface" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-onSurfaceVariant mb-1">Pin Color</label>
                      <input name="pin_color" type="color" defaultValue="#F59E0B" className="w-full h-8 bg-surface border border-surfaceVariant rounded-xl p-1 cursor-pointer" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Club Name</label>
                    <input name="name" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Description</label>
                    <textarea name="description" required rows="2" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Eligibility Criteria</label>
                    <textarea name="eligibility" rows="2" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-onSurfaceVariant mb-1">Location</label>
                    <input name="location" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 text-onSurface focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </>
              )}
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-onSurfaceVariant font-medium hover:bg-surfaceVariant/50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-onPrimary font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
