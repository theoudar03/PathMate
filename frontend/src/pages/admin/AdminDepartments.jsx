import React, { useState, useEffect } from 'react';
import { Building, Plus, Trash2, Edit, Eye, Check, X, ShieldAlert } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminDepartments = () => {
  const [depts, setDepts] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    intake: 60,
    hod_id: '',
    vision: '',
    mission: '',
    programme_outcomes: '',
    images: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [deptsRes, facRes] = await Promise.all([
        fetch('/api/admin/departments', { headers }),
        fetch('/api/admin/faculty', { headers })
      ]);

      if (deptsRes.ok) setDepts(await deptsRes.ok ? await deptsRes.json() : []);
      if (facRes.ok) setFaculty(await facRes.json());
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
    setSelectedDept(null);
    setForm({
      name: '',
      intake: 60,
      hod_id: faculty[0]?.id || '',
      vision: '',
      mission: '',
      programme_outcomes: '',
      images: []
    });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setSelectedDept(d);
    setForm({
      name: d.name || '',
      intake: d.intake || 60,
      hod_id: d.hod_id || '',
      vision: d.vision || '',
      mission: d.mission || '',
      programme_outcomes: d.programme_outcomes || '',
      images: d.images || []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedDept ? 'PUT' : 'POST';
    const url = selectedDept ? `/api/admin/departments/${selectedDept.id}` : '/api/admin/departments';

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
        setError(body.error || 'Failed to save department details');
      }
    } catch (err) {
      setError('Network error saving department details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This will affect related faculty and student references.')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
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
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Department configurations...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Department Management</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate departments, student intake capacity, vision, and mission.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Department</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {depts.map((d) => (
          <div key={d.id} className="bg-surface border border-outline/20 rounded-3xl p-6 shadow-2xs relative flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-onSurface text-base leading-tight">{d.name}</h3>
                    <p className="text-[10px] text-onSurfaceVariant/80 font-bold uppercase tracking-wider mt-0.5">
                      Intake: {d.intake || 60} Students
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-onSurfaceVariant font-medium">
                <div>
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">Head of Department (HOD)</span>
                  <p className="text-onSurface font-bold">{d.hod_name || 'Not Assigned'}</p>
                </div>
                {d.vision && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">Vision</span>
                    <p className="italic text-onSurfaceVariant/90">"{d.vision}"</p>
                  </div>
                )}
                {d.mission && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest block mb-1">Mission</span>
                    <p className="whitespace-pre-line text-onSurfaceVariant/90">{d.mission}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-outline/10">
              <button
                onClick={() => openEdit(d)}
                className="p-2 hover:bg-surfaceContainer rounded-xl text-primary transition-colors cursor-pointer"
                title="Edit Department"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(d.id)}
                className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
                title="Delete Department"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedDept ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Department Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mechanical Engineering"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Intake Capacity</label>
                  <input
                    type="number"
                    required
                    value={form.intake}
                    onChange={(e) => setForm({ ...form, intake: parseInt(e.target.value) || 60 })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Head of Department (HOD)</label>
                <select
                  value={form.hod_id}
                  onChange={(e) => setForm({ ...form, hod_id: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                >
                  <option value="">Select HOD...</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Vision Statement</label>
                <textarea
                  rows={2}
                  value={form.vision}
                  onChange={(e) => setForm({ ...form, vision: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Mission Statement</label>
                <textarea
                  rows={3}
                  value={form.mission}
                  onChange={(e) => setForm({ ...form, mission: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Programme Outcomes (PO)</label>
                <textarea
                  rows={3}
                  value={form.programme_outcomes}
                  onChange={(e) => setForm({ ...form, programme_outcomes: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
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

export default AdminDepartments;
