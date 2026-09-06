import React, { useState, useEffect } from 'react';
import { Calendar, Plus, MapPin, Users, Trash2, Edit, X, CheckCircle, Sparkles, Building, Image as ImageIcon, Upload, Eye, Star, Lock, Clock, Link as LinkIcon, ShieldCheck } from 'lucide-react';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Academic', 'Social Service', 'General'];
const DEPARTMENTS = ['All Departments', 'Computer Science & Engineering', 'Information Technology', 'AI & Data Science', 'Electronics & Communication', 'Electrical & Electronics', 'Instrumentation & Control', 'Mechanical Engineering', 'Civil Engineering'];

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

  // Image Uploading State
  const [uploadingImage, setUploadingImage] = useState(false);

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    short_description: '',
    description: '',
    category: 'Technical',
    event_type: 'General',
    organizer: 'Saranathan College of Engineering',
    venue: 'SCE Main Auditorium',
    date: '',
    start_time: '09:30 AM',
    end_time: '04:30 PM',
    registration_deadline: '',
    registration_url: '',
    capacity: 100,
    image_url: '',
    status: 'PUBLISHED',
    featured: false,
    is_registration_open: true,
    registration_steps: ''
  });

  // Club Form State
  const [clubForm, setClubForm] = useState({
    name: '',
    short_description: '',
    description: '',
    category: 'Technical',
    department: 'All Departments',
    faculty_coordinator: '',
    student_coordinator: '',
    contact_email: '',
    contact_phone: '',
    meeting_location: 'SCE Campus',
    meeting_schedule: 'Every Wednesday 4:00 PM',
    membership_url: '',
    image_url: '',
    logo_url: '',
    featured: false,
    status: 'PUBLISHED',
    eligibility: 'Open to all Saranathan students',
    registration_steps: ''
  });

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
      console.error("Error fetching admin events/clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Image Upload Handler
  const handleFileUpload = async (file, folder, onSuccess) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit");
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        const token = localStorage.getItem('pm_admin_token');

        const res = await fetch('/api/admin/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image: base64Data, folder })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        
        onSuccess(data.url);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Image upload error: " + err.message);
      setUploadingImage(false);
    }
  };

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

  const handleStatusChange = async (id, newStatus, type = 'events') => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
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
          ...eventForm,
          title: data.name || '',
          description: data.description || '',
          date: data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : '',
          venue: data.location || 'SCE Main Hall',
          status: 'PUBLISHED',
          image_url: posterUrl
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

  const getStatusBadge = (status) => {
    const s = (status || 'PUBLISHED').toUpperCase();
    if (s === 'PUBLISHED' || s === 'ACTIVE') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (s === 'DRAFT') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (s === 'CANCELLED') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (s === 'INACTIVE' || s === 'ARCHIVED') return 'bg-slate-200 text-slate-700 border-slate-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surfaceContainerLowest border border-outline/20 rounded-3xl p-6 shadow-card">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Events & Clubs CMS Control Center</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Single source-of-truth management for all student campus activities, workshops, and club organizations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'events' && (
            <button
              onClick={() => { setPosterUrl(''); setShowScannerModal(true); }}
              className="bg-secondaryContainer text-onSecondaryContainer hover:bg-secondaryContainer/80 font-bold text-xs px-4 py-3 rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>AI Poster Scanner</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedItem(null);
              if (activeTab === 'events') {
                setEventForm({
                  title: '', short_description: '', description: '', category: 'Technical',
                  event_type: 'General', organizer: 'Saranathan College of Engineering',
                  venue: 'SCE Main Auditorium', date: '', start_time: '09:30 AM', end_time: '04:30 PM',
                  registration_deadline: '', registration_url: '', capacity: 100,
                  image_url: '', status: 'PUBLISHED', featured: false, is_registration_open: true,
                  registration_steps: ''
                });
                setShowEventModal(true);
              } else {
                setClubForm({
                  name: '', short_description: '', description: '', category: 'Technical',
                  department: 'All Departments', faculty_coordinator: '', student_coordinator: '',
                  contact_email: '', contact_phone: '', meeting_location: 'SCE Campus',
                  meeting_schedule: 'Every Wednesday 4:00 PM', membership_url: '', image_url: '',
                  logo_url: '', featured: false, status: 'PUBLISHED', eligibility: 'Open to all students',
                  registration_steps: ''
                });
                setShowClubModal(true);
              }
              setErrorMsg('');
            }}
            className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
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
          className={`pb-3 transition-colors cursor-pointer ${activeTab === 'events' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Campus Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`pb-3 transition-colors cursor-pointer ${activeTab === 'clubs' ? 'border-b-2 border-primary text-primary' : 'text-onSurfaceVariant hover:text-onSurface'}`}
        >
          Student Clubs ({clubs.length})
        </button>
      </div>

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Events from Database...</div>
          ) : events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No events found in database. Click "Create Event" to publish one.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-surfaceContainerLowest border border-outline/20 rounded-3xl overflow-hidden shadow-card flex flex-col justify-between group">
                {/* Event Image Banner */}
                {evt.image_url || evt.poster ? (
                  <div className="h-40 w-full bg-slate-100 overflow-hidden relative">
                    <img src={evt.image_url || evt.poster} alt={evt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {evt.featured && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <Star size={11} fill="white" /> Featured
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-28 w-full bg-gradient-to-r from-blue-600 to-indigo-900 text-white p-4 flex flex-col justify-end relative">
                    {evt.featured && (
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <Star size={11} fill="white" /> Featured
                      </span>
                    )}
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{evt.category || 'Event'}</span>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(evt.status)}`}>
                        {evt.status || 'PUBLISHED'}
                      </span>
                      <span className="text-xs font-mono text-onSurfaceVariant font-semibold flex items-center gap-1">
                        <Users size={13} /> {evt.attendees || evt.registration_count || 0} enrolled
                      </span>
                    </div>

                    <h3 className="font-extrabold text-onSurface text-base leading-snug">{evt.title || evt.name}</h3>
                    <p className="text-xs text-onSurfaceVariant mt-1.5 line-clamp-2 leading-relaxed">{evt.short_description || evt.description}</p>
                    
                    <div className="mt-3.5 space-y-1.5 text-xs text-onSurfaceVariant font-medium border-t border-outline/10 pt-3">
                      <p className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-primary flex-shrink-0" />
                        <span>{evt.date || evt.event_date ? new Date(evt.date || evt.event_date).toLocaleString() : 'TBD'}</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-rose-600 flex-shrink-0" />
                        <span>{evt.venue || evt.location || 'SCE Campus'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Toggles */}
                  <div className="flex items-center justify-between pt-3 border-t border-outline/10">
                    <select
                      value={(evt.status || 'PUBLISHED').toUpperCase()}
                      onChange={(e) => handleStatusChange(evt.id, e.target.value, 'events')}
                      className="text-[11px] font-bold bg-surfaceContainerLow text-onSurface border border-outline/20 rounded-xl px-2 py-1 cursor-pointer"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedItem(evt);
                          setEventForm({
                            title: evt.title || evt.name || '',
                            short_description: evt.short_description || '',
                            description: evt.description || '',
                            category: evt.category || 'Technical',
                            event_type: evt.event_type || 'General',
                            organizer: evt.organizer || 'Saranathan College of Engineering',
                            venue: evt.venue || evt.location || 'SCE Main Auditorium',
                            date: evt.date || evt.event_date ? new Date(evt.date || evt.event_date).toISOString().slice(0, 16) : '',
                            start_time: evt.start_time || '09:30 AM',
                            end_time: evt.end_time || '04:30 PM',
                            registration_deadline: evt.registration_deadline ? new Date(evt.registration_deadline).toISOString().slice(0, 16) : '',
                            registration_url: evt.registration_url || '',
                            capacity: evt.capacity || 100,
                            image_url: evt.image_url || evt.poster || '',
                            status: (evt.status || 'PUBLISHED').toUpperCase(),
                            featured: evt.featured || false,
                            is_registration_open: evt.is_registration_open !== false,
                            registration_steps: evt.registration_steps || ''
                          });
                          setShowEventModal(true);
                        }}
                        className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceContainer transition-colors cursor-pointer"
                        title="Edit Event"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedItem(evt); setShowDeleteModal(true); }}
                        className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CLUBS TAB */}
      {activeTab === 'clubs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Clubs from Database...</div>
          ) : clubs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No clubs configured in database. Click "Create Club" to add one.</div>
          ) : (
            clubs.map((c) => (
              <div key={c.id} className="bg-surfaceContainerLowest border border-outline/20 rounded-3xl overflow-hidden shadow-card flex flex-col justify-between group">
                {/* Club Header Banner */}
                {c.image_url ? (
                  <div className="h-32 w-full bg-slate-100 overflow-hidden relative">
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-24 w-full bg-gradient-to-r from-teal-600 to-cyan-900 text-white p-4 flex flex-col justify-end">
                    <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{c.department || 'All Departments'}</span>
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                        {c.status || 'PUBLISHED'}
                      </span>
                      <span className="text-xs font-mono text-onSurfaceVariant font-semibold flex items-center gap-1">
                        <Users size={13} /> {c.members || 0} members
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {c.logo_url && (
                        <img src={c.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-outline/20 flex-shrink-0" />
                      )}
                      <div>
                        <h3 className="font-extrabold text-onSurface text-base leading-snug">{c.name}</h3>
                        <span className="text-[10px] font-bold text-primary bg-primaryContainer/40 px-2 py-0.5 rounded-full">{c.category || 'General'}</span>
                      </div>
                    </div>

                    <p className="text-xs text-onSurfaceVariant mt-2 line-clamp-3 leading-relaxed">{c.short_description || c.description}</p>
                    
                    <div className="mt-3.5 space-y-1 text-xs text-onSurfaceVariant font-medium border-t border-outline/10 pt-3">
                      <p className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-rose-600 flex-shrink-0" />
                        <span>{c.meeting_location || c.location || 'SCE Campus'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-outline/10">
                    <select
                      value={(c.status || 'PUBLISHED').toUpperCase()}
                      onChange={(e) => handleStatusChange(c.id, e.target.value, 'clubs')}
                      className="text-[11px] font-bold bg-surfaceContainerLow text-onSurface border border-outline/20 rounded-xl px-2 py-1 cursor-pointer"
                    >
                      <option value="PUBLISHED">Published</option>
                      <option value="DRAFT">Draft</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedItem(c);
                          setClubForm({
                            name: c.name || '',
                            short_description: c.short_description || '',
                            description: c.description || '',
                            category: c.category || 'Technical',
                            department: c.department || 'All Departments',
                            faculty_coordinator: c.faculty_coordinator || '',
                            student_coordinator: c.student_coordinator || '',
                            contact_email: c.contact_email || '',
                            contact_phone: c.contact_phone || '',
                            meeting_location: c.meeting_location || c.location || 'SCE Campus',
                            meeting_schedule: c.meeting_schedule || 'Every Wednesday 4:00 PM',
                            membership_url: c.membership_url || '',
                            image_url: c.image_url || '',
                            logo_url: c.logo_url || '',
                            featured: c.featured || false,
                            status: (c.status || 'PUBLISHED').toUpperCase(),
                            eligibility: c.eligibility || 'Open to all students',
                            registration_steps: c.registration_steps || ''
                          });
                          setShowClubModal(true);
                        }}
                        className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceContainer transition-colors cursor-pointer"
                        title="Edit Club"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedItem(c); setShowDeleteModal(true); }}
                        className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Club"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-surfaceContainerLowest border border-outline/30 rounded-[28px] max-w-2xl w-full p-6 text-left shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEventModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1 rounded-full"><X size={20} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Event' : 'Create Event'}</h3>
            <p className="text-xs text-onSurfaceVariant mb-4 font-medium">Fields are synchronized directly to PostgreSQL and displayed to freshers.</p>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl font-bold mb-4">{errorMsg}</p>}

            <form onSubmit={handleEventSubmit} className="space-y-4 text-xs">
              
              {/* Event Cover Image Upload */}
              <div className="bg-surfaceContainerLow p-4 rounded-2xl border border-outline/20 space-y-2">
                <label className="block font-extrabold text-onSurface uppercase tracking-wide">Event Banner / Poster Image</label>
                <div className="flex items-center gap-4">
                  {eventForm.image_url ? (
                    <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-outline/30 flex-shrink-0">
                      <img src={eventForm.image_url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, image_url: '' })}
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full hover:bg-rose-600"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 rounded-xl border-2 border-dashed border-outline/40 flex flex-col items-center justify-center text-onSurfaceVariant/60 flex-shrink-0">
                      <ImageIcon size={24} />
                      <span className="text-[10px] mt-1">No Image</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'events', (url) => setEventForm({ ...eventForm, image_url: url }))}
                      className="block w-full text-xs text-onSurfaceVariant file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primaryHover cursor-pointer"
                    />
                    <p className="text-[10px] text-onSurfaceVariant/70">JPG, PNG, WEBP up to 5MB. Or enter image URL below:</p>
                    <input
                      type="text"
                      value={eventForm.image_url}
                      onChange={e => setEventForm({ ...eventForm, image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2 border rounded-xl bg-surfaceContainerLowest"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Event Title *</label>
                  <input type="text" required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="e.g. Smart India Hackathon 2026" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface" />
                </div>

                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Category</label>
                  <select value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Status</label>
                  <select value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface">
                    <option value="PUBLISHED">Published (Visible to Freshers)</option>
                    <option value="DRAFT">Draft (Admin Only)</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Short Description (Card Summary)</label>
                <input type="text" value={eventForm.short_description} onChange={e => setEventForm({...eventForm, short_description: e.target.value})} placeholder="1-line summary for student cards..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Full Description</label>
                <textarea rows={3} value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} placeholder="Full event description, schedule, and guidelines..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Event Date & Time *</label>
                  <input type="datetime-local" required value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Venue / Location</label>
                  <input type="text" value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} placeholder="e.g. RV Block Seminar Hall 1" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Organizer</label>
                  <input type="text" value={eventForm.organizer} onChange={e => setEventForm({...eventForm, organizer: e.target.value})} placeholder="e.g. Department of CSE & IEEE Student Branch" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Capacity / Max Seats</label>
                  <input type="number" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: parseInt(e.target.value) || 100})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Registration URL (Optional External Link)</label>
                  <input type="url" value={eventForm.registration_url} onChange={e => setEventForm({...eventForm, registration_url: e.target.value})} placeholder="https://forms.gle/..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Registration Deadline</label>
                  <input type="datetime-local" value={eventForm.registration_deadline} onChange={e => setEventForm({...eventForm, registration_deadline: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 border-t border-outline/10">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-onSurface">
                  <input type="checkbox" checked={eventForm.featured} onChange={e => setEventForm({...eventForm, featured: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                  <span>Feature on Top Banner</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-onSurface">
                  <input type="checkbox" checked={eventForm.is_registration_open} onChange={e => setEventForm({...eventForm, is_registration_open: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                  <span>Registration Open</span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Registration Guidelines & Steps</label>
                <textarea rows={2} value={eventForm.registration_steps} onChange={e => setEventForm({...eventForm, registration_steps: e.target.value})} placeholder="Instructions for registering students..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-outline/10">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-5 py-2.5 bg-surfaceContainer border border-outline/30 rounded-full font-bold text-onSurface hover:bg-surfaceContainerHigh transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading || uploadingImage} className="px-6 py-2.5 bg-primary text-onPrimary font-black rounded-full shadow-md hover:bg-primaryHover transition-all cursor-pointer">
                  {actionLoading ? 'Saving to Database...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLUB MODAL */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-surfaceContainerLowest border border-outline/30 rounded-[28px] max-w-2xl w-full p-6 text-left shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowClubModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface p-1 rounded-full"><X size={20} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Club' : 'Create Club'}</h3>
            <p className="text-xs text-onSurfaceVariant mb-4 font-medium">Fields are saved directly in PostgreSQL and displayed in the Student Club Directory.</p>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl font-bold mb-4">{errorMsg}</p>}

            <form onSubmit={handleClubSubmit} className="space-y-4 text-xs">
              
              {/* Club Images Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surfaceContainerLow p-4 rounded-2xl border border-outline/20">
                <div>
                  <label className="block font-extrabold text-onSurface uppercase tracking-wide mb-1">Club Cover Image</label>
                  <div className="flex items-center gap-2">
                    {clubForm.image_url ? (
                      <img src={clubForm.image_url} alt="" className="w-16 h-12 rounded-xl object-cover border border-outline/30" />
                    ) : (
                      <div className="w-16 h-12 rounded-xl border border-dashed border-outline/40 flex items-center justify-center text-onSurfaceVariant/60 text-[10px]">No Cover</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'clubs', (url) => setClubForm({ ...clubForm, image_url: url }))}
                      className="block w-full text-[11px] text-onSurfaceVariant file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-white cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-onSurface uppercase tracking-wide mb-1">Club Logo Icon</label>
                  <div className="flex items-center gap-2">
                    {clubForm.logo_url ? (
                      <img src={clubForm.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover border border-outline/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-dashed border-outline/40 flex items-center justify-center text-onSurfaceVariant/60 text-[10px]">No Logo</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'clubs', (url) => setClubForm({ ...clubForm, logo_url: url }))}
                      className="block w-full text-[11px] text-onSurfaceVariant file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-primary file:text-white cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Club Name *</label>
                  <input type="text" required value={clubForm.name} onChange={e => setClubForm({...clubForm, name: e.target.value})} placeholder="e.g. Coding Ninjas SCE" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface" />
                </div>

                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Category</label>
                  <select value={clubForm.category} onChange={e => setClubForm({...clubForm, category: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Department</label>
                  <select value={clubForm.department} onChange={e => setClubForm({...clubForm, department: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Short Description (Card Summary)</label>
                <input type="text" value={clubForm.short_description} onChange={e => setClubForm({...clubForm, short_description: e.target.value})} placeholder="1-line motto or summary..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Full Description</label>
                <textarea rows={3} value={clubForm.description} onChange={e => setClubForm({...clubForm, description: e.target.value})} placeholder="Club mission, activities, projects & achievements..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Faculty Coordinator</label>
                  <input type="text" value={clubForm.faculty_coordinator} onChange={e => setClubForm({...clubForm, faculty_coordinator: e.target.value})} placeholder="e.g. Dr. P. Senthilkumar (HOD/CSE)" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Student Coordinator</label>
                  <input type="text" value={clubForm.student_coordinator} onChange={e => setClubForm({...clubForm, student_coordinator: e.target.value})} placeholder="e.g. Arun Kumar (Final IT)" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Meeting Venue / Room</label>
                  <input type="text" value={clubForm.meeting_location} onChange={e => setClubForm({...clubForm, meeting_location: e.target.value})} placeholder="e.g. RV Block CS Lab 2" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Meeting Schedule</label>
                  <input type="text" value={clubForm.meeting_schedule} onChange={e => setClubForm({...clubForm, meeting_schedule: e.target.value})} placeholder="e.g. Wednesdays 4:00 PM - 5:30 PM" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Contact Email</label>
                  <input type="email" value={clubForm.contact_email} onChange={e => setClubForm({...clubForm, contact_email: e.target.value})} placeholder="codingclub@saranathan.ac.in" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Status</label>
                  <select value={clubForm.status} onChange={e => setClubForm({...clubForm, status: e.target.value})} className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow font-bold text-onSurface">
                    <option value="PUBLISHED">Published (Visible to Freshers)</option>
                    <option value="DRAFT">Draft (Admin Only)</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Membership Link (Google Form or Website)</label>
                <input type="url" value={clubForm.membership_url} onChange={e => setClubForm({...clubForm, membership_url: e.target.value})} placeholder="https://forms.gle/..." className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-outline/10">
                <button type="button" onClick={() => setShowClubModal(false)} className="px-5 py-2.5 bg-surfaceContainer border border-outline/30 rounded-full font-bold text-onSurface hover:bg-surfaceContainerHigh transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={actionLoading || uploadingImage} className="px-6 py-2.5 bg-primary text-onPrimary font-black rounded-full shadow-md hover:bg-primaryHover transition-all cursor-pointer">
                  {actionLoading ? 'Saving to Database...' : 'Save Club'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI POSTER SCANNER MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surfaceContainerLowest border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowScannerModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant hover:text-onSurface"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} /> AI Event Poster Scanner
            </h3>
            <p className="text-xs text-onSurfaceVariant mb-4">Paste image URL of an event poster to extract title, date, location & process using Gemini AI.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Poster Image URL</label>
                <input type="url" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="https://example.com/poster.jpg" className="w-full p-2.5 border border-outline/30 rounded-xl bg-surfaceContainerLow text-onSurface" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowScannerModal(false)} className="px-4 py-2 bg-surfaceContainer border border-outline/30 rounded-full font-bold text-onSurface">Cancel</button>
                <button onClick={handleScanPoster} disabled={actionLoading || !posterUrl} className="px-5 py-2 bg-secondaryContainer text-onSecondaryContainer font-bold rounded-full shadow-md cursor-pointer">
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
          <div className="bg-surfaceContainerLowest border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete {activeTab === 'events' ? 'Event' : 'Club'}</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to permanently delete <strong>{selectedItem.title || selectedItem.name}</strong> from PostgreSQL?
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 bg-surfaceContainer border border-outline/30 rounded-full font-bold text-onSurface cursor-pointer">Cancel</button>
              <button onClick={handleDeleteSubmit} disabled={actionLoading} className="px-6 py-2.5 bg-rose-600 text-white font-black rounded-full shadow-md cursor-pointer">
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
