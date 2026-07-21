import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CheckCircle, XCircle, Clock, X } from 'lucide-react';

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form state
  const [form, setForm] = useState({ name: '', event_id: '', role: 'Event Volunteer', status: 'pending' });
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [vRes, eRes] = await Promise.all([
        fetch('/api/admin/volunteers', { headers }),
        fetch('/api/admin/events', { headers })
      ]);

      if (vRes.ok) setVolunteers(await vRes.json());
      if (eRes.ok) setEvents(await eRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (volunteer, newStatus) => {
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/volunteers/${volunteer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('pm_admin_token');
      const method = selectedItem ? 'PUT' : 'POST';
      const url = selectedItem ? `/api/admin/volunteers/${selectedItem.id}` : '/api/admin/volunteers';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save volunteer');

      setShowModal(false);
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
      const res = await fetch(`/api/admin/volunteers/${selectedItem.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete volunteer assignment');

      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-surfaceVariant/60 rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Event Volunteers & Registrations</h1>
          <p className="text-xs text-onSurfaceVariant font-medium mt-1">
            Assign and approve student volunteers for campus hackathons and institutional events.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedItem(null);
            setForm({ name: '', event_id: events[0]?.id || '', role: 'Event Volunteer', status: 'pending' });
            setErrorMsg('');
            setShowModal(true);
          }}
          className="bg-primary hover:bg-primaryHover text-onPrimary font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Assign Volunteer</span>
        </button>
      </div>

      {/* Roster Table */}
      <div className="bg-surface border border-surfaceVariant/60 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surfaceContainerHigh text-onSurfaceVariant font-extrabold uppercase tracking-wider border-b border-outline/20">
              <tr>
                <th className="px-5 py-3.5">Volunteer Student</th>
                <th className="px-5 py-3.5">Assigned Event</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/15 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-onSurfaceVariant font-semibold">Loading Volunteers from PostgreSQL...</td>
                </tr>
              ) : volunteers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-onSurfaceVariant italic">No volunteer assignments recorded yet.</td>
                </tr>
              ) : (
                volunteers.map((v) => {
                  let statusBadge = "bg-amber-100 text-amber-800 border-amber-300";
                  if (v.status === 'approved') statusBadge = "bg-emerald-100 text-emerald-800 border-emerald-300";
                  else if (v.status === 'rejected') statusBadge = "bg-rose-100 text-rose-800 border-rose-300";

                  return (
                    <tr key={v.id} className="hover:bg-surfaceContainerLow/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-onSurface">
                        {v.volunteer_name || v.student_full_name || `Student ID ${v.user_id}`}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-primary">
                        {v.event_name || `Event ID ${v.event_id || 'General'}`}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-onSurfaceVariant">
                        {v.role}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border tracking-wider ${statusBadge}`}>
                          {v.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(v, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                              title="Approve Volunteer"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          {v.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(v, 'rejected')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                              title="Reject Volunteer"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedItem(v); setShowDeleteModal(true); }}
                            className="p-1 text-onSurfaceVariant hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-outline/30 rounded-[28px] max-w-md w-full p-6 text-left shadow-2xl relative animate-scale-up">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 text-onSurfaceVariant"><X size={18} /></button>
            <h3 className="text-xl font-black text-onSurface mb-1">Assign Volunteer Role</h3>

            {errorMsg && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl font-bold mb-3">{errorMsg}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs mt-4">
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Volunteer Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Student Name" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Assigned Event</label>
                <select value={form.event_id} onChange={e => setForm({...form, event_id: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                  <option value="">-- General Event Assignment --</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Assigned Role</label>
                <input type="text" required value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="e.g. Technical Desk Lead" className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow" />
              </div>
              <div>
                <label className="block font-bold text-onSurfaceVariant mb-1 uppercase">Initial Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-2.5 border rounded-xl bg-surfaceContainerLow font-bold">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-surfaceVariant rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-5 py-2 bg-primary text-onPrimary font-bold rounded-xl shadow-md">
                  {actionLoading ? 'Assigning...' : 'Save Volunteer'}
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
            <h3 className="text-xl font-black text-rose-700 mb-2">Delete Volunteer Assignment</h3>
            <p className="text-xs text-onSurfaceVariant leading-relaxed mb-6">
              Are you sure you want to remove volunteer assignment <strong>{selectedItem.volunteer_name || selectedItem.role}</strong>?
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

export default AdminVolunteers;
