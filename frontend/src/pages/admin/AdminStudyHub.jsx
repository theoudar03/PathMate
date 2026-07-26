import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit, Download, X, Search, Link as LinkIcon } from 'lucide-react';
import { safeFetchJson } from '../../utils/api';

const AdminStudyHub = () => {
  const [materials, setMaterials] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMat, setSelectedMat] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filtDept, setFiltDept] = useState('all');

  // Form states
  const [form, setForm] = useState({
    title: '',
    file_url: '',
    document_type: 'note', // 'note' | 'question_bank' | 'syllabus' | 'curriculum' | 'lab_manual' | 'book'
    department_id: '',
    semester: 1,
    subject: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('pm_admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [matsRes, deptsRes] = await Promise.all([
        fetch('/api/admin/study-materials', { headers }),
        fetch('/api/admin/departments', { headers })
      ]);

      if (matsRes.ok) setMaterials(await matsRes.json());
      if (deptsRes.ok) setDepts(await deptsRes.json());
    } catch (err) {
      console.error(err);
      setError('Failed to load study resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setSelectedMat(null);
    setForm({
      title: '',
      file_url: '',
      document_type: 'note',
      department_id: depts[0]?.id || '',
      semester: 1,
      subject: ''
    });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setSelectedMat(m);
    setForm({
      title: m.title || '',
      file_url: m.file_url || '',
      document_type: m.document_type || 'note',
      department_id: m.department_id || '',
      semester: m.semester || 1,
      subject: m.subject || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('pm_admin_token');
    const method = selectedMat ? 'PUT' : 'POST';
    const url = selectedMat ? `/api/admin/study-materials/${selectedMat.id}` : '/api/admin/study-materials';

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
        setError(body.error || 'Failed to save document record');
      }
    } catch (err) {
      setError('Network error saving file details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study resource?')) return;
    const token = localStorage.getItem('pm_admin_token');
    try {
      const res = await fetch(`/api/admin/study-materials/${id}`, {
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

  // Filter materials list
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filtDept === 'all' || String(m.department_id) === String(filtDept);
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return <div className="text-center py-12 text-xs font-semibold text-onSurfaceVariant">Loading Study Materials...</div>;
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-onSurface tracking-tight">Study Hub Manager</h1>
          <p className="text-xs text-onSurfaceVariant font-medium">Coordinate course notes, lab manuals, curriculum documents, and question bank indexes.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-primaryHover transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          <span>Upload Material</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-4 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-outline/25 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-2xs">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-3 text-onSurfaceVariant/60" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-outline/35 rounded-xl text-xs bg-slate-50 outline-none text-onSurface focus:border-primary"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          <select
            value={filtDept}
            onChange={(e) => setFiltDept(e.target.value)}
            className="px-3.5 py-2 border border-outline/35 rounded-xl text-xs bg-slate-50 outline-none font-bold text-onSurface"
          >
            <option value="all">All Departments</option>
            {depts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="bg-surface border border-outline/20 rounded-3xl overflow-hidden shadow-2xs">
        <table className="w-full border-collapse text-xs text-left">
          <thead className="bg-slate-50 border-b border-outline/10 text-[10px] font-black uppercase text-onSurfaceVariant/80 tracking-wider">
            <tr>
              <th className="px-6 py-4">Title & Subject</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Department & Sem</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10 font-medium text-onSurface">
            {filteredMaterials.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="font-extrabold text-primary hover:underline flex items-center gap-1">
                      <span>{m.title}</span>
                      <LinkIcon size={12} />
                    </a>
                    <p className="text-[10px] text-onSurfaceVariant/85 mt-0.5">{m.subject}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-full uppercase">
                    {m.document_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p>{m.department_name || 'General'}</p>
                  <p className="text-[10px] text-onSurfaceVariant mt-0.5">Semester {m.semester}</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => openEdit(m)} className="p-1.5 hover:bg-slate-100 rounded-lg text-primary transition-colors cursor-pointer">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredMaterials.length === 0 && (
          <p className="text-center text-xs text-onSurfaceVariant/60 py-12 italic">No study resources uploaded.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full shadow-2xl overflow-hidden border border-outline/10 flex flex-col">
            <div className="px-6 py-5 bg-primary text-white flex justify-between items-center">
              <h2 className="text-lg font-black tracking-tight">{selectedMat ? 'Edit Study File' : 'Upload Study File'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics-I Question Bank 2024"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Subject & Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MA3151 Matrices & Calculus"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Document Type</label>
                  <select
                    value={form.document_type}
                    onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    <option value="note">Course Note</option>
                    <option value="question_bank">Question Bank</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="curriculum">Curriculum</option>
                    <option value="lab_manual">Lab Manual</option>
                    <option value="book">Reference Book</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Semester</label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">Department Target</label>
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
                <label className="block text-[10px] font-black uppercase text-onSurfaceVariant/85 mb-1.5">File Drive URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/..."
                  value={form.file_url}
                  onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                  className="w-full px-3 py-2 border border-outline/30 rounded-xl text-xs outline-none bg-slate-50 focus:border-primary text-onSurface"
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

export default AdminStudyHub;
