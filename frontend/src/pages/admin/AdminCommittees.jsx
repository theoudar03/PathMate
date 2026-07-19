import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

const AdminCommittees = () => {
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/committees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setCommittees(await res.json());
      } catch (err) {
        console.error("Error fetching committees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommittees();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this committee?')) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/committees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCommittees(committees.filter(c => c.id !== id));
    } catch (err) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/committees`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setCommittees([await res.json(), ...committees]);
        setShowModal(false);
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Committees</h1>
          <p className="text-onSurfaceVariant text-sm">Manage campus committees</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-onPrimary px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={18} /> Create Committee
        </button>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceVariant/50">
            {loading ? (
              <tr><td colSpan="3" className="p-8 text-center text-onSurfaceVariant">Loading...</td></tr>
            ) : committees.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 font-semibold text-onSurface">{c.name}</td>
                <td className="px-6 py-4"><span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold">{c.status}</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(c.id)} className="text-error p-2 hover:bg-error/10 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surfaceVariant border border-surfaceVariant/50 rounded-3xl p-6 w-full max-w-md shadow-elevation3">
            <h2 className="text-xl font-bold text-onSurface mb-4">Create Committee</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="name" placeholder="Committee Name" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <textarea name="description" placeholder="Description" rows="3" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary"></textarea>
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-onSurfaceVariant hover:bg-surfaceVariant/50 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-onPrimary rounded-xl">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCommittees;
