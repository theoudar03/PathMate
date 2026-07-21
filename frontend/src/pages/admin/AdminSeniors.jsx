import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, Edit, X, Mail, Phone, Globe, BookOpen } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminSeniors = () => {
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    department: 'Computer Science & Engineering',
    year: 'Final Year',
    languages: 'English, Tamil',
    skills: 'Python, React, Node.js',
    domains: 'Full Stack, Competitive Programming',
    linkedin_url: '',
    email: '',
    phone: '',
    availability: 'Weekdays & Evenings',
    mentor_status: 'active'
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSeniors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/seniors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setSeniors(res.data);
      } else {
        setSeniors([]);
      }
    } catch (err) {
      console.error("Error fetching seniors:", err);
      setSeniors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/seniors/${selectedItem.id}` : '/api/admin/seniors';

      const payload = {
        ...form,
        languages: typeof form.languages === 'string' ? form.languages.split(',').map(s => s.trim()) : form.languages,
        skills: typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()) : form.skills,
        domains: typeof form.domains === 'string' ? form.domains.split(',').map(s => s.trim()) : form.domains,
      };

      const res = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Unable to save senior mentor profile. Please try again.');
        return;
      }

      setShowModal(false);
      setSelectedItem(null);
      fetchSeniors();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving senior profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/seniors/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert(res.error || 'Unable to delete senior mentor profile.');
        return;
      }

      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchSeniors();
    } catch (err) {
      alert('An unexpected error occurred while deleting senior profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({
      name: item.name || '',
      department: item.department || 'Computer Science & Engineering',
      year: item.year || 'Final Year',
      languages: Array.isArray(item.languages) ? item.languages.join(', ') : item.languages || 'English, Tamil',
      skills: Array.isArray(item.skills) ? item.skills.join(', ') : item.skills || '',
      domains: Array.isArray(item.domains) ? item.domains.join(', ') : item.domains || '',
      linkedin_url: item.linkedin_url || '',
      email: item.email || '',
      phone: item.phone || '',
      availability: item.availability || 'Weekdays & Evenings',
      mentor_status: item.mentor_status || 'active'
    });
    setErrorMsg('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Senior Connect Mentors</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Manage senior student mentors, technical domain skills, and peer advisory rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedItem(null);
            setForm({
              name: '',
              department: 'Computer Science & Engineering',
              year: 'Final Year',
              languages: 'English, Tamil',
              skills: 'Python, React, Node.js',
              domains: 'Full Stack, Competitive Programming',
              linkedin_url: '',
              email: '',
              phone: '',
              availability: 'Weekdays & Evenings',
              mentor_status: 'active'
            });
            setErrorMsg('');
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Add Senior Mentor</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Senior Mentors from PostgreSQL...</div>
        ) : seniors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No senior mentors recorded. Click "Add Senior Mentor" to add one.</div>
        ) : (
          seniors.map((s) => (
            <div key={s.id} className="bg-surface border border-surfaceVariant/60 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                    {s.mentor_status || 'active'}
                  </span>
                  <span className="text-xs font-semibold text-primary font-mono">{s.year || 'Final Year'}</span>
                </div>

                <h3 className="font-bold text-onSurface text-base leading-snug">{s.name}</h3>
                <p className="text-xs text-onSurfaceVariant font-medium flex items-center gap-1 mt-0.5">
                  <BookOpen size={13} className="text-primary" /> {s.department}
                </p>

                <div className="mt-3 space-y-1.5 text-xs text-onSurfaceVariant font-medium bg-surfaceContainerLow/60 p-3 rounded-xl border border-outline/10">
                  <p><strong className="text-onSurface">Domain Skills:</strong> {Array.isArray(s.skills) ? s.skills.join(', ') : s.skills}</p>
                  <p><strong className="text-onSurface">Availability:</strong> {s.availability || 'Weekdays'}</p>
                  {s.email && <p className="flex items-center gap-1 mt-1 text-onSurfaceVariant"><Mail size={12} /> {s.email}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
                <button onClick={() => openEditModal(s)} className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceVariant transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => { setSelectedItem(s); setShowDeleteModal(true); }} className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-lg w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Senior Mentor' : 'Add Senior Mentor'}</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Full Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Karthik Subramanian" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Department</label>
                  <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="AI & Data Science">AI & Data Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Year</label>
                  <select value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                    <option value="Final Year">Final Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="2nd Year">2nd Year</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Domain Skills (Comma Separated)</label>
                <input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} placeholder="Python, React, Competitive Programming" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="karthik.s@saranathan.ac.in" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
                <div>
                  <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Phone / Contact</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Availability</label>
                <input type="text" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})} placeholder="Mon-Fri after 5 PM" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Save Senior Mentor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete Senior Mentor</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to remove <strong>{selectedItem.name}</strong> from Senior Connect?
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

export default AdminSeniors;
