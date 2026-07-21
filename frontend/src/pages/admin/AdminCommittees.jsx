import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, X, MapPin, UserCheck, Shield } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminCommittees = () => {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', description: '', faculty_name: '', student_coordinators: '', location_text: '', status: 'active' });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCommittees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson('/api/admin/committees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok && Array.isArray(res.data)) {
        setCommittees(res.data);
      } else {
        setCommittees([]);
      }
    } catch (err) {
      console.error("Error fetching committees:", err);
      setCommittees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/committees/${selectedItem.id}` : '/api/admin/committees';

      const res = await safeFetchJson(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to save committee');
        return;
      }

      setShowModal(false);
      setSelectedItem(null);
      fetchCommittees();
    } catch (err) {
      setErrorMsg('An unexpected error occurred while saving committee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await safeFetchJson(`/api/admin/committees/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert(res.error || 'Failed to delete committee');
        return;
      }

      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchCommittees();
    } catch (err) {
      alert('An unexpected error occurred while deleting committee.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      faculty_name: item.faculty_name || '',
      student_coordinators: item.student_coordinators || '',
      location_text: item.location_text || '',
      status: item.status || 'active'
    });
    setErrorMsg('');
    setShowModal(true);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Institutional Committees</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Manage college governance, faculty advisors, student coordinators, and meeting venues.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedItem(null);
            setForm({ name: '', description: '', faculty_name: '', student_coordinators: '', location_text: '', status: 'active' });
            setErrorMsg('');
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Create Committee</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant font-semibold">Loading Committees from PostgreSQL...</div>
        ) : committees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-onSurfaceVariant italic">No committees found. Click "Create Committee" to add one.</div>
        ) : (
          committees.map((c) => (
            <div key={c.id} className="bg-surface border border-surfaceVariant/60 rounded-3xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                    {c.status || 'active'}
                  </span>
                </div>

                <h3 className="font-bold text-onSurface text-base leading-snug">{c.name}</h3>
                <p className="text-xs text-onSurfaceVariant mt-1.5 line-clamp-3 leading-relaxed">{c.description || 'Institutional committee'}</p>
                
                <div className="mt-3 space-y-1 text-xs text-onSurfaceVariant font-medium bg-surfaceContainerLow/60 p-3 rounded-xl border border-outline/10">
                  <p><strong className="text-onSurface">Faculty Advisor:</strong> {c.faculty_name || 'Assigned HOD'}</p>
                  <p><strong className="text-onSurface">Coordinators:</strong> {c.student_coordinators || 'Senior Representatives'}</p>
                  {c.location_text && <p className="flex items-center gap-1 mt-1 text-primary"><MapPin size={13} /> {c.location_text}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
                <button onClick={() => openEditModal(c)} className="p-2 text-onSurfaceVariant hover:text-primary rounded-xl hover:bg-surfaceVariant transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => { setSelectedItem(c); setShowDeleteModal(true); }} className="p-2 text-onSurfaceVariant hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors">
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
            <h3 className="text-xl font-black text-onSurface mb-1">{selectedItem ? 'Edit Committee' : 'Create Committee'}</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Committee Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Cultural Committee" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Committee responsibilities..." className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Faculty Advisor</label>
                <input type="text" value={form.faculty_name} onChange={e => setForm({...form, faculty_name: e.target.value})} placeholder="Dr. M. Santhi (HOD ECE)" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Student Coordinators</label>
                <input type="text" value={form.student_coordinators} onChange={e => setForm({...form, student_coordinators: e.target.value})} placeholder="Karthik S. (Final CSE), Priya S. (Final ECE)" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Meeting Location / Venue</label>
                <input type="text" value={form.location_text} onChange={e => setForm({...form, location_text: e.target.value})} placeholder="Santhanam Block Main Office" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Saving...' : 'Save Committee'}
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
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete Committee</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to delete <strong>{selectedItem.name}</strong> from PostgreSQL?
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

export default AdminCommittees;
