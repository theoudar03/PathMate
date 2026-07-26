import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Trash2, Edit, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminRoles = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form states
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'ADMIN', // 'SUPER_ADMIN' | 'ADMIN' | 'PRINCIPAL' | 'HOD' | 'FACULTY_ADMIN'
    is_active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/roles/list', { headers });
      if (res.ok) setAdmins(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrator roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedAdmin(null);
    setForm({
      username: '',
      password: '',
      full_name: '',
      role: 'ADMIN',
      is_active: true
    });
    setShowModal(true);
  };

  const openEdit = (a) => {
    setSelectedAdmin(a);
    setForm({
      username: a.username || '',
      password: '', // blank to preserve password
      full_name: a.full_name || '',
      role: a.role || 'ADMIN',
      is_active: a.is_active !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedAdmin ? 'PUT' : 'POST';
    const url = selectedAdmin ? `/api/admin/roles/details/${selectedAdmin.id}` : '/api/admin/roles/create';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save admin user details');
      }
    } catch (err) {
      setError('Network error saving details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this admin user? They will lose access immediately.')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/roles/details/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Administrator permissions...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Admin Roles & Permissions</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate roles (Principal, HOD, Faculty Admin) and access configurations.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Admin</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-surface border border-outline/20 rounded-3xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-outline/10 text-[10px] font-black uppercase text-onSurfaceVariant/80 tracking-wider">
            <tr>
              <th className="px-6 py-4">Username & Name</th>
              <th className="px-6 py-4">Role Assigned</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Last Login</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10 font-semibold text-onSurface">
            {admins.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-extrabold text-onSurface">{a.full_name || 'Admin User'}</p>
                    <p className="text-[10px] text-onSurfaceVariant mt-0.5">@{a.username}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">
                    {a.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {a.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {a.last_login ? new Date(a.last_login).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-slate-100 rounded-lg text-primary transition-colors cursor-pointer">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedAdmin ? 'Edit Administrator' : 'Create Administrator'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Srinivasan"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. srinivasan_hod"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Role Permission</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    <option value="SUPER_ADMIN">Super Administrator</option>
                    <option value="ADMIN">Regular Admin</option>
                    <option value="PRINCIPAL">Principal Account</option>
                    <option value="HOD">Department HOD</option>
                    <option value="FACULTY_ADMIN">Faculty Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Password {selectedAdmin && '(Leave blank to preserve)'}</label>
                <input
                  type="password"
                  required={!selectedAdmin}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded text-primary border-outline/30 focus:ring-primary w-4 h-4"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-onSurface cursor-pointer">Account is Active</label>
              </div>

              <div className="pt-4 border-t border-outline/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline/30 hover:bg-slate-50 rounded-xl text-xs font-bold text-onSurfaceVariant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-colors cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
