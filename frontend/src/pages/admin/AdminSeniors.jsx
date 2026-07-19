import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2 } from 'lucide-react';

const AdminSeniors = () => {
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSeniors = async () => {
      try {
        const token = localStorage.getItem('pm_admin_token');
        const res = await fetch('/api/admin/seniors', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setSeniors(await res.json());
      } catch (err) {} finally { setLoading(false); }
    };
    fetchSeniors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this senior?')) return;
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/seniors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSeniors(seniors.filter(s => s.id !== id));
    } catch (err) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const token = localStorage.getItem('pm_admin_token');
      const res = await fetch(`/api/admin/seniors`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSeniors([await res.json(), ...seniors]);
        setShowModal(false);
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-onSurface">Senior Connection</h1>
          <p className="text-onSurfaceVariant text-sm">Manage senior student mentors</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-primary text-onPrimary px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus size={18} /> Add Senior
        </button>
      </div>

      <div className="bg-surface border border-surfaceVariant rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surfaceVariant/30 text-onSurfaceVariant border-b border-surfaceVariant/50">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Dept ID</th>
              <th className="px-6 py-4 font-medium">Interests</th>
              <th className="px-6 py-4 font-medium">Active</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surfaceVariant/50">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-onSurfaceVariant">Loading...</td></tr>
            ) : seniors.map((s) => (
              <tr key={s.id}>
                <td className="px-6 py-4 font-semibold text-onSurface">{s.name}</td>
                <td className="px-6 py-4 text-onSurfaceVariant">{s.department_id}</td>
                <td className="px-6 py-4 text-onSurfaceVariant truncate max-w-[150px]">{s.interests}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {s.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(s.id)} className="text-error p-2 hover:bg-error/10 rounded-lg"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surfaceVariant border border-surfaceVariant/50 rounded-3xl p-6 w-full max-w-md shadow-elevation3">
            <h2 className="text-xl font-bold text-onSurface mb-4">Add Senior Mentor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input name="name" placeholder="Full Name" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <input name="department_id" type="number" placeholder="Department ID (e.g., 1 for CSE)" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <input name="interests" placeholder="Interests (e.g., AI, Web Dev)" required className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <input name="linkedin_url" placeholder="LinkedIn URL" className="w-full bg-surface border border-surfaceVariant rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary" />
              <div className="flex gap-3 justify-end mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-onSurfaceVariant hover:bg-surfaceVariant/50 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-onPrimary rounded-xl">Add Senior</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSeniors;
