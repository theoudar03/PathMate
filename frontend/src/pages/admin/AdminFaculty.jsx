import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, Mail, Calendar, Phone, Check, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    department_id: '',
    designation: '',
    contact_email: '',
    photo: '',
    office_hours: '',
    hod_status: false,
    principal_status: false,
    cabin: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [facRes, deptsRes] = await Promise.all([
        fetch('/api/admin/faculty', { headers }),
        fetch('/api/admin/departments', { headers })
      ]);
      
      if (facRes.ok) setFaculty(await facRes.json());
      if (deptsRes.ok) setDepts(await deptsRes.json());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedFaculty(null);
    setForm({
      name: '',
      department_id: depts[0]?.id || '',
      designation: 'Assistant Professor',
      contact_email: '',
      photo: '',
      office_hours: '09:00 AM - 04:00 PM',
      hod_status: false,
      principal_status: false,
      cabin: ''
    });
    setShowModal(true);
  };

  const openEdit = (f) => {
    setSelectedFaculty(f);
    setForm({
      name: f.name || '',
      department_id: f.department_id || '',
      designation: f.designation || '',
      contact_email: f.contact_email || '',
      photo: f.photo || '',
      office_hours: f.office_hours || '',
      hod_status: f.hod_status || false,
      principal_status: f.principal_status || false,
      cabin: f.cabin || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedFaculty ? 'PUT' : 'POST';
    const url = selectedFaculty ? `/api/admin/faculty/${selectedFaculty.id}` : '/api/admin/faculty';

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
        setError(body.error || 'Failed to save faculty record');
      }
    } catch (err) {
      setError('Network error saving faculty details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, {
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
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Faculty Registry...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Faculty Management</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate instructors, office cabins, and designations.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Faculty</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((f) => (
          <div key={f.id} className="bg-surface border border-outline/20 rounded-3xl p-5 shadow-2xs relative flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={f.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=1B4DA6&color=fff&size=128`}
                  alt={f.name}
                  className="w-12 h-12 rounded-full object-cover border border-outline/10 shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{f.name}</h3>
                  <p className="text-[10px] text-onSurfaceVariant/80 font-bold uppercase tracking-wider">{f.designation}</p>
                </div>
              </div>
              
              <div className="text-xs space-y-1.5 text-onSurfaceVariant font-medium">
                <p className="flex items-center gap-2">
                  <Mail size={13} className="text-primary" />
                  <span>{f.contact_email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={13} className="text-primary" />
                  <span>Office: {f.office_hours || '09:00 AM - 04:00 PM'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[15px] text-primary">meeting_room</span>
                  <span>Cabin: {f.cabin || 'Not Assigned'}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">
                    {f.department_name || 'General'}
                  </span>
                  {f.hod_status && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-full uppercase border border-amber-300">
                      HOD
                    </span>
                  )}
                  {f.principal_status && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[9px] font-black rounded-full uppercase border border-purple-300">
                      Principal
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
              <button
                onClick={() => openEdit(f)}
                className="p-2 hover:bg-surfaceContainer rounded-xl text-primary transition-colors cursor-pointer"
                title="Edit Details"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(f.id)}
                className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
                title="Remove Faculty"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedFaculty ? 'Edit Faculty Member' : 'Add Faculty Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Department</label>
                  <select
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    {depts.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Designation</label>
                  <input
                    type="text"
                    required
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Cabin</label>
                  <input
                    type="text"
                    placeholder="e.g. IT Block Room 102"
                    value={form.cabin}
                    onChange={(e) => setForm({ ...form, cabin: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Office Hours</label>
                  <input
                    type="text"
                    value={form.office_hours}
                    onChange={(e) => setForm({ ...form, office_hours: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Photo URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={form.photo}
                  onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-onSurface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hod_status}
                    onChange={(e) => setForm({ ...form, hod_status: e.target.checked })}
                    className="rounded text-primary border-outline/30 focus:ring-primary w-4 h-4"
                  />
                  <span>Is Head of Department (HOD)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-onSurface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.principal_status}
                    onChange={(e) => setForm({ ...form, principal_status: e.target.checked })}
                    className="rounded text-primary border-outline/30 focus:ring-primary w-4 h-4"
                  />
                  <span>Is College Principal</span>
                </label>
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

export default AdminFaculty;
