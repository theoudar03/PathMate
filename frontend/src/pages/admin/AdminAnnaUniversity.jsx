import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, Edit, X } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminAnnaUniversity = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  // Form states
  const [form, setForm] = useState({
    regulation_year: 2024,
    rule_category: 'academic_standing', // 'academic_standing' | 'attendance' | 'grading_scale' | 'internal_assessment' | 'examinations'
    rule_title: '',
    rule_description: '',
    details_json: {}
  });

  const [detailsString, setDetailsString] = useState('{}');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch('/api/admin/anna-university/rules', { headers });
      if (res.ok) setRules(await res.json());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AU rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedRule(null);
    setForm({
      regulation_year: 2024,
      rule_category: 'attendance',
      rule_title: '',
      rule_description: '',
      details_json: {}
    });
    setDetailsString('{}');
    setShowModal(true);
  };

  const openEdit = (r) => {
    setSelectedRule(r);
    setForm({
      regulation_year: r.regulation_year || 2024,
      rule_category: r.rule_category || 'attendance',
      rule_title: r.rule_title || '',
      rule_description: r.rule_description || '',
      details_json: r.details_json || {}
    });
    setDetailsString(JSON.stringify(r.details_json || {}, null, 2));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Parse JSON details
    let parsedDetails = {};
    try {
      parsedDetails = JSON.parse(detailsString);
    } catch (err) {
      setError('JSON Details contains syntax errors. Make sure it is valid JSON.');
      return;
    }

    const payload = { ...form, details_json: parsedDetails };
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedRule ? 'PUT' : 'POST';
    const url = selectedRule ? `/api/admin/anna-university/rules/${selectedRule.id}` : '/api/admin/anna-university/rules';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      } else {
        const body = await res.json();
        setError(body.error || 'Failed to save regulation detail');
      }
    } catch (err) {
      setError('Network error saving details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this academic regulation rule?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/anna-university/rules/${id}`, {
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
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Anna University Regulations...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Anna University Rules</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Control panel to coordinate CGPA criteria, attendance margins, and academic standing rules.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Rule</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((r) => (
          <div key={r.id} className="bg-surface border border-outline/20 rounded-3xl p-5 shadow-2xs relative flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 flex-shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-onSurface text-sm">{r.rule_title}</h3>
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="text-[9px] bg-primaryContainer/30 text-primary font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Regulation {r.regulation_year}
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {r.rule_category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-onSurfaceVariant font-medium leading-relaxed">
                <p className="whitespace-pre-line text-onSurfaceVariant/90">{r.rule_description}</p>
                {r.details_json && Object.keys(r.details_json).length > 0 && (
                  <pre className="bg-slate-50 p-3 rounded-xl text-[10px] text-onSurfaceVariant/80 font-mono mt-2 overflow-x-auto max-h-[120px]">
                    {JSON.stringify(r.details_json, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline/10">
              <button
                onClick={() => openEdit(r)}
                className="p-2 hover:bg-slate-100 rounded-xl text-primary transition-colors cursor-pointer"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedRule ? 'Edit Rule Details' : 'Add University Rule'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Regulation Year</label>
                  <input
                    type="number"
                    required
                    value={form.regulation_year}
                    onChange={(e) => setForm({ ...form, regulation_year: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Category</label>
                  <select
                    value={form.rule_category}
                    onChange={(e) => setForm({ ...form, rule_category: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    <option value="attendance">Attendance Rule</option>
                    <option value="academic_standing">Academic Standing</option>
                    <option value="grading_scale">Grading Scale</option>
                    <option value="internal_assessment">Internal Assessment</option>
                    <option value="examinations">Examinations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Rule Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Attendance Requirements for Examinations"
                  value={form.rule_title}
                  onChange={(e) => setForm({ ...form, rule_title: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Rule Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the core requirements of this rule..."
                  value={form.rule_description}
                  onChange={(e) => setForm({ ...form, rule_description: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">JSON Parameters (Details Object)</label>
                <textarea
                  rows={4}
                  value={detailsString}
                  onChange={(e) => setDetailsString(e.target.value)}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-[11px] font-mono outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
                <span className="text-[9px] text-onSurfaceVariant/70 block mt-1">Provide strict key-value pairs (e.g. {"{\"min_attendance\": 75, \"medical_condonation_limit\": 65}"}).</span>
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

export default AdminAnnaUniversity;
