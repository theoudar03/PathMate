import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Edit, Calendar, MapPin, ExternalLink, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminPlacements = () => {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

  // Form states
  const [form, setForm] = useState({
    company: '',
    package_details: '',
    eligibility: '',
    registration_link: '',
    drive_date: '',
    venue: '',
    rounds: []
  });

  const [roundInput, setRoundInput] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/placements', { headers });
      if (res.ok) setPlacements(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load placement drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedPlacement(null);
    setForm({
      company: '',
      package_details: '',
      eligibility: '',
      registration_link: '',
      drive_date: '',
      venue: 'MBA Seminar Hall',
      rounds: ['Online Aptitude Test', 'Technical Interview', 'HR Interview']
    });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setSelectedPlacement(p);
    setForm({
      company: p.company || '',
      package_details: p.package_details || '',
      eligibility: p.eligibility || '',
      registration_link: p.registration_link || '',
      drive_date: p.drive_date ? new Date(p.drive_date).toISOString().slice(0, 16) : '',
      venue: p.venue || '',
      rounds: p.rounds || []
    });
    setShowModal(true);
  };

  const addRound = () => {
    if (roundInput.trim()) {
      setForm({ ...form, rounds: [...form.rounds, roundInput.trim()] });
      setRoundInput('');
    }
  };

  const removeRound = (index) => {
    setForm({ ...form, rounds: form.rounds.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedPlacement ? 'PUT' : 'POST';
    const url = selectedPlacement ? `/api/admin/placements/${selectedPlacement.id}` : '/api/admin/placements';

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
        setError(body.error || 'Failed to save placement drive');
      }
    } catch (err) {
      setError('Network error saving placement drive details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/placements/${id}`, {
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
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Placement Drives...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Placement Drives</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate company recruiters, packages, and eligibility criteria.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Drive</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placements.map((p) => (
          <div key={p.id} className="bg-surface border border-outline/20 rounded-3xl p-5 shadow-2xs relative flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base flex-shrink-0 border border-indigo-200">
                  {p.company ? p.company.charAt(0) : 'P'}
                </div>
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{p.company}</h3>
                  <p className="text-[10px] text-onSurfaceVariant/85 font-bold uppercase tracking-wider">{p.package_details || 'Salary Package not shared'}</p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-onSurfaceVariant font-medium">
                <p className="flex items-center gap-2">
                  <Calendar size={13} className="text-primary" />
                  <span>{new Date(p.drive_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin size={13} className="text-primary" />
                  <span>{p.venue}</span>
                </p>
                <p className="text-[11px] leading-relaxed text-onSurfaceVariant/90 whitespace-pre-line mt-1">
                  <strong>Eligibility:</strong> {p.eligibility || 'All UG & PG Students'}
                </p>
                {p.rounds && p.rounds.length > 0 && (
                  <div className="pt-1">
                    <strong>Interview Rounds:</strong>
                    <ol className="list-decimal list-inside text-[11px] mt-1 space-y-0.5 text-onSurfaceVariant/85">
                      {p.rounds.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-outline/10">
              <div>
                {p.registration_link && (
                  <a
                    href={p.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                  >
                    <span>Register</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-primary transition-colors cursor-pointer"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedPlacement ? 'Edit Placement Drive' : 'Publish Placement Drive'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zoho Corporation"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Salary Package</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8.5 LPA"
                    value={form.package_details}
                    onChange={(e) => setForm({ ...form, package_details: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Drive Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.drive_date}
                    onChange={(e) => setForm({ ...form, drive_date: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Venue</label>
                  <input
                    type="text"
                    required
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Registration Link</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={form.registration_link}
                    onChange={(e) => setForm({ ...form, registration_link: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Eligibility Criteria</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. CSE / IT / ECE CGPA > 7.5 with no history of backlogs"
                  value={form.eligibility}
                  onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Recruitment Rounds</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add round..."
                    value={roundInput}
                    onChange={(e) => setRoundInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                  <button type="button" onClick={addRound} className="px-3 bg-slate-100 hover:bg-slate-200 border border-outline/30 rounded-xl text-xs font-bold text-onSurface cursor-pointer">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.rounds.map((round, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-onSurfaceVariant text-[10px] font-bold px-2 py-1 rounded-lg">
                      <span>{round}</span>
                      <button type="button" onClick={() => removeRound(idx)} className="hover:bg-slate-200 p-0.5 rounded-full text-red-500 cursor-pointer">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
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

export default AdminPlacements;
