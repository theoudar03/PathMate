import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const AdminVolunteers = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/volunteers', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setVolunteers(await res.json());
      } catch (err) {} finally { setLoading(false); }
    };
    fetchVolunteers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this volunteer?')) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/volunteers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setVolunteers(volunteers.filter(v => v.id !== id));
    } catch (err) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/volunteers`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setVolunteers([await res.json(), ...volunteers]);
        setShowModal(false);
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Volunteers</h1>
          <p className="text-onSurfaceVariant text-sm">Manage student volunteers for events</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-onPrimary px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={18} /> Assign Volunteer
        </button>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
            <tr>
              <th className="px-6 py-4 font-medium">User ID</th>
              <th className="px-6 py-4 font-medium">Event ID</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceVariant/50">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-onSurfaceVariant">Loading...</td></tr>
            ) : volunteers.map((v) => (
              <tr key={v.id}>
                <td className="px-6 py-4 font-semibold text-onSurface">{v.user_id}</td>
                <td className="px-6 py-4 text-onSurfaceVariant">{v.event_id}</td>
                <td className="px-6 py-4 font-medium text-onSurface">{v.role}</td>
                <td className="px-6 py-4"><span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">{v.status}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(v.id)} className="text-error p-2 hover:bg-error/10 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surfaceVariant border border-surfaceVariant/50 rounded-3xl p-6 w-full max-w-md shadow-elevation3">
            <h2 className="text-xl font-bold text-onSurface mb-4">Assign Volunteer</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="user_id" type="number" placeholder="Student User ID" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <input name="event_id" type="number" placeholder="Event ID" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <input name="role" placeholder="Role (e.g., Coordinator)" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-onSurfaceVariant hover:bg-surfaceVariant/50 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-onPrimary rounded-xl">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVolunteers;
